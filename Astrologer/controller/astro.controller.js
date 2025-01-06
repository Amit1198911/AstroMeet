const redis = require('redis');
const Astro = require('../models/astro.models.js');

// Create Redis client with error handling
const redisClient = redis.createClient({
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
    }
});

redisClient.on('error', (err) => {
    console.error('Redis Error:', err);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('end', () => {
    console.log('Redis client disconnected');
});

async function ensureRedisConnection() {
    if (!redisClient.isOpen) {
        await redisClient.connect().catch((err) => {
            console.error('Failed to connect to Redis:', err);
        });
    }
}

// @desc Generate multiple astrologers from an array of astrologer objects
// @route POST /api/v1/astrologers/batch
exports.generateAstrologers = async (req, res) => {
    const astrologersData = req.body.astrologers; // Array of astrologer objects

    if (!Array.isArray(astrologersData) || astrologersData.length === 0) {
        return res.status(400).json({ message: 'Invalid input, expected an array of astrologer objects.' });
    }

    try {
        const results = await Promise.allSettled(
            astrologersData.map(async (astroData) => {
                const { name, email, specialization, experience, isTopAstro } = astroData;
                const existingAstrologer = await Astro.findOne({ email });

                if (existingAstrologer) {
                    throw new Error(`Astrologer with email ${email} already exists.`);
                }

                const newAstrologer = new Astro({
                    name, email, specialization, experience, isTopAstro
                });

                return await newAstrologer.save();
            })
        );

        const successfulAstrologers = results.filter(r => r.status === 'fulfilled').map(r => r.value);
        const failedAstrologers = results.filter(r => r.status === 'rejected');

        await ensureRedisConnection();
        await redisClient.del('allAstrologers');

        res.status(201).json({
            message: `${successfulAstrologers.length} astrologers registered successfully`,
            failed: failedAstrologers.map(f => f.reason.message),
            astrologers: successfulAstrologers
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating astrologers', error: error.message });
    }
};

// @desc Create a new astrologer
// @route POST /api/v1/astrologers
exports.createAstrologer = async (req, res) => {
    try {
        const newAstrologer = new Astro(req.body);
        const savedAstrologer = await newAstrologer.save();

        await ensureRedisConnection();
        await redisClient.del('allAstrologers');

        res.status(201).json(savedAstrologer);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create astrologer', error: error.message });
    }
};

// @desc Get all astrologers (with optional filtering and caching)
// @route GET /api/v1/astrologers
exports.getAllAstrologers = async (req, res) => {
    const { isTopAstro } = req.query;
    const filterKey = isTopAstro ? `allAstrologers:isTopAstro:${isTopAstro}` : 'allAstrologers';

    try {
        await ensureRedisConnection();
        const cachedData = await redisClient.get(filterKey);

        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const filter = isTopAstro ? { isTopAstro: isTopAstro === 'true' } : {};
        const astrologers = await Astro.find(filter).populate('curr_connections');

        await redisClient.setEx(filterKey, 3600, JSON.stringify(astrologers));
        res.status(200).json(astrologers);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch astrologers', error: error.message });
    }
};

// @desc Get a single astrologer by ID (with caching)
// @route GET /api/v1/astrologers/:id
exports.getAstrologerById = async (req, res) => {
    const astroId = req.params.id;

    try {
        await ensureRedisConnection();
        const cachedData = await redisClient.get(`astrologer:${astroId}`);

        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const astrologer = await Astro.findById(astroId).populate('curr_connections');
        if (!astrologer) {
            return res.status(404).json({ message: 'Astrologer not found' });
        }

        await redisClient.setEx(`astrologer:${astroId}`, 3600, JSON.stringify(astrologer));
        res.status(200).json(astrologer);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving astrologer', error: error.message });
    }
};

// @desc Update an astrologer by ID
// @route PUT /api/v1/astrologers/:id
exports.updateAstrologer = async (req, res) => {
    const astroId = req.params.id;

    try {
        const updatedAstrologer = await Astro.findByIdAndUpdate(
            astroId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedAstrologer) {
            return res.status(404).json({ message: 'Astrologer not found' });
        }

        await ensureRedisConnection();
        await redisClient.del(`astrologer:${astroId}`);
        await redisClient.del('allAstrologers');

        res.status(200).json(updatedAstrologer);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update astrologer', error: error.message });
    }
};

// @desc Delete an astrologer by ID
// @route DELETE /api/v1/astrologers/:id
exports.deleteAstrologer = async (req, res) => {
    const astroId = req.params.id;

    try {
        const deletedAstrologer = await Astro.findByIdAndDelete(astroId);

        if (!deletedAstrologer) {
            return res.status(404).json({ message: 'Astrologer not found' });
        }

        // Ensure Redis is connected and clear cache related to the deleted astrologer
        await ensureRedisConnection();
        await redisClient.del(`astrologer:${astroId}`);
        await redisClient.del('allAstrologers');

        res.status(200).json({ message: 'Astrologer deleted successfully', astrologer: deletedAstrologer });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete astrologer', error: error.message });
    }
};


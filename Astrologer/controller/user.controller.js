const redis = require('redis');
const User = require('../models/user.models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../utils/jwt');

let redisClient;

// Function to initialize or reconnect Redis
const initRedis = async () => {
    if (redisClient && redisClient.isOpen) {
        return;  // Redis already connected
    }

    redisClient = redis.createClient({
        host: '127.0.0.1', // or 'localhost'
        port: 6379
    });

    redisClient.on('error', (err) => {
        console.error('Redis Error:', err);
    });

    redisClient.on('end', () => {
        console.warn('Redis client disconnected. Reconnecting...');
        initRedis();  // Reconnect
    });

    redisClient.on('connect', () => {
        console.log('Connected to Redis');
    });

    // Attempt to connect to Redis server
    await redisClient.connect().catch((err) => {
        console.error('Failed to connect to Redis:', err);
    });
};

// Initialize Redis on app start
initRedis();

// Function to generate multiple users from an array of user objects
exports.generateUsers = async (req, res) => {
    const usersData = req.body.users; // Array of user objects

    try {
        // Validate the structure of the input data
        if (!Array.isArray(usersData) || usersData.length === 0) {
            return res.status(400).json({ message: 'Invalid input, expected an array of user objects.' });
        }

        const userPromises = usersData.map(async (userData) => {
            const { name, email, password, role } = userData;

            // Check if the user already exists by email
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new Error(`User with email ${email} already exists.`);
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create a new user
            const newUser = new User({
                name,
                email,
                password: hashedPassword,
                role
            });

            // Save the new user to the database
            await newUser.save();

            return newUser; // Return the created user object
        });

        // Wait for all user creation promises to resolve
        const createdUsers = await Promise.all(userPromises);

        // Invalidate cache if Redis is connected
        if (redisClient.isOpen) {
            await redisClient.del('allUsers');
        }

        // Respond with success message and created users
        res.status(201).json({
            message: `${createdUsers.length} users registered successfully`,
            users: createdUsers.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }))
        });

    } catch (error) {
        res.status(500).json({ message: 'Error generating users', error: error.message });
    }
};


// Register a new user
exports.registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role
        });

        await newUser.save();

        const token = generateToken(newUser);

        // Invalidate all users cache if Redis is connected
        if (redisClient.isOpen) {
            await redisClient.del('allUsers');
        }

        res.status(201).json({ 
            message: 'User registered successfully', 
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
};

// User login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            } 
        });

    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

// Get user by ID (protected route, with caching)
exports.getUserById = async (req, res) => {
    const userId = req.params.id;

    try {
        // Ensure Redis is connected before using it
        if (!redisClient.isOpen) {
            await initRedis();
        }

        const cachedUser = await redisClient.get(`user:${userId}`);
        if (cachedUser) {
            return res.json(JSON.parse(cachedUser));  // Cache hit
        } else {
            const user = await User.findById(userId).populate('assignedAstrologer');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Cache the result for 1 hour
            await redisClient.setEx(`user:${userId}`, 3600, JSON.stringify(user));

            res.json(user);
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error });
    }
};

// Get all users (protected route, with caching)
exports.getAllUsers = async (req, res) => {
    try {
        // Ensure Redis is connected before using it
        if (!redisClient.isOpen) {
            await initRedis();
        }

        const cachedUsers = await redisClient.get('allUsers');
        if (cachedUsers) {
            return res.json(JSON.parse(cachedUsers));  // Cache hit
        } else {
            const users = await User.find().select('-password').populate('assignedAstrologer');

            // Cache the result for 1 hour
            await redisClient.setEx('allUsers', 3600, JSON.stringify(users));

            res.json(users);
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

// Update user (protected route)
exports.updateUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = await bcrypt.hash(password, 10);
        if (role) user.role = role;

        await user.save();

        // Update cache if Redis is connected
        if (redisClient.isOpen) {
            await redisClient.setEx(`user:${userId}`, 3600, JSON.stringify(user));
            await redisClient.del('allUsers'); // Invalidate users list cache
        }

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
    }
};

// Delete user (protected route)
exports.deleteUser = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Invalidate cache if Redis is connected
        if (redisClient.isOpen) {
            await redisClient.del(`user:${userId}`);
            await redisClient.del('allUsers');
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};

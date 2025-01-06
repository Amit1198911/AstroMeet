const express = require('express');
const router = express.Router();
const {
    createAstrologer,
    getAllAstrologers,
    getAstrologerById,
    updateAstrologer,
    deleteAstrologer,
    generateAstrologers
} = require('../controller/astro.controller.js');

router.post('/create', createAstrologer);
router.post('/generate', generateAstrologers);
router.get('/all', getAllAstrologers);
router.get('/:id', getAstrologerById);
router.put('/:id', updateAstrologer);
router.delete('/:id', deleteAstrologer);

module.exports = router;

const express = require('express');
const router = express.Router();
const captionController = require('../controllers/captionController');
const handleImageUpload = require('../middleware/uploadMiddleware');

router.post('/caption', handleImageUpload, captionController.generateCaption);

module.exports = router;

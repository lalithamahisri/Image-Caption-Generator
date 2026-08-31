const fs = require('fs');
const captionService = require('../services/captionService');

const generateCaption = async (req, res) => {
  const uploadedFile = req.file;

  if (!uploadedFile) {
    return res.status(400).json({
      success: false,
      message: 'No image file was uploaded. Please select an image.'
    });
  }

  const { style, additionalContext } = req.body;

  try {
    const caption = await captionService.generateCaption(
      uploadedFile,
      style || 'Simple',
      additionalContext || ''
    );

    return res.status(200).json({
      success: true,
      caption: caption,
      metadata: {
        filename: uploadedFile.originalname,
        sizeBytes: uploadedFile.size,
        mimeType: uploadedFile.mimetype,
        style: style || 'Simple'
      }
    });
  } catch (error) {
    console.error('[CaptionController Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to generate a caption. Please check the AI model configuration and try again.'
    });
  } finally {
    if (uploadedFile && uploadedFile.path && fs.existsSync(uploadedFile.path)) {
      fs.unlink(uploadedFile.path, (err) => {
        if (err) console.error('[Cleanup Error]:', err.message);
      });
    }
  }
};

module.exports = {
  generateCaption
};

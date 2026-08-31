const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `vision-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedMimeTypes.includes(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.maxFileSizeMB * 1024 * 1024
  },
  fileFilter: fileFilter
});

const handleImageUpload = (req, res, next) => {
  const uploadSingle = upload.single('image');

  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: `Image too large. Maximum file size allowed is ${config.maxFileSizeMB}MB.`
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Image validation failed.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image selected. Please choose an image to upload.'
      });
    }

    next();
  });
};

module.exports = handleImageUpload;

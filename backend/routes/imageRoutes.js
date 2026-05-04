const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'question-builder',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    transformation: [
      { width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
    ],
    eager: [
      { width: 800, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
    ],
    eager_async: true,
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// POST /api/images/upload
// multer-storage-cloudinary stores the Cloudinary response in req.file.
// Different versions use different field names, so we check all possibilities.
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    // Log so you can see exactly what multer-storage-cloudinary returns
    console.log('Cloudinary upload result:', JSON.stringify(req.file, null, 2));

    // Try every known field name across versions
    const url =
      req.file.secure_url ||   // direct cloudinary SDK field
      req.file.path ||         // multer-storage-cloudinary v4 sets path = secure_url
      req.file.url ||          // some older versions
      '';

    const publicId =
      req.file.public_id ||    // direct cloudinary SDK field
      req.file.filename ||     // multer-storage-cloudinary v4 sets filename = public_id
      '';

    if (!url) {
      return res.status(500).json({
        error: 'Cloudinary did not return a URL',
        fileFields: Object.keys(req.file),
      });
    }

    res.json({ url, publicId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/images/*
router.delete('/*', async (req, res) => {
  try {
    const publicId = req.params[0];
    if (!publicId) return res.status(400).json({ error: 'publicId required' });

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok' || result.result === 'not found') {
      return res.json({ deleted: true });
    }

    res.status(500).json({ error: 'Cloudinary deletion failed', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
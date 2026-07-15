'use strict';
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Invalid file type'), false);
};

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const safeName = file.originalname.replace(/\s+/g, '_');
      cb(null, `alagare/${Date.now()}-${safeName}`);
    },
  }),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/** multer-s3 sets .location; fallback builds from ASSET_ROOT + key */
const fileUrl = (file) => {
  if (!file) return '';
  if (file.location) return file.location;
  if (file.key && process.env.ASSET_ROOT) {
    return `${process.env.ASSET_ROOT.replace(/\/$/, '')}/${file.key}`;
  }
  return file.path || '';
};

module.exports = { upload, fileUrl, s3 };

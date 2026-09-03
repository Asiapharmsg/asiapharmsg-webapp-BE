const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const path = require('path');
const multer = require('multer');

// Credentials: use explicit keys if provided, otherwise fall back to the SDK's
// default chain (EC2 instance role, env, shared config). The instance role on
// the EC2 host is the preferred option; no keys need to live in .env then.
const s3Config = { region: process.env.AWS_REGION };
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  s3Config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
}
aws.config.update(s3Config);
const s3 = new aws.S3(s3Config);

const BUCKET = process.env.AWS_BUCKET_NAME;
// Prefixes inside the bucket. Public read for these is granted by a bucket
// policy (the bucket has ACLs disabled, so no per-object ACL is set).
const IMAGE_PREFIX = process.env.AWS_IMAGE_PREFIX || 'uploads/';
const DOC_PREFIX = process.env.AWS_DOC_PREFIX || 'acra-folder/';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const safeName = (originalname) => {
  const ext = path.extname(originalname).toLowerCase();
  const base = path
    .basename(originalname, path.extname(originalname))
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .slice(0, 80);
  return `${base}-${Date.now()}${ext}`;
};

const imageFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only JPEG, PNG, WebP or GIF images are allowed'));
};

const storage = multerS3({
  s3: s3,
  bucket: BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    cb(null, IMAGE_PREFIX + safeName(file.originalname));
  }
});

const imageUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_BYTES }
}).single('image');

const multiImageUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 10 }
}).array('images', 10);

// Uploads a signup document (ACRA) to a private prefix. Returns a promise so
// callers can await it; errors are logged rather than crashing the process.
const uploadPDFFile = (filebuffer) => {
  if (!filebuffer) return Promise.resolve();
  return s3
    .putObject({
      Bucket: BUCKET,
      Key: DOC_PREFIX + safeName(filebuffer.originalname),
      Body: filebuffer.buffer,
      ContentType: filebuffer.mimetype
    })
    .promise()
    .catch((err) => {
      console.error('ACRA upload to S3 failed:', err.message);
    });
};

module.exports = {
  imageUpload,
  multiImageUpload,
  uploadPDFFile
};

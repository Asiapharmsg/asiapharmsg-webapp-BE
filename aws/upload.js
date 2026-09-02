const aws = require('aws-sdk');
const multerS3 = require('multer-s3');

const path = require('path');

const multer = require('multer');

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const imageUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(
        null,
        path.basename(file.originalname, path.extname(file.originalname)) +
          '-' +
          Date.now() +
          path.extname(file.originalname)
      );
    },
  }),
}).single('image');

const multiImageUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(
        null,
        path.basename(file.originalname, path.extname(file.originalname)) +
          '-' +
          Date.now() +
          path.extname(file.originalname)
      );
    },
  }),
}).array('images', 10);

const uploadPDFFile = (filebuffer) => {  
  s3.putObject({
    Bucket: `${process.env.AWS_BUCKET_NAME}/acra-folder`,
    Key: filebuffer.originalname,
    Body: filebuffer.buffer
  }, function (err) {
    if (err) { throw err; }
  });
  
};

module.exports = {
  imageUpload,
  multiImageUpload,
  uploadPDFFile,
};

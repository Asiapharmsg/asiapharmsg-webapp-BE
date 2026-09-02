const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const { authenticate } = require('../utils/authenticator');
const { route } = require('./user');
const multer = require('multer');
const upload = multer();

router.get('/usersList/:status', authenticate, adminController.listUsers);

router.get(
  '/get-user-admin-paging/:status',
  authenticate,
  adminController.getAdminUsersPaging
);

router.put(
  '/updateUserData/',
  authenticate,
  upload.single('image_moh'),
  adminController.updateUserData
);
router.post(
  '/updateUserDataWithoutImg',
  authenticate,
  adminController.updateUserDataWithoutImg
);
router.delete('/deleteUser/:id', authenticate, adminController.deleteUser);

module.exports = router;

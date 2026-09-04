const express = require('express');
const { route } = require('express/lib/router');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const userController = require('../controllers/user');
const { authenticate, verifyCaptcha } = require('../utils/authenticator');

router.get('/user-data/:id?', authenticate, userController.userData);
router.get('/user-data-noimg/:id?', authenticate, userController.userDataWOimg);


//multi images sign up
const cpUpload = upload.fields([
  { name: 'moh', maxCount: 1 },
  { name: 'smc', maxCount: 1 },
  { name: 'acra', maxCount: 1 }
]);
router.post('/signup/:token', verifyCaptcha('signup'), cpUpload, userController.signup);
//signle imag sign up
/*
router.post(
  "/signup/:token",
  upload.single("image"),
  verifyCaptcha,
  userController.signup
);*/

router.post('/login/:token', verifyCaptcha('login'), userController.login);
router.post('/forgetpassword', userController.forgetpassword);
//router.post("/resetpassword", userController.resetpassword);

router.put(
  '/update',
  authenticate,
  upload.single('image_moh'),
  userController.update
);

router.put('/update-password', authenticate, userController.updatePassword);

router.delete('/delete', authenticate, userController.deleteUser);

module.exports = router;

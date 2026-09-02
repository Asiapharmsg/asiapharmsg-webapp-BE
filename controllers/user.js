const User = require('../productModels/User.model');
const DeletedRecord = require('../models').DeletedRecord;
const PasswordReset = require('../models').PasswordReset;
const Wishlist = require('../productModels/Wishlist.model');
const Product = require('../productModels/Product.model');
const Analytics = require('../models').Analytics;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const validate = require('../utils/validator');
const mailer = require('../utils/mailer');
const { Op, ValidationError } = require('sequelize');
const { sequelize } = require('../models');
const { uploadPDFFile } = require('../aws/upload');
const validPasswordRegex =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
const bodyValidations = {
  username: body('username')
    .trim()
    .notEmpty()
    .isLength({ min: 5 })
    .withMessage('Username must be at least 5 characters long'),
  password: body('password')
    .trim()
    .notEmpty()
    .matches(validPasswordRegex)
    .withMessage(
      'Password must be minimum eight characters, at least one letter, one number and one special character'
    ),
  firstName: body('firstName')
    .notEmpty()
    .withMessage('First name cannot be empty'),
  lastName: body('lastName')
    .notEmpty()
    .withMessage('Last name cannot be empty'),
  email: body('email').notEmpty().isEmail().withMessage('Invalid email'),
  phone: body('phone').notEmpty().withMessage('Phone cannot be empty'),
  /*licenceExpiryDate: body('licenceExpiryDate')
    .notEmpty()
    .withMessage('Licence Expiry Date cannot be empty'),*/
  accountType: body('accountType')
    .notEmpty()
    .isIn(['clinic', 'vendor'])
    .withMessage('Account type must be clinic or vendor'),
  companyName: body('companyName')
    .notEmpty()
    .withMessage('Company name cannot be empty'),
  companyAddress: body('companyAddress')
    .notEmpty()
    .withMessage('Company Address cannot be empty'),
  companyPostal: body('companyPostal')
    .notEmpty()
    .withMessage('Company postal cannot be empty'),
  status: body('status')
    .isIn([...User.rawAttributes.status.values])
    .optional({ nullable: true }),
  billingType: body('billingType')
    .isIn([...User.rawAttributes.billingType.values])
    .optional({ nullable: true }),
  priceTier: body('priceTier')
    .isIn([...User.rawAttributes.priceTier.values])
    .optional({ nullable: true }),
  adminControl: body('adminControl')
    .isIn([...User.rawAttributes.adminControl.values])
    .optional({ nullable: true })
};

const getRanHex = (size) => {
  let result = [];
  let hexRef = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f'
  ];

  for (let n = 0; n < size; n++) {
    result.push(hexRef[Math.floor(Math.random() * 16)]);
  }
  return result.join('');
};

const userData = async (req, res) => {
  try {
    const userId = req.params.id || req.userId;
    if (!userId) {
      return res.status(500).send({ error: 'Unauthorized request' });
    }
    const userData = await User.findByPk(userId, { raw: true });
    if (userData) {
      return res.status(200).send({ data: userData });
    } else {
      return res.status(200).send({ error: 'User account not found' });
    }
  } catch (err) {
    console.log('Error: ', err);
    return res.status(500).send({ error: err.message });
  }
};

const userDataWOimg = async (req, res) => {
  try {
    const userId = req.params.id || req.userId;
    if (!userId) {
      return res.status(500).send({ error: 'Unauthorized request' });
    }
    const userData = await User.findByPk(userId, { raw: true });
    if (userData) {
      console.log(userData);
      delete userData.image_acra;
      delete userData.image_moh;
      delete userData.image_smc;

      return res.status(200).send({ data: userData });
    } else {
      return res.status(200).send({ error: 'User account not found' });
    }
  } catch (err) {
    console.log('Error: ', err);
    return res.status(500).send({ error: err.message });
  }
};

const signup = async (req, res) => {
  try {
    const isValid = await validate.run(
      req,
      res,
      Object.values(bodyValidations)
    );
    if (!isValid) {
      return;
    }
    const data = req.body;
    console.log('the sign in data', data);
    const moh = req.files['moh'][0];
    const smc = req.files['smc'][0];
    const acra = req.files['acra'][0];
    if (!moh) {
      return res.status(500).send({ error: 'MOH Licence cannot be empty' });
    }
    if (!smc) {
      return res
        .status(500)
        .send({ error: 'SMC Practicing Certification cannot be empty' });
    }
    if (!acra) {
      return res.status(500).send({ error: 'ACRA Image cannot be empty' });
    }
    (data.companyPostal == typeof data.companyPostal) === 'string'
      ? parseInt(data.companyPostal)
      : data.companyPostal;
    const userExists = await User.findOne({
      where: { [Op.or]: [{ email: data.email }, { username: data.username }] }
    });
    if (userExists) {
      return res
        .status(422)
        .send({ error: 'Account with this username or email already exists' });
    }
    uploadPDFFile(acra);

    if (data.deliveryPostal == '') {
      console.log('postal deliver is null');
      delete data.deliveryPostal;
    }
    const hashPassword = await bcrypt.hash(data.password, 12);
    const newUser = await User.create({
      username: data.username,
      password: hashPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      nationality: data.nationality,
      email: data.email,
      mobile: data.mobile,
      phone: data.phone,
      image_moh: moh.buffer,
      image_smc: smc.buffer,
      image_acra: acra.buffer,
      accountType: data.accountType,
      companyName: data.companyName,
      companyAddress: data.companyAddress,
      companyPostal: data.companyPostal,
      countryIncorporation: data.countryIncorporation,
      isAdmin: false,
      deliveryAddress: data.deliveryAddress,
      deliveryPostal: data.deliveryPostal,
      lastLoginAt: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    });

    res
      .status(200)
      .send({ message: 'Account created successfully!', pk: newUser.id });

    mailer.sendMail(data.email);
  } catch (err) {
    if (err instanceof ValidationError) {
      const errMsg = err.errors[0].message;
      console.log(errMsg);
      return res.status(500).send({ error: errMsg });
    } else {
      console.log('Error: ', err);
      return res.status(500).send({ error: err.message });
    }
  }
};

const login = async (req, res) => {
  try {
    const isValid = await validate.run(req, res, [
      body('username')
        .trim()
        .exists()
        .notEmpty()
        .withMessage('Username cannot be empty'),
      body('password')
        .trim()
        .exists()
        .notEmpty()
        .withMessage('Password cannot be empty')
    ]);
    if (!isValid) {
      console.log('not valid', isValid);
      return;
    }
    const { username, password } = req.body;
    const userExists = await User.findOne({
      where: { username: username }
    });

    if (!userExists) {
      return res.status(404).send({ error: 'username or email not found' });
    }
    console.log(userExists.password);
    const hashPassword = await bcrypt.hash(password, 12);
    console.log(hashPassword);
    const passwordMatched = await bcrypt.compare(password, userExists.password);
    if (!passwordMatched) {
      return res.status(422).send({ error: 'Password incorrect' });
    }
    const secretKey = process.env.JWT_SECRET_KEY || 'eCom-demo-lezada';
    const token = jwt.sign(
      {
        userId: userExists.id,
        username: userExists.username,
        isAdmin: userExists.isAdmin
      },
      secretKey,
      {
        expiresIn: '2h'
      }
    );

    const usersWishlist = await Wishlist.findAll({
      where: { user_id: userExists.id },
      include: [
        {
          model: Product,
          required: true
        }
      ]
    });

    await User.update(
      { lastLoginAt: new Date() },
      {
        where: {
          id: userExists.id
        }
      }
    );
    console.log('The user login details :', userExists.id);

    return res.status(200).send({
      message: 'Login successful',
      userId: userExists.id,
      username: userExists.username,
      token: token,
      isAdmin: userExists.isAdmin,
      accountType: userExists.accountType,
      status: userExists.status,
      wishlist: usersWishlist.map((item) => item.product)
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).send({ error: err.message });
  }
};

const forgetpassword = async (req, res) => {
  try {
    const isValid = await validate.run(req, res, [
      body('email')
        .trim()
        .exists()
        .notEmpty()
        .withMessage('Email cannot be empty'),
      body('redirectUrl')
        .trim()
        .exists()
        .notEmpty()
        .withMessage('redirectUrl cannot be empty')
    ]);
    if (!isValid) {
      console.log('not valid', isValid);
      return;
    }
    const { email, redirectUrl } = req.body;
    const userExists = await User.findOne({
      where: { email: email }
    });
    if (!userExists) {
      return res.status(404).send({ error: 'username or email not found' });
    } else {
      // Remove any records in passwordreset table
      console.log(userExists.id);
      const deletedUser = PasswordReset.destroy({
        where: { userid: userExists.id }
      }).catch((error) => {
        console.log(error);
        res.json({
          status: 'FAILED',
          message: 'Clearing existing password reset records failed.'
        });
      });
      const saltRound = 10;

      const tempPass = 'AsiaPharmSG@' + getRanHex(12);
      const hashPassword = await bcrypt.hash(tempPass, 12);
      var dt = new Date();

      // generate a temp password
      const updatedUser = await User.update(
        { password: hashPassword, updatedAt: new Date().now },
        {
          where: {
            id: userExists.id
          }
        }
      );

      mailer.sendTempPasswordMail(userExists.email, tempPass);

      // create a new record in Password reset table
      /*
      bcrypt
        .hash(redirectUrl, saltRound)
        .then(hasedResetString => {
          const newPasswordReset =  PasswordReset.create({
            userid: userExists.id,
            resetString: hasedResetString,
            createdAt: new Date(),
            expiryAt: dt.setHours( dt.getHours() + 1 ),
            updatedAt: new Date()
          });

          mailer.sendResetMail(userExists, hasedResetString, redirectUrl);
        })
        .catch(error => {
          console.log(error);
          res.json({
            status: "FAILED",
            message: "An error occured when hashing the password reset!",
          });
        })
      */
    }

    return res.status(200).send({
      message: 'Reset Password link send to register email successful'
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: err.message });
  }
};

const resetpassword = async (req, res) => {
  try {
    const isValid = await validate.run(req, res, [
      body('userid')
        .trim()
        .exists()
        .notEmpty()
        .withMessage('userid cannot be empty'),
      body('resetString')
        .trim()
        .exists()
        .notEmpty()
        .withMessage('resetString cannot be empty'),
      body('newPassword')
        .trim()
        .exists()
        .notEmpty()
        .withMessage('newPassword cannot be empty')
    ]);
    if (!isValid) {
      console.log('not valid', isValid);
      return;
    }
    const { userid, resetString, newPassword } = req.body;
    console.log('here', userid);
    const resetPasswordExists = await PasswordReset.findOne({
      where: { userid: userid }
    });
    if (!resetPasswordExists) {
      return res.status(404).send({ error: 'username or email not found' });
    } else {
      // check if its expired
      console.log(resetPasswordExists.userid);
      const { expiryAt } = resetPasswordExists.expiryAt;
      const hashedResetString = resetPasswordExists.resetString;

      if (expiryAt < Date.now()) {
        // Password reset expired
        const deletedUser = await PasswordReset.destroy({
          where: { userid: resetPasswordExists.userid }
        }).catch((error) => {
          console.log(error);
          res.json({
            status: 'FAILED',
            message: 'Clearing existing password reset records failed.'
          });
        });
      } else {
        // Password reset not expired
        console.log(resetString);
        console.log(hashedResetString);
        const resetStringMatched = await bcrypt.compare(
          resetString,
          hashedResetString
        );
        if (resetStringMatched) {
          //string matched
          const saltRound = 10;
          const hashedNewPassword = await bcrypt.hash(newPassword, saltRound);
          const userExists = await User.findByPk(userid);
          if (!userExists) {
            console.log('in1');
            return res.status(404).send({ error: 'user account not found' });
          } else {
            console.log('in2', userExists.email);
            const updatedUser = await User.update(
              { password: hashedNewPassword, updatedAt: new Date().now },
              {
                where: {
                  id: userid
                }
              }
            );
            const deletedUser = PasswordReset.destroy({
              where: { userid: userid }
            });
          }
        }
      }
    }
    return res.status(200).send({
      message: 'Reset Password successfully'
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(500).send({ error: 'Unauthorized request' });
    }
    const data = req.body;
    if (Object.keys(data).length > 0) {
      const file = req.file;
      const validations = [];
      Object.keys(data).forEach((key) =>{
        if(key != 'mobile' &&     key != 'licenceExpiryDate' &&
        key != 'deliveryAddress' &&
        key != 'deliveryPostal'){
          validations.push(bodyValidations[key]);
        }
      });
      const isValid = await validate.run(req, res, validations);
      if (!isValid) {
        return;
      }
      const userExists = await User.findByPk(userId);
      if (!userExists) {
        return res.status(404).send({ error: 'Account not found' });
      }
      const image = file?.buffer ?? userExists.image_moh;
      const updatedUser = await User.update(
        { ...data, image_moh: image, updatedAt: new Date() },
        {
          where: {
            id: userId
          }
        }
      );
      return res.status(200).send({
        message: 'Account updated successfully',
        user: updatedUser
      });
    } else {
      return res.status(200).send({ message: 'Account updated successfully' });
    }
  } catch (err) {
    if (err instanceof ValidationError) {
      const errMsg = err.errors[0].message;
      console.log(errMsg);
      return res.status(500).send({ error: errMsg });
    } else {
      console.log('Error: ', err);
      return res.status(500).send({ error: err.message });
    }
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(500).send({ error: 'Unauthorized request' });
    }
    const userExists = await User.findByPk(userId, { raw: true });
    if (!userExists) {
      return res.status(404).send({ error: 'User account not found' });
    }
    const deletedRecord = await DeletedRecord.create(
      {
        ...userExists,
        deletedAt: new Date()
      },
      { silent: true }
    );
    const deletedUser = await User.destroy(
      {
        where: { id: userId }
      },
      { silent: true }
    );
    return res.status(200).send({ message: 'Account deleted successfully' });
  } catch (err) {
    console.log('Error: ', err);
    return res.status(500).send({ error: err.message });
  }
};

const updatePassword = async (req, res) => {
  const isValid = await validate.run(req, res, [
    body('currentPassword')
      .trim()
      .exists()
      .notEmpty()
      .matches(validPasswordRegex)
      .withMessage(
        'Current Password must be minimum eight characters, at least one letter, one number and one special character'
      ),
    body('newPassword')
      .trim()
      .exists()
      .notEmpty()
      .matches(validPasswordRegex)
      .withMessage(
        'New Password must be minimum eight characters, at least one letter, one number and one special character'
      )
  ]);
  if (!isValid) {
    console.log('not valid', isValid);
    return;
  }

  const userId = req.userId;
  if (!userId) {
    return res.status(500).send({ error: 'Unauthorized request' });
  }
  const userExists = await User.findByPk(userId, { raw: true });
  if (!userExists) {
    return res.status(404).send({ error: 'User account not found' });
  }

  const { currentPassword, newPassword } = req.body;
  if (currentPassword === newPassword) {
    return res
      .status(500)
      .send({ error: 'Cannot use previous password again' });
  }
  const passwordMatched = await bcrypt.compare(
    currentPassword,
    userExists.password
  );
  if (!passwordMatched) {
    return res.status(422).send({ error: 'Password incorrect' });
  }
  const hashPassword = await bcrypt.hash(newPassword, 12);
  const updatedUser = await User.update(
    {
      password: hashPassword
    },
    {
      where: {
        id: userId
      }
    }
  );
  return res.status(200).send({
    message: 'Account updated successfully',
    user: updatedUser
  });
};

module.exports = {
  signup,
  login,
  update,
  deleteUser,
  userData,
  forgetpassword,
  resetpassword,
  updatePassword,
  userDataWOimg
};

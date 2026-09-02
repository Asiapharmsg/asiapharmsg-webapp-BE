const User = require('../models').User;
const DeletedRecord = require('../models').DeletedRecord;
const { Op, ValidationError } = require('sequelize');
const { body } = require('express-validator');
const validate = require('../utils/validator');
const mailer = require('../utils/mailer');

const listUsers = async (req, res) => {
  try {
    const isAdmin = req.isAdmin;
    if (!isAdmin) {
      return res.status(500).send({ error: 'Unauthorized request' });
    }
    const status = req.params.status;
    const userList = await User.findAll({
      where: {
        [Op.and]: [{ status: status }, { isAdmin: false }]
      },
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password'] }
    });
    const statusValues = User.rawAttributes.status.values.map((item) => ({
      label: item,
      value: item
    }));
    const billingTypeValues = User.rawAttributes.billingType.values.map(
      (item) => ({
        label: item,
        value: item
      })
    );
    const priceTierValues = User.rawAttributes.priceTier.values.map((item) => ({
      label: item,
      value: item
    }));
    const adminControlValues = User.rawAttributes.adminControl.values.map(
      (item) => ({
        label: item,
        value: item
      })
    );

    return res.status(200).send({
      userList: userList,
      statusValues,
      billingTypeValues,
      priceTierValues,
      adminControlValues
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: error.message });
  }
};

const getAdminUsersPaging = async (req, res) => {
  try {
    const isAdmin = req.isAdmin;
    if (!isAdmin) {
      return res.status(500).send({ error: 'Unauthorized request' });
    }
    const status = req.params.status;
    const page = req.query.page || 1;
    const page_size = req.query.page_size || 10;
    const offset = (page - 1) * page_size;

    let userList = await User.findAndCountAll({
      where: {
        [Op.and]: [{ status: status }, { isAdmin: false }]
      },
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password'] },
      offset: offset,
      limit: page_size
    });
    const statusValues = User.rawAttributes.status.values.map((item) => ({
      label: item,
      value: item
    }));
    const billingTypeValues = User.rawAttributes.billingType.values.map(
      (item) => ({
        label: item,
        value: item
      })
    );
    const priceTierValues = User.rawAttributes.priceTier.values.map((item) => ({
      label: item,
      value: item
    }));
    const adminControlValues = User.rawAttributes.adminControl.values.map(
      (item) => ({
        label: item,
        value: item
      })
    );

    return res.status(200).json({
      total_pages: parseInt(Math.ceil(userList.count / page_size)),
      userList: userList.rows,
      statusValues,
      billingTypeValues,
      priceTierValues,
      adminControlValues
    });
  } catch (err) {
    console.log(error);
    return res.status(500).send({ error: error.message });
  }
};

const updateUserData = async (req, res) => {
  try {
    const isAdmin = req.isAdmin;
    if (!isAdmin) {
      return res.status(500).send({ error: 'Unauthorized request' });
    }
    const isValid = await validate.run(req, res, [
      body('billingType').isIn([...User.rawAttributes.billingType.values]),
      body('priceTier').isIn([...User.rawAttributes.priceTier.values]),
      body('adminControl').isIn([...User.rawAttributes.adminControl.values]),
      body('status').isIn([...User.rawAttributes.status.values])
    ]);
    if (!isValid) {
      console.log('Not valid', isValid);
      return;
    }

    console.log(req.body);
    const file = req.file;
    const userId = req.body.user_id;
    if (Object.keys(req.body).length > 0) {
      const userExists = await User.findByPk(userId);
      if (!userExists) {
        return res.status(404).send({ error: 'User account not found' });
      }
      const status =
        req.body.status == null ? userExists.status : req.body.status;
      const billingType =
        req.body.billingType == null
          ? userExists.billingType
          : req.body.billingType;
      const priceTier =
        req.body.priceTier == null ? userExists.priceTier : req.body.priceTier;
      const adminControl =
        req.body.adminControl == null
          ? userExists.adminControl
          : req.body.adminControl;
      const licenceExpiryDate =
        req.body.licenceExpiryDate ?? userExists.licenceExpiryDate;
      const image = file?.buffer ?? userExists.image_moh;
      const updatedUser = await User.update(
        {
          status,
          billingType,
          priceTier,
          adminControl,
          image_moh: image,
          updatedAt: new Date(),
          licenceExpiryDate
        },
        {
          where: {
            id: userId
          }
        }
      );
      return res.status(200).send({
        message: 'User account updated successfully',
        user: updatedUser
      });
    } else {
      return res
        .status(200)
        .send({ message: 'User account updated successfully' });
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

const updateUserDataWithoutImg = async (req, res) => {
  try {
    const isAdmin = req.isAdmin;
    if (!isAdmin) {
      return res.status(500).send({ error: 'Unauthorized request' });
    }
    const isValid = await validate.run(req, res, [
      body('billingType').isIn([...User.rawAttributes.billingType.values]),
      body('priceTier').isIn([...User.rawAttributes.priceTier.values]),
      body('adminControl').isIn([...User.rawAttributes.adminControl.values]),
      body('status').isIn([...User.rawAttributes.status.values])
    ]);
    if (!isValid) {
      console.log('Not valid', isValid);
      return;
    }
    console.log(req.body);
    const userId = req.body.userId;
    if (Object.keys(req.body).length > 0) {
      const userExists = await User.findByPk(userId);
      if (!userExists) {
        return res.status(404).send({ error: 'User account not found' });
      }
      const status =
        req.body.status == null ? userExists.status : req.body.status;
      const billingType =
        req.body.billingType == null
          ? userExists.billingType
          : req.body.billingType;
      const priceTier =
        req.body.priceTier == null ? userExists.priceTier : req.body.priceTier;
      const adminControl =
        req.body.adminControl == null
          ? userExists.adminControl
          : req.body.adminControl;
      const licenceExpiryDate =
        req.body.licenceExpiryDate ?? userExists.licenceExpiryDate;
      const updatedUser = await User.update(
        {
          status,
          billingType,
          priceTier,
          adminControl,
          updatedAt: new Date(),
          licenceExpiryDate
        },
        {
          where: {
            id: userId
          }
        }
      );

      // Send email on status update
      if (status == 'Active') {
        mailer.sendAccountUpdateSuccessMail(userExists.email);
      } else if (status == 'Rejected') {
        mailer.sendAccountUpdateUnsuccessMail(userExists.email);
      }

      return res.status(200).send({
        message: 'User account updated successfully',
        user: updatedUser
      });
    } else {
      return res
        .status(200)
        .send({ message: 'User account updated successfully' });
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
    const isAdmin = req.isAdmin;
    if (!isAdmin) {
      return res.status(500).send({ error: 'Unauthorized request' });
    }
    const userId = req.params.id;
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
    return res
      .status(200)
      .send({ message: 'User account deleted successfully' });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: error.message });
  }
};

module.exports = {
  listUsers,
  getAdminUsersPaging,
  updateUserData,
  updateUserDataWithoutImg,
  deleteUser
};

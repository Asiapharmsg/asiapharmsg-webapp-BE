const User = require('../models').User;
const { Op, ValidationError } = require('sequelize');
const { body } = require('express-validator');
const validate = require('../utils/validator');

const getAnalyticsData = async (req, res) => {
  try {
    const isAdmin = req.isAdmin;
    if (!isAdmin) {
      return res.status(500).send({ error: 'Unauthorized request' });
    }
    const records = await User.count({
      where: {
        [Op.and]: [
          {
            last_login_at: {
              [Op.gte]: '2022-03-01'
            },
            last_login_at: {
              [Op.lte]: '2022-03-31'
            }
          }
        ]
      }
    });

    return res.status(200).send({ msg: 'Success!', records });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: error.message });
  }
};

module.exports = { getAnalyticsData };

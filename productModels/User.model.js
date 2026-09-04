const { Model, DataTypes } = require('sequelize');
const db = require('../database/connection');
//const Order = require('./Order.model');
//const OrderDetail = require('./OrderDetail.model');

class User extends Model {}
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    accountType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    image_moh: {
      type: DataTypes.BLOB,
      allowNull: false
    },
    image_smc: {
      type: DataTypes.BLOB,
      allowNull: false
    },
    image_acra: {
      type: DataTypes.BLOB,
      allowNull: false
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    companyAddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    companyPostal: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Active', 'Pending', 'Rejected', 'Closed'),
      defaultValue: 'Pending'
    },
    billingType: {
      type: DataTypes.ENUM(
        'Cash on Delivery',
        '30 days payment period',
        '60 days payment period',
        'Invalid'
      )
    },
    priceTier: {
      type: DataTypes.ENUM(
        'Usual price',
        '10 off',
        '20 off',
        'Invalid (for supplier account)'
      )
    },
    adminControl: {
      type: DataTypes.ENUM(
        'Normal clinic',
        'Normal vendor',
        'Advance clinic',
        'Advance vendor',
        'Special clinic',
        'Special vendor'
      )
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    licenceExpiryDate: {
      allowNull: true,
      type: DataTypes.DATE
    },
    nationality: {
      allowNull: true,
      type: DataTypes.STRING
    },
    countryIncorporation: {
      allowNull: false,
      unique: true,
      type: DataTypes.STRING
    },
    // Optional: only set when the delivery address differs from the company
    // address. Both columns are nullable in the database.
    deliveryAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deliveryPostal: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
  },
  { sequelize: db, modelName: 'user', underscored: true }
);

/*User.hasMany(Order, {
  foreignKey: 'id'
});
*/
// User.belongsToMany(OrderDetail, {
//   foreignKey: "id",
// });

db.sync()
  .then((res) => {
    console.log('Synced User Model');
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = User;

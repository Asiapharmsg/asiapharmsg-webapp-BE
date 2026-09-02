const { Model, DataTypes } = require('sequelize');
const db = require('../database/connection');
const Order = require('../productModels/Order.model');

class OrderDelivery extends Model {}
OrderDelivery.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    delivery_address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    delivery_type: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: false
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  { underscored: true, sequelize: db, modelName: 'orderdelivery', underscored: true }
);

OrderDelivery.belongsTo(Order, { foreignKey: 'order_id' });

db.sync()
  .then((res) => {
    console.log('Synced Order Delivery Model');
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = OrderDelivery;

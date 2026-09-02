const { Model, DataTypes } = require('sequelize');
const db = require('../database/connection');
const Order = require('./Order.model');
const User = require('./User.model');
const Product = require('./Product.model');

class OrderDetail extends Model {}
OrderDetail.init(
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
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    remarks: {
      type: DataTypes.STRING(200),
      allowNull: true
    }
  },
  {
    underscored: true,
    sequelize: db,
    modelName: 'orderdetail',
    underscored: true
  }
);

OrderDetail.belongsTo(User, { foreignKey: 'supplier_id' });

OrderDetail.belongsTo(Product, { foreignKey: 'product_id' });

Order.hasMany(OrderDetail, {
  foreignKey: 'order_id'
});
/*
Product.hasMany(OrderDetail, {
	foreignKey: 'product_id',
})*/

db.sync()
  .then((res) => {
    console.log('Synced Order Detail Model');
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = OrderDetail;

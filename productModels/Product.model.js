const { Model, DataTypes } = require('sequelize');
const db = require('../database/connection');
const Category = require('./Category.model');

class Product extends Model {}
Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sub_image1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sub_image2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    price_tier_1: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false
    },
    price_tier_2: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false
    },
    price_tier_3: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false
    },
    unit_measurement: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    inventory_count: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ingredients: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    remarks: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    deleted_on: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  { underscored: true, sequelize: db, modelName: 'product' }
  
);

Category.hasMany(Product, {
  foreignKey: 'category_id'
});

db.sync()
  .then((res) => {
    console.log('Synced Product Model');
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = Product;

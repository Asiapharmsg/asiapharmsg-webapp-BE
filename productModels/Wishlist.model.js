const { Model, DataTypes } = require('sequelize');
const db = require('../database/connection');
const User = require('../productModels/User.model');
const Product = require('../productModels/Product.model');

class Wishlist extends Model {}
Wishlist.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    }
  },
  { sequelize: db, modelName: 'wishlist', underscored: true }
);

Wishlist.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Wishlist, { foreignKey: 'user_id' });
Wishlist.belongsTo(Product, { foreignKey: 'product_id' });

db.sync()
  .then((res) => {
    console.log('Synced Wishlist Model');
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = Wishlist;

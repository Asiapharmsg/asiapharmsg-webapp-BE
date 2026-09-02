const { Model, DataTypes } = require("sequelize");
const db = require("../database/connection");
const User = require('./User.model');

class Order extends Model {}
Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_price: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { underscored: true, sequelize: db, modelName: "order", underscored: true }
);

Order.belongsTo(User, { foreignKey: 'user_id' });

db.sync()
  .then((res) => {
    console.log("Synced Order Model");
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = Order;

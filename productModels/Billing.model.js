const { Model, DataTypes } = require("sequelize");
const db = require("../database/connection");
const User = require("./User.model");

class Billing extends Model {}
Billing.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    order_detail_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    billing_price: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { underscored: true, sequelize: db, modelName: "billing", underscored: true }
);

Billing.belongsTo(User, { foreignKey: "supplier_id" });

db.sync()
  .then((res) => {
    console.log("Synced Billing Model");
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = Billing;

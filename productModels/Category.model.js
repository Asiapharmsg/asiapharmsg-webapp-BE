const { Model, DataTypes } = require("sequelize");
const db = require("../database/connection");

class Category extends Model {}
Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    sub: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    deleted_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  { underscored: true, sequelize: db, modelName: "category", underscored: true }
);
db.sync()
  .then((res) => {
    console.log("Synced Category Model");
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = Category;

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

require('dotenv').config();

const basename = path.basename(module.filename);

const db = {};
const dbConfig = {
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'testing',
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,

      rejectUnauthorized: false
    }
  }
};

const sequelize = new Sequelize(dbConfig);
fs.readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
  )
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

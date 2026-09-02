const { Sequelize } = require('sequelize');

const dbConfig = {
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'asiapharmdb',
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,

      rejectUnauthorized: false
    }
  }
};

module.exports = new Sequelize(dbConfig);

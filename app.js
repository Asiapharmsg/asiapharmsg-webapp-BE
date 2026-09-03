require('dotenv').config();

// Fail fast on missing configuration rather than running with insecure or
// broken defaults (a public fallback JWT secret, uploads with no bucket).
const REQUIRED_ENV = [
  'JWT_SECRET_KEY',
  'CAPTCHA_KEY',
  'DB_HOST',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'AWS_REGION',
  'AWS_BUCKET_NAME'
];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

// Log instead of dying silently; Docker's restart policy handles real crashes.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception, exiting:', err);
  process.exit(1);
});

const path = require('path');
const express = require('express');
const logger = require('morgan');
const cors = require('cors');

const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const db = require('./database/connection');
// var busboyBodyParser = require('busboy-body-parser');
const analyticsRouter = require('./routes/analytics');
const authRouter = require('./routes/auth');

// Set up the express app
const app = express();
app.use(cors());

// Log requests to the console.
app.use(logger('dev'));

// Parse incoming requests data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//app.use(busboyBodyParser());
app.use('/user', userRouter);
app.use('/admin', adminRouter);
app.use('/admin/dashboard', analyticsRouter);
app.use('/auth', authRouter);

// Setup a default catch-all route that sends back a welcome message in JSON format.
app.get('/', (req, res) =>
  res.status(200).send({
    message: 'Alive!'
  })
);
const PORT = process.env.PORT || 8000;

db.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

app.use('/api/products', require('./routes/product'));
app.use('/api/products/wishlist', require('./routes/wishlist'));
app.use('/api/category', require('./routes/category'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/orderdetails', require('./routes/orderDetails'));
app.use('/api/billings', require('./routes/billing'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

require('dotenv').config();
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

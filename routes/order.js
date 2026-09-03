const express = require('express');
const router = express.Router();
const Order = require('./../productModels/Order.model');
const Billing = require('./../productModels/Billing.model');
const OrderDetail = require('./../productModels/OrderDetail.model');
const OrderDelivery = require('./../productModels/OrderDelivery.model');
const mailer = require('../utils/mailer');
const validate = require("../utils/validator");
const { body } = require('express-validator');
const User = require('../productModels/User.model');
const { requireAdmin, selfOrAdmin } = require('../utils/authenticator');

router.get('/', requireAdmin, async (req, res) => {
  try {
    let rows = await Order.findAll({
      include: [
        {
          model: User,
          attributes: ['companyName'],
          required: true
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

router.post('/', async (req, res) => {
  // A clinic can only place orders for itself.
  if (!req.isAdmin) req.body.user_id = req.userId;
  const isValid = await validate.run(req, res, [
    body('user_id')
      .exists()
      .notEmpty()
      .withMessage('User ID cannot be empty'),
    body('supplier_list')
      .exists()
      .notEmpty()
      .isArray()
      .withMessage('supplier_list cannot be empty and it should be an array'),
      body('total_price')
      .exists()
      .notEmpty()
      .withMessage('total_price cannot be empty'),
      body('status')
      .exists()
      .notEmpty().isNumeric(),
      body('firstName')
      .exists()
      .notEmpty().withMessage("First name cannot be empty"),
      body('lastName')
      .exists()
      .notEmpty().withMessage("Last name cannot be empty"),
      body('deliveryAddress')
      .exists()
      .notEmpty().isString(),
      body('contact')
      .exists()
      .notEmpty().withMessage("Contact number cannot be empty"),
      body('deliveryType')
      .exists()
      .notEmpty().isNumeric(),
      body('remarks')
      .isLength({max:255, min: 0}).optional({nullable: true}).withMessage("Remarks cannot exceed 255 characters"),
      body('orderDetails_list').exists().withMessage("Order details cannot be empty")
  ]);
  if (!isValid) {
    console.log('not valid', isValid);
    return;
  }
  const {
    user_id,
    supplier_list,
    total_price,
    status,
    firstName,
    lastName,
    deliveryAddress,
    deliveryType,
    remarks,
    contact,
    orderDetails_list
  } = req.body;
  const sent = 0;
  console.log('create new order', user_id);
  try {
    const newOrder = await Order.create({
      user_id,
      total_price,
      status,
      sent
    });
    if (newOrder.id) {
      console.log('new order id ', newOrder.id);

      // Create new record in orderdelivery table
      const newOrderDelivery = await OrderDelivery.create({
        order_id: newOrder.id,
        first_name: firstName,
        last_name: lastName,
        delivery_address: deliveryAddress,
        delivery_type: deliveryType,
        contact,
        remarks
      });

      console.log('new order delivery id ', newOrderDelivery.id);

      if (!newOrderDelivery.id) throw 'Error creating order';

      //send email to user
      console.log('send email here');
      const userData = await User.findByPk(user_id);
      Promise.resolve(
        mailer.sendNewOrderMailTemplate(userData, newOrder, orderDetails_list)
      ).catch((e) => console.error('Order email to clinic failed:', e.message));

      //send email to supplier list
      for (const x in supplier_list) {
        const supplierData = await User.findByPk(supplier_list[x]);
        Promise.resolve(
          mailer.sendNewOrderMailVendor(supplierData, newOrder, orderDetails_list)
        ).catch((e) => console.error('Order email to vendor failed:', e.message));
      }

      return res.json({ newOrder });
    } else {
      return res.json({ error: true, message: 'Error creating order' });
    }
  } catch (error) {
    console.log(error.message);
    return res.json(error);
  }
});

router.delete('/:oid', requireAdmin, async (req, res) => {
  try {
    const { oid } = req.params;
    const deletedOrderId = await Order.destroy({
      where: {
        id: oid
      }
    });
    if (deletedOrderId !== 0) {
      return res.json({
        message: 'Order deleted successfully!',
        orderId: deletedOrderId,
        success: true
      });
    } else {
      return res.json({
        message: 'Order not found!',
        success: false
      });
    }
  } catch (err) {
    return res.json(err);
  }
});

router.get('/supplier/:sid', selfOrAdmin('sid'), async (req, res) => {
  const { sid } = req.params;
  try {
    let rows = await Order.findAll({
      where: { supplier_id: sid },
      order: [['created_at', 'DESC']]
    });
    console.log(rows);
    return res.json(rows);
  } catch (err) {
    console.log(err);
    return res.json(err);
  }
});

router.get('/user/:uid', selfOrAdmin('uid'), async (req, res) => {
  const { uid } = req.params;
  try {
    let rows = await Order.findAll({
      where: { user_id: uid },
      order: [['created_at', 'DESC']]
    });
    return res.json(rows);
  } catch (err) {
    console.log(err);
    return res.json(err);
  }
});

router.get('/orderdelivery/:oid', async (req, res) => {
  const { oid } = req.params;
  try {
    let rows = await OrderDelivery.findOne({
      where: { order_id: oid }
    });
    return res.json(rows);
  } catch (err) {
    console.log(err);
    return res.json(err);
  }
});

router.patch('/:oid', requireAdmin, async (req, res) => {
  const { status, total_price } = req.body;
  console.log('here');
  console.log(total_price);
  console.log(status);
  try {
    const { oid } = req.params;
    console.log(oid);
    const updatedOrder = await Order.update(
      { status },
      {
        where: {
          id: oid
        }
      }
    );
    //order status = 1 (Active)
    if (status == 1) {
      console.log('here2');
      //generate billing price
      var billing_price = total_price * 0.05;
      var order_id = oid;
      console.log(billing_price);

      const newBilling = await Billing.create({
        order_id,
        billing_price,
        status
      });
    }

    if (updatedOrder[0] !== 0) {
      return res.json({
        message: 'Order updated successfully!',
        orderId: updatedOrder,
        success: true
      });
    } else {
      return res.json({
        message: 'Order not found!',
        success: false
      });
    }
  } catch (err) {
    return res.json(err);
  }
});

module.exports = router;

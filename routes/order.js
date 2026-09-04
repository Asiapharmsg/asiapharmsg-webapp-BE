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
const db = require('../database/connection');
const { requireAdmin, selfOrAdmin } = require('../utils/authenticator');
const { canSeeOrder } = require('../utils/orderAccess');

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
    res.status(500).json({ error: err.message || String(err) });
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

  // orderDetails_list arrives as a JSON string of {product_id, supplier_id,
  // quantity, price} lines.
  let orderLines;
  try {
    orderLines =
      typeof orderDetails_list === 'string'
        ? JSON.parse(orderDetails_list)
        : orderDetails_list;
  } catch (e) {
    orderLines = null;
  }
  if (!Array.isArray(orderLines) || orderLines.length === 0) {
    return res.status(400).json({ error: 'Order details cannot be empty' });
  }
  const badLine = orderLines.find(
    (line) =>
      !line ||
      !line.product_id ||
      !line.supplier_id ||
      !(Number(line.quantity) > 0) ||
      Number.isNaN(parseFloat(line.price))
  );
  if (badLine) {
    return res.status(400).json({
      error: 'Each order line needs a product, supplier, quantity and price'
    });
  }

  console.log('create new order', user_id);
  let newOrder;
  try {
    // The order, its delivery record and its lines are written together so a
    // failure part-way through cannot leave an order with no lines (which the
    // purchase history would not show).
    newOrder = await db.transaction(async (t) => {
      const order = await Order.create(
        { user_id, total_price, status, sent: 0 },
        { transaction: t }
      );
      await OrderDelivery.create(
        {
          order_id: order.id,
          first_name: firstName,
          last_name: lastName,
          delivery_address: deliveryAddress,
          delivery_type: deliveryType,
          contact,
          remarks
        },
        { transaction: t }
      );
      await OrderDetail.bulkCreate(
        orderLines.map((line) => ({
          order_id: order.id,
          product_id: line.product_id,
          supplier_id: line.supplier_id,
          quantity: line.quantity,
          price: parseFloat(line.price),
          status: line.status ?? status
        })),
        { transaction: t }
      );
      return order;
    });
  } catch (error) {
    console.error('Order creation failed:', error);
    return res.status(500).json({ error: 'Error creating order' });
  }
  console.log('new order id ', newOrder.id);

  // Emails are best effort: the order is already saved.
  const linesJson = JSON.stringify(orderLines);
  try {
    const userData = await User.findByPk(user_id);
    Promise.resolve(
      mailer.sendNewOrderMailTemplate(userData, newOrder, linesJson)
    ).catch((e) => console.error('Order email to clinic failed:', e.message));

    for (const x in supplier_list) {
      const supplierData = await User.findByPk(supplier_list[x]);
      Promise.resolve(
        mailer.sendNewOrderMailVendor(supplierData, newOrder, linesJson)
      ).catch((e) => console.error('Order email to vendor failed:', e.message));
    }
  } catch (e) {
    console.error('Order email lookup failed:', e.message);
  }

  return res.json({ newOrder });
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
    return res.status(500).json({ error: err.message || String(err) });
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
    return res.status(500).json({ error: err.message || String(err) });
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
    return res.status(500).json({ error: err.message || String(err) });
  }
});

router.get('/orderdelivery/:oid', async (req, res) => {
  const { oid } = req.params;
  try {
    if (!(await canSeeOrder(req, oid))) {
      return res.status(403).json({ error: 'Not allowed for this order' });
    }
    let rows = await OrderDelivery.findOne({
      where: { order_id: oid }
    });
    return res.json(rows);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message || String(err) });
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
    return res.status(500).json({ error: err.message || String(err) });
  }
});

module.exports = router;

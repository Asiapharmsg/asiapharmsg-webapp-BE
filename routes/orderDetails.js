const express = require('express');
const router = express.Router();
const OrderDetail = require('./../productModels/OrderDetail.model');
const Product = require('./../productModels/Product.model');
const Order = require('./../productModels/Order.model');
const Billing = require('./../productModels/Billing.model');
const User = require('./../productModels/User.model');
const mailer = require('../utils/mailer');
const oldUser = require('../models').User;
const helpers = require('../utils/helpers');
const { requireAdmin, selfOrAdmin } = require('../utils/authenticator');
const { canSeeOrder } = require('../utils/orderAccess');

// approved, pending, rejected, partially fulfilled
const ORDER_LINE_STATUSES = [1, 2, 3, 5];

router.get('/', requireAdmin, async (req, res) => {
  try {
    let rows = await OrderDetail.findAll();
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

router.get('/supplier/:sId', selfOrAdmin('sId'), async (req, res) => {
  const { sId } = req.params;
  try {
    console.log('here');
    let rows = await Order.findAll({
      include: [
        {
          model: OrderDetail,
          required: true,
          where: { supplier_id: sId },
          include: [
            {
              model: User,
              attributes: ['company_name', 'phone'],
              required: true
            },
            {
              model: Product,
              attributes: ['name', 'price_tier_1'],
              required: true
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    console.log(rows);
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

router.get('/user/:uid', selfOrAdmin('uid'), async (req, res) => {
  const { uid } = req.params;
  console.log('HELLO');
  try {
    let rows = await Order.findAll({
      where: { user_id: uid },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: OrderDetail,
          required: true,
          include: [
            {
              model: User,
              attributes: ['company_name', 'phone'],
              required: true
            },
            {
              model: Product,
              attributes: ['name', 'price_tier_1'],
              required: true
            }
          ]
        }
      ]
    });
    console.log('This is the testing code', rows.length);
    return res.json(rows);
  } catch (err) {
    console.log(err.message);
    return res.status(500).json(err);
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const { product_id, order_id, quantity, price, supplier_id, status } =
    req.body;
  console.log('here', req.body);
  try {
    const newOrderDetail = await OrderDetail.create({
      product_id,
      supplier_id,
      order_id,
      quantity,
      price: parseFloat(price),
      status
    });

    //send email to user and supplier
    //const userData = await oldUser.findByPk(supplier_id);
    //mailer.sendNewOrderMail(userData.email);

    return res.json({ newOrderDetail });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json(error);
  }
});

router.get('/order/:oid', async (req, res) => {
  const { oid } = req.params;
  try {
    if (!(await canSeeOrder(req, oid))) {
      return res.status(403).json({ error: 'Not allowed for this order' });
    }
    let rows = await OrderDetail.findAll({
      where: { order_id: oid },
      include: [
        {
          model: User,
          attributes: ['company_name', 'phone'],
          required: true
        },
        {
          model: Product,
          attributes: ['name', 'price_tier_1'],
          required: true
        }
      ]
    });
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

router.patch('/:odid', async (req, res) => {
  const { remarks } = req.body;
  const status = Number(req.body.status);
  if (!ORDER_LINE_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid order line status' });
  }

  try {
    const { odid } = req.params;
    const orderDetail = await OrderDetail.findByPk(odid);
    if (!orderDetail) return res.status(404).json({ error: 'Order line not found' });
    if (!req.isAdmin && String(orderDetail.supplier_id) !== String(req.userId)) {
      return res.status(403).json({ error: 'Not your order line' });
    }
    const wasApproved = Number(orderDetail.status) === 1;
    const order_id = orderDetail.order_id;
    const order_obj = await Order.findByPk(order_id);
    const clinic = await User.findByPk(order_obj.user_id);
    console.log('remarks patch orderdetails :', remarks);
    const updatedOrder = await OrderDetail.update(
      { status, remarks },
      {
        where: {
          id: odid
        }
      }
    );

    let OrderDetailRows = await OrderDetail.findAll({
      where: { order_id: order_id }
    });

    // console.log(OrderDetailRows.length);
    let sArray = [];

    for (var i = 0; i < OrderDetailRows.length; i++) {
      // console.log( typeof OrderDetailRows[i].status);
      sArray.push(OrderDetailRows[i].status);
      // console.log("status here >>>>" , OrderDetailRows[i].status);
    }

    console.log(sArray);

    if (sArray.includes(2) || sArray.includes(5)) {
      // if any of the order detail is pending or partially fulfilled
      const status1 = helpers.getCompleteOrderStatus(sArray);

      const updatedOrder1 = await Order.update(
        { status: status1 },
        {
          where: {
            id: order_id
          }
        }
      );
    } else if (sArray.includes(3)) {
      // if any order detail is rejected
      const status1 = helpers.getCompleteOrderStatus(sArray);
      // console.log("status1", status1);
      const updatedOrder1 = await Order.update(
        { status: status1 },
        {
          where: {
            id: order_id
          }
        }
      );
      //check order email send already ?
      try {
        if (order_obj.sent == 0) {
          mailer.sendRejectOrderMail(clinic, order_obj);
        }
      } catch (err) {
        return res.status(500).json({ error: err.message || String(err) });
      }
    } else {
      // console.log("else");
      const status1 = 1;
      // console.log("status1", status1);

      //check order email send already ?
      try {
        if (order_obj.sent == 0) {
          mailer.sendApproveOrderMail(clinic, order_obj);
        }
      } catch (err) {
        return res.status(500).json({ error: err.message || String(err) });
      }

      console.log('Update here....');
      const updatedOrder1 = await Order.update(
        { status: status1, sent: 1 },
        {
          where: {
            id: order_id
          }
        }
      );
    }

    // A line bills the 5% commission once, when it first becomes approved.
    // Price and supplier come from the stored line, never from the request.
    if (status === 1 && !wasApproved) {
      const existing = await Billing.findOne({
        where: { order_detail_id: odid }
      });
      if (!existing) {
        await Billing.create({
          order_detail_id: odid,
          supplier_id: orderDetail.supplier_id,
          billing_price: Number(orderDetail.price) * 0.05,
          status: 1
        });
        console.log('Billing record created for order line', odid);
      }
    } else if (status === 3) {
      //mailer.sendRejectOrderMail(clinic_email, order_id, odid);
    }

    if (updatedOrder[0] !== 0) {
      return res.json({
        message: 'Order updated successfully!',
        orderDetailId: updatedOrder,
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

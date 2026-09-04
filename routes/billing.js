const express = require('express');
const router = express.Router();
const Billing = require('./../productModels/Billing.model');
//const OrderDetail = require('./../models/OrderDetail.model');
const User = require('./../productModels/User.model');
const { requireAdmin, selfOrAdmin } = require('../utils/authenticator');

router.get('/', requireAdmin, async (req, res) => {
  try {
    let rows = await Billing.findAll({
      include: [
        {
          model: User,
          attributes: ['company_name'],
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

// To do: add to order status update to approve
router.post('/', requireAdmin, async (req, res) => {
  const { order_id, billing_price, status } = req.body;
  try {
    const newBilling = await Billing.create({
      order_id,
      billing_price,
      status
    });
    if (newBilling.id) {
      return res.json({ newBilling });
    } else {
      return res.json({ error: true, message: 'Error creating billing' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
});

router.get('/supplier/:sid', selfOrAdmin('sid'), async (req, res) => {
  const { sid } = req.params;
  try {
    let rows = await Billing.findAll({ where: { supplier_id: sid } });
    return res.json(rows);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

router.patch('/:bid', requireAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    const { bid } = req.params;
    const updatedBilling = await Billing.update(
      { status },
      {
        where: {
          id: bid
        }
      }
    );
    if (updatedBilling[0] !== 0) {
      return res.json({
        message: 'Billing updated successfully!',
        BillingId: updatedBilling,
        success: true
      });
    } else {
      return res.json({
        message: 'Billing not found!',
        success: false
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

module.exports = router;

const Order = require('../productModels/Order.model');
const OrderDetail = require('../productModels/OrderDetail.model');

// Admins, the clinic that placed the order, and vendors that supply at least
// one of its lines may read the order's delivery record and lines.
// Must run after authenticate.
const canSeeOrder = async (req, orderId) => {
  if (req.isAdmin) return true;
  const order = await Order.findByPk(orderId, { attributes: ['id', 'user_id'] });
  if (!order) return false;
  if (String(order.user_id) === String(req.userId)) return true;
  const line = await OrderDetail.findOne({
    where: { order_id: orderId, supplier_id: req.userId },
    attributes: ['id']
  });
  return !!line;
};

module.exports = { canSeeOrder };

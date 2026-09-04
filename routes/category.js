const express = require('express');
const router = express.Router();
const Category = require('./../productModels/Category.model');
const { requireAdmin } = require('../utils/authenticator');

router.get('/', async (req, res) => {
  try {
    let rows = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  try {
    await Category.create({ name: name, description: description });
    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

router.delete('/:cid', requireAdmin, async (req, res) => {
  try {
    const { cid } = req.params;
    const deletedCategoryId = await Category.destroy({
      where: {
        id: cid
      }
    });
    if (deletedCategoryId !== 0) {
      return res.json({
        message: 'Category deleted successfully!',
        productId: deletedCategoryId,
        success: true
      });
    } else {
      return res.json({
        message: 'Category not found!',
        success: false
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

module.exports = router;

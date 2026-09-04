const express = require('express');
const router = express.Router();
const Product = require('./../productModels/Product.model');
const Sequelize = require('sequelize');
const { imageUpload, multiImageUpload } = require('../aws/upload');
const { requireAdmin } = require('../utils/authenticator');

const IMAGE_SLOTS = ['image', 'sub_image1', 'sub_image2'];

// Maps uploaded files to product image columns. The form sends one
// `image_slots` value per file naming its column; without them the files are
// taken in order (primary, then the two secondary images).
const imageColumns = (req) => {
  const slots = [].concat(req.body.image_slots ?? []);
  const columns = {};
  (req.files || []).forEach((file, i) => {
    const slot = slots[i] ?? IMAGE_SLOTS[i];
    if (IMAGE_SLOTS.includes(slot)) columns[slot] = file.location;
  });
  return columns;
};

// Vendors may only change their own products; admins may change any.
const ownerOrAdmin = async (req, res, next) => {
  try {
    if (req.isAdmin) return next();
    const product = await Product.findByPk(req.params.pid);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (String(product.supplier_id) !== String(req.userId)) {
      return res.status(403).json({ error: 'Not your product' });
    }
    return next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

router.get('/', async (req, res) => {
  try {
    const { category_id, searchText, supplier_id } = req.query;
    const page = req.query.page || 1;
    const page_size = req.query.page_size || 10;
    const offset = (page - 1) * page_size;

    if (!supplier_id) {
      if (!category_id && searchText) {
        let rows = await Product.findAndCountAll({
          where: {
            [Sequelize.Op.or]: [
              { name: { [Sequelize.Op.iLike]: '%' + searchText + '%' } },
              { ingredients: { [Sequelize.Op.iLike]: '%' + searchText + '%' } }
            ],
            inventory_count: { [Sequelize.Op.ne]: 0 }
          },
          order: [['name', 'ASC']],
          offset: offset,
          limit: page_size
        });

        return res.json({
          total_pages: parseInt(Math.ceil(rows.count / page_size)),
          data: rows.rows
        });
      } else if (category_id && !searchText) {
        let rows = await Product.findAndCountAll({
          where: {
            category_id,
            inventory_count: { [Sequelize.Op.ne]: 0 }
          },
          order: [['name', 'ASC']],
          offset: offset,
          limit: page_size
        });
        return res.json({
          total_pages: parseInt(Math.ceil(rows.count / page_size)),
          data: rows.rows
        });
      } else if (category_id && searchText) {
        let rows = await Product.findAndCountAll({
          where: {
            //category_id,
            inventory_count: { [Sequelize.Op.ne]: 0 },
            [Sequelize.Op.or]: [
              { name: { [Sequelize.Op.iLike]: '%' + searchText + '%' } },
              { ingredients: { [Sequelize.Op.iLike]: '%' + searchText + '%' } }
            ]
          },
          order: [['name', 'ASC']],
          offset: offset,
          limit: page_size
        });
        return res.json({
          total_pages: parseInt(Math.ceil(rows.count / page_size)),
          data: rows.rows
        });
      } else {
        let rows = await Product.findAndCountAll({
          where: {
            inventory_count: { [Sequelize.Op.ne]: 0 }
          },
          order: [['name', 'ASC']],
          offset: offset,
          limit: page_size
        });
        return res.json({
          total_pages: parseInt(Math.ceil(rows.count / page_size)),
          data: rows.rows
        });
      }
    } else {
      if (!category_id && searchText) {
        let rows = await Product.findAndCountAll({
          where: {
            supplier_id,
            inventory_count: { [Sequelize.Op.ne]: 0 },
            [Sequelize.Op.or]: [
              { name: { [Sequelize.Op.iLike]: '%' + searchText + '%' } },
              { ingredients: { [Sequelize.Op.iLike]: '%' + searchText + '%' } }
            ]
          },

          order: [['name', 'ASC']],
          offset: offset,
          limit: page_size
        });

        return res.json({
          total_pages: parseInt(Math.ceil(rows.count / page_size)),
          data: rows.rows
        });
      } else if (category_id && !searchText) {
        let rows = await Product.findAndCountAll({
          where: {
            supplier_id,
            category_id,
            inventory_count: { [Sequelize.Op.ne]: 0 }
          },
          order: [['name', 'ASC']],
          offset: offset,
          limit: page_size
        });
        return res.json({
          total_pages: parseInt(rows.count / page_size),
          data: rows.rows
        });
      } else if (category_id && searchText) {
        let rows = await Product.findAndCountAll({
          where: {
            supplier_id,
            //category_id,
            inventory_count: { [Sequelize.Op.ne]: 0 },
            [Sequelize.Op.or]: [
              { name: { [Sequelize.Op.iLike]: '%' + searchText + '%' } },
              { ingredients: { [Sequelize.Op.iLike]: '%' + searchText + '%' } }
            ]
          },
          order: [['name', 'ASC']],
          offset: offset,
          limit: page_size
        });
        return res.json({
          total_pages: parseInt(Math.ceil(rows.count / page_size)),
          data: rows.rows
        });
      } else {
        let rows = await Product.findAndCountAll({
          where: { supplier_id, inventory_count: { [Sequelize.Op.ne]: 0 } },
          order: [['name', 'ASC']],
          offset: offset,
          limit: page_size
        });
        return res.json({
          total_pages: parseInt(Math.ceil(rows.count / page_size)),
          data: rows.rows
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

router.get('/single/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    let product = await Product.findOne({ where: { id: pid } });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

router.get('/supplier/:sid', async (req, res) => {
  const { sid } = req.params;
  try {
    let rows = await Product.findAll({
      where: { supplier_id: sid },
      order: [['name', 'ASC']]
    });
    return res.json(rows);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

router.get('/pending', requireAdmin, async (req, res) => {
  try {
    const { pid } = req.params;
    let product = await Product.findAll({ where: { status: 2 } });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

router.post('/', async (req, res) => {
  try {
    multiImageUpload(req, res, async (error) => {
      if (error) {
        return res.status(400).json({ error: error.message || String(error) });
      } else {
        const images = imageColumns(req);
        if (!images.image) {
          return res.status(400).json({ error: 'A product image is required' });
        } else {
          if (!req.isAdmin) req.body.supplier_id = req.userId;
          // return res.json(filesArray);
          // const imageLocation = req.file.location;
          const {
            name,
            description,
            ingredients,
            category_id,
            supplier_id,
            price_tier_1,
            price_tier_2,
            price_tier_3,
            unit_measurement,
            expiry_date,
            inventory_count,
            status,
            remarks
          } = req.body;

          try {
            await Product.create({
              name: name,
              description: description,
              ingredients: ingredients,
              category_id: category_id,
              supplier_id: supplier_id,
              ...images,
              price_tier_1: price_tier_1,
              price_tier_2: price_tier_2,
              price_tier_3: price_tier_3,
              unit_measurement: unit_measurement,
              expiry_date: expiry_date,
              inventory_count: inventory_count,
              status: status,
              remarks: remarks
            });
            return res.json({
              message: 'Product added successfully!',
              success: true
            });
          } catch (err) {
            return res
              .status(500)
              .json({ error: err.message || String(err), success: false });
          }
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
});

router.patch('/:pid', ownerOrAdmin, async (req, res) => {
  const { pid } = req.params;

  multiImageUpload(req, res, async (error) => {
    // A vendor's product stays that vendor's product.
    if (!req.isAdmin) req.body.supplier_id = req.userId;
    const {
      name,
      description,
      ingredients,
      category_id,
      supplier_id,
      price_tier_1,
      price_tier_2,
      price_tier_3,
      unit_measurement,
      expiry_date,
      inventory_count,
      status,
      remarks
    } = req.body;
    if (error) {
      return res.status(400).json({ error: error.message || String(error) });
    } else {
      if (!req.files || req.files.length === 0) {
        try {
          const updatedProduct = await Product.update(
            {
              name,
              description,
              ingredients,
              category_id,
              supplier_id,
              price_tier_1,
              price_tier_2,
              price_tier_3,
              unit_measurement,
              expiry_date,
              inventory_count,
              status,
              remarks
            },
            {
              where: {
                id: pid
              }
            }
          );
          if (updatedProduct[0]) {
            return res.json({
              message: 'Product updated successfully!',
              product: updatedProduct[0],
              success: true
            });
          } else {
            return res.json({
              message: 'Product not found!',
              success: false,
              id: pid
            });
          }
        } catch (error) {
          return res
            .status(500)
            .json({ error: error.message || String(error) });
        }
      } else {
        try {
          const updatedProduct = await Product.update(
            {
              name,
              description,
              ingredients,
              category_id,
              supplier_id,
              price_tier_1,
              price_tier_2,
              price_tier_3,
              unit_measurement,
              expiry_date,
              inventory_count,
              status,
              remarks,
              // only the slots that received a new file are replaced
              ...imageColumns(req)
            },
            {
              where: {
                id: pid
              }
            }
          );
          if (updatedProduct[0]) {
            return res.json({
              message: 'Product updated successfully!',
              product: updatedProduct[0],
              success: true
            });
          } else {
            return res.json({
              message: 'Product not found!',
              success: false,
              id: pid
            });
          }
        } catch (err) {
          return res.status(500).json({ error: err.message || String(err) });
        }
      }
    }
  });
});

router.delete('/:pid', ownerOrAdmin, async (req, res) => {
  try {
    const { pid } = req.params;
    const deletedProductId = await Product.destroy({
      where: {
        id: pid
      }
    });
    if (deletedProductId !== 0) {
      return res.json({
        message: 'Product deleted successfully!',
        productId: deletedProductId,
        success: true
      });
    } else {
      return res.json({
        message: 'Product not found!',
        success: false
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

module.exports = router;

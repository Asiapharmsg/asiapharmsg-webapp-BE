const express = require('express');
const router = express.Router();
const Product = require('./../productModels/Product.model');
const Sequelize = require('sequelize');
const { imageUpload, multiImageUpload } = require('../aws/upload');

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
    res.json(err);
  }
});

router.get('/single/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    let product = await Product.findOne({ where: { id: pid } });
    return res.json(product);
  } catch (err) {
    return res.json(err);
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
    return res.json(err);
  }
});

router.get('/pending', async (req, res) => {
  try {
    const { pid } = req.params;
    let product = await Product.findAll({ where: { status: 2 } });
    return res.json(product);
  } catch (err) {
    return res.json(err);
  }
});

router.post('/', async (req, res) => {
  try {
    multiImageUpload(req, res, async (error) => {
      if (error) {
        return res.json({ error: error });
      } else {
        if (req.files === undefined) {
          return res.json('Error: No File Selected');
        } else {
          const filesArray = req.files;
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
              image: filesArray[0]?.location,
              sub_image1: filesArray[1]?.location,
              sub_image2: filesArray[2]?.location,
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
            return res.json({ error: err, success: true });
          }
        }
      }
    });
  } catch (error) {
    return res.json(error);
  }
});

router.patch('/:pid', async (req, res) => {
  const { pid } = req.params;

  multiImageUpload(req, res, async (error) => {
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
      return res.json({ error: error });
    } else {
      if (req.files === undefined) {
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
          return res.json({ error });
        }
      } else {
        //const imageLocation = req.file.location;
        const filesArray = req.files;

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
              //image: imageLocation
              image: filesArray[0]?.location,
              sub_image1: filesArray[1]?.location,
              sub_image2: filesArray[2]?.location
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
          return res.json(err);
        }
      }
    }
  });
});

router.delete('/:pid', async (req, res) => {
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
    return res.json(err);
  }
});

module.exports = router;

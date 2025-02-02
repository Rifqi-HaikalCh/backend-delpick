const express = require('express');
const router = express.Router();
const ProductService = require('../services/productService');
const { authenticateToken, isStore } = require('../middleware/authMiddleware');
const productMiddleware = require('../middleware/productMiddleware');

router.get('/', async (req, res) => {
  try {
    const products = await ProductService.getAllProducts();
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post(
  '/',
  [
    authenticateToken,
    isStore,
    productMiddleware.validateProduct
  ],
  async (req, res) => {
    try {
      const product = await ProductService.createProduct(req.body, req.user.userId);
      res.status(201).json({
        success: true,
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.put(
  '/:productId',
  [
    authenticateToken,
    isStore,
    productMiddleware.checkProductExists,
    productMiddleware.verifyProductOwnership,
    productMiddleware.validateUpdateData
  ],
  async (req, res) => {
    try {
      const product = await ProductService.updateProduct(
        req.params.productId,
        req.body,
        req.user.userId
      );
      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.delete(
  '/:productId',
  [
    authenticateToken,
    isStore,
    productMiddleware.checkProductExists,
    productMiddleware.verifyProductOwnership
  ],
  async (req, res) => {
    try {
      const result = await ProductService.deleteProduct(
        req.params.productId,
        req.user.userId
      );
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
const { firebaseDB } = require('../config/firebase');

const productMiddleware = {
  validateProduct: async (req, res, next) => {
    try {
      const { name, description, price, category, stock } = req.body;

      const errors = [];

      if (!name) errors.push('Product name is required');
      if (!description) errors.push('Product description is required');
      if (!price) errors.push('Product price is required');
      if (!category) errors.push('Product category is required');
      if (stock === undefined || stock === null) errors.push('Product stock is required');
      if (typeof name !== 'string') errors.push('Product name must be a string');
      if (typeof description !== 'string') errors.push('Product description must be a string');
      if (typeof category !== 'string') errors.push('Product category must be a string');
      if (typeof price !== 'number') errors.push('Product price must be a number');
      if (typeof stock !== 'number') errors.push('Product stock must be a number');
      if (price < 0) errors.push('Product price cannot be negative');
      if (stock < 0) errors.push('Product stock cannot be negative');

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error validating product data',
        error: error.message
      });
    }
  },

  checkProductExists: async (req, res, next) => {
    try {
      const productId = req.params.productId;
      const productDoc = await firebaseDB.collections.products.doc(productId).get();

      if (!productDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      req.product = productDoc.data();
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking product existence',
        error: error.message
      });
    }
  },

  verifyProductOwnership: async (req, res, next) => {
    try {
      const storeId = req.user.userId;
      const product = req.product; 

      if (product.store_id !== storeId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to modify this product'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error verifying product ownership',
        error: error.message
      });
    }
  },

  validateUpdateData: async (req, res, next) => {
    try {
      const updateData = req.body;
      const errors = [];

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No update data provided'
        });
      }

      if ('name' in updateData && typeof updateData.name !== 'string') {
        errors.push('Product name must be a string');
      }
      if ('description' in updateData && typeof updateData.description !== 'string') {
        errors.push('Product description must be a string');
      }
      if ('price' in updateData) {
        if (typeof updateData.price !== 'number' || updateData.price < 0) {
          errors.push('Product price must be a positive number');
        }
      }
      if ('stock' in updateData) {
        if (typeof updateData.stock !== 'number' || updateData.stock < 0) {
          errors.push('Product stock must be a positive number');
        }
      }
      if ('category' in updateData && typeof updateData.category !== 'string') {
        errors.push('Product category must be a string');
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error validating update data',
        error: error.message
      });
    }
  }
};

module.exports = productMiddleware;
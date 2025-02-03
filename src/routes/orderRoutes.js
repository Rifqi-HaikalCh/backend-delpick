const express = require('express');
const router = express.Router();
const OrderService = require('../services/orderService');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateOrderData, validateOrderUpdate, isCustomer } = require('../middleware/orderMiddleware');

router.post('/add', 
    authenticateToken, 
    isCustomer,
    validateOrderData,
    async (req, res) => {
      try {
        console.log('User data from token:', req.user);
        
        if (!req.user || !req.user.userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID not found in token'
          });
        }
  
        const order = await OrderService.createOrder(req.body, req.user.userId);
        res.status(201).json({
          success: true,
          message: 'Order created successfully',
          data: order
        });
      } catch (error) {
        console.error('Error in create order route:', error);
        res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }
  );

router.put('/:orderId', 
  authenticateToken,
  isCustomer,
  validateOrderUpdate,
  async (req, res) => {
    try {
      const order = await OrderService.updateOrder(
        req.params.orderId,
        req.body,
        req.user.userId
      );
      res.json({
        success: true,
        message: 'Order updated successfully',
        data: order
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.delete('/:orderId',
  authenticateToken,
  isCustomer,
  async (req, res) => {
    try {
      await OrderService.deleteOrder(req.params.orderId, req.user.userId);
      res.json({
        success: true,
        message: 'Order deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.get('/:orderId',
  authenticateToken,
  async (req, res) => {
    try {
      const order = await OrderService.getOrderById(
        req.params.orderId,
        req.user.userId,
        req.user.role
      );
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.get('/all',
  authenticateToken,
  async (req, res) => {
    try {
      const orders = await OrderService.getAllOrders(req.user.userId, req.user.role);
      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
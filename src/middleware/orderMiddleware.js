const validateOrderData = (req, res, next) => {
    const { store_id, orderItems } = req.body;
  
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }
  
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'orderItems must be a non-empty array'
      });
    }
  
    for (const item of orderItems) {
      if (!item.product_id) {
        return res.status(400).json({
          success: false,
          message: 'Each order item must have a product_id'
        });
      }
  
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Each order item must have a positive quantity'
        });
      }
    }
  
    next();
  };
  
  const validateOrderUpdate = (req, res, next) => {
    const { orderItems, status } = req.body;
  
    if (orderItems !== undefined) {
      if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'orderItems must be a non-empty array'
        });
      }
  
      for (const item of orderItems) {
        if (!item.product_id) {
          return res.status(400).json({
            success: false,
            message: 'Each order item must have a product_id'
          });
        }
  
        if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Each order item must have a positive quantity'
          });
        }
      }
    }
  
    if (status !== undefined) {
      const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order status'
        });
      }
    }
  
    next();
  };
  
  const isCustomer = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
  
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Customer privileges required.'
      });
    }
    next();
  };
  
  module.exports = {
    validateOrderData,
    validateOrderUpdate,
    isCustomer
  };
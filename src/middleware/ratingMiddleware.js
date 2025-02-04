const validateRatingData = (req, res, next) => {
    const { rating } = req.body;
  
    if (!rating || typeof rating !== 'number' || rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 0 and 5'
      });
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
    validateRatingData,
    isCustomer
  };
const express = require('express');
const router = express.Router();
const RatingService = require('../services/ratingService');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateRatingData, isCustomer } = require('../middleware/ratingMiddleware');

router.post('/drivers/:driverId', 
  authenticateToken, 
  isCustomer,
  validateRatingData,
  async (req, res) => {
    try {
      await RatingService.createDriverRating(
        req.params.driverId, 
        req.body.rating, 
        req.body.orderId
      );
      res.status(201).json({
        success: true,
        message: 'Driver rating created'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.post('/stores/:storeId', 
  authenticateToken,
  isCustomer, 
  validateRatingData,
  async (req, res) => {
    try {
      await RatingService.createStoreRating(
        req.params.storeId, 
        req.body.rating, 
        req.body.orderId
      );
      res.status(201).json({
        success: true,
        message: 'Store rating created'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.get('/drivers/:driverId', 
  authenticateToken,
  async (req, res) => {
    try {
      const driverRating = await RatingService.getDriverRating(req.params.driverId);
      res.status(200).json({
        success: true,
        data: driverRating
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.get('/stores/:storeId', 
  authenticateToken,
  async (req, res) => {
    try {
      const storeRating = await RatingService.getStoreRating(req.params.storeId);
      res.status(200).json({
        success: true,
        data: storeRating
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
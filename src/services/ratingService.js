const { firebaseDB } = require('../config/firebase');

class RatingService {
  async createDriverRating(driverId, rating, orderId) {
    try {
      await firebaseDB.createDriverRating(driverId, rating, orderId);
    } catch (error) {
      throw new Error('Error creating driver rating: ' + error.message);
    }
  }

  async createStoreRating(storeId, rating, orderId) {
    try {
      await firebaseDB.createStoreRating(storeId, rating, orderId);
    } catch (error) {
      throw new Error('Error creating store rating: ' + error.message);
    }
  }

  async getDriverRating(driverId) {
    try {
      return await firebaseDB.getDriverRating(driverId);
    } catch (error) {
      throw new Error('Error getting driver rating: ' + error.message);
    }
  }

  async getStoreRating(storeId) {
    try {
      return await firebaseDB.getStoreRating(storeId);
    } catch (error) {
      throw new Error('Error getting store rating: ' + error.message);
    }
  }
}

module.exports = new RatingService();
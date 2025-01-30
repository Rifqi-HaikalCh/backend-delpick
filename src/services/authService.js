const firebaseDB = require('../config/firebase').firebaseDB; // Ensure firebaseDB is imported properly
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  async registerAdmin(req, res) {
    try {
      const { username, email, password, phone_number } = req.body;
      const userId = uuidv4();
  
      if (!firebaseDB.collections.admins) {
        throw new Error("Firestore collection 'admins' is not initialized properly.");
      }
  
      await firebaseDB.createUser({
        user_id: userId,
        username,
        email,
        password,
        phone_number,
        role: 'admin'
      });
  
      await firebaseDB.collections.admins.doc(userId).set({
        admin_id: userId,
        user_id: userId,
        last_login: null
      });
  
      const token = jwt.sign(
        { userId, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
  
      res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        token,
        data: { userId, username, email, role: 'admin' }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error registering admin',
        error: error.message
      });
    }
    // console.log(firebaseDB.collections.admins);
    // console.log(firebaseDB);
  }

  async registerCustomer(req, res) {
    try {
      const { username, email, password, phone_number, address } = req.body;
      const userId = uuidv4();

      await firebaseDB.createUser({
        user_id: userId,
        username,
        email,
        password,
        phone_number,
        role: 'customer'
      });

      await firebaseDB.collections.customers.doc(userId).set({
        customer_id: userId,
        user_id: userId,
        address: address || '',
        rating: 5.0
      });

      const token = jwt.sign(
        { userId, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'Customer registered successfully',
        token,
        data: { userId, username, email, role: 'customer' }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error registering customer',
        error: error.message
      });
    }
  }

  async registerDriver(req, res) {
    try {
      const { username, email, password, phone_number, license_number } = req.body;
      const userId = uuidv4();

      if (!license_number) {
        return res.status(400).json({
          success: false,
          message: 'License number is required for drivers'
        });
      }

      await firebaseDB.createUser({
        user_id: userId,
        username,
        email,
        password,
        phone_number,
        role: 'driver'
      });

      await firebaseDB.collections.drivers.doc(userId).set({
        driver_id: userId,
        user_id: userId,
        license_number,
        rating: 5.0
      });

      const token = jwt.sign(
        { userId, role: 'driver' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'Driver registered successfully',
        token,
        data: { userId, username, email, role: 'driver' }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error registering driver',
        error: error.message
      });
    }
  }

  async registerStore(req, res) {
    try {
      const { 
        username, 
        email, 
        password, 
        phone_number, 
        store_name, 
        description, 
        address, 
        operation_hours 
      } = req.body;
      
      const userId = uuidv4();
      const storeId = uuidv4();

      if (!store_name || !address) {
        return res.status(400).json({
          success: false,
          message: 'Store name and address are required'
        });
      }

      await firebaseDB.createUser({
        user_id: userId,
        username,
        email,
        password,
        phone_number,
        role: 'store'
      });

      await firebaseDB.createStore({
        store_id: storeId,
        user_id: userId,
        store_name,
        description: description || '',
        address,
        phone: phone_number,
        operation_hours: operation_hours || '09:00-17:00',
        rating: 5.0,
        is_active: true
      });

      const token = jwt.sign(
        { userId, storeId, role: 'store' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'Store registered successfully',
        token,
        data: { 
          userId, 
          storeId, 
          username, 
          email, 
          role: 'store',
          store_name 
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error registering store',
        error: error.message
      });
    }
  }

  async test() {
    return { message: 'Auth service working!' };
  }
}

module.exports = new AuthService();
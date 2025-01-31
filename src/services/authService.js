const firebaseDB = require('../config/firebase').firebaseDB;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  async registerAdmin(req, res) {
    try {
      const { username, email, password, phone_number } = req.body;
      const userId = uuidv4();

      // Validasi input
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Create user in Firebase
      const userRecord = await firebaseDB.createUser({
        user_id: userId,
        username,
        email,
        password,
        phone_number,
        role: 'admin'
      });

      // Create admin document
      await firebaseDB.collections.admins.doc(userId).set({
        admin_id: userId,
        user_id: userId,
        last_login: null,
        created_at: firebaseDB.admin.firestore.FieldValue.serverTimestamp()
      });

      // Generate JWT
      const token = jwt.sign(
        { 
          userId,
          role: 'admin',
          email: userRecord.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Response tanpa password
      res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        token,
        data: {
          userId,
          username,
          email,
          password,
          role: 'admin',
          phone_number
        }
      });

    } catch (error) {
      console.error('Registration Error:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });

      const statusCode = error.code === 'auth/email-already-exists' ? 409 : 500;
      res.status(statusCode).json({
        success: false,
        message: 'Error registering admin',
        error: error.message
      });
    }
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

 // Menambahkan metode baru untuk mendapatkan semua data user
async getAllUsers(req, res) {
  try {
    const users = await firebaseDB.getAllUsers();
    res.status(200).json({
      success: true,
      message: 'All users retrieved successfully',
      data: users
    });
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: error.message
    });
  }
} 

  async test() {
    return { message: 'Auth service working!' };
  }

  // Metode login
  // async login(req, res) {
  //   try {
  //     const { email, password } = req.body;

  //     // Validasi input
  //     if (!email || !password) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Email and password are required'
  //       });
  //     }

  //     // Cari user berdasarkan email menggunakan Firebase Admin SDK
  //     const userSnapshot = await firebaseDB.db.collection('users')
  //       .where('email', '==', email)
  //       .limit(1)
  //       .get();

  //     if (userSnapshot.empty) {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'User not found'
  //       });
  //     }

  //     // Ambil data user pertama dari snapshot
  //     const userDoc = userSnapshot.docs[0].data();
      
  //     // Verifikasi password yang dikirim dengan password yang disimpan
  //     const passwordMatch = await bcrypt.compare(password, userDoc.password);

  //     if (!passwordMatch) {
  //       return res.status(401).json({
  //         success: false,
  //         message: 'Invalid credentials'
  //       });
  //     }

  //     // Generate JWT token
  //     const token = jwt.sign(
  //       { userId: userDoc.user_id, role: userDoc.role, email },
  //       process.env.JWT_SECRET,
  //       { expiresIn: '24h' }
  //     );

  //     res.status(200).json({
  //       success: true,
  //       message: 'Login successful',
  //       token,
  //       data: {
  //         userId: userDoc.user_id,
  //         username: userDoc.username,
  //         email,
  //         role: userDoc.role
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Login Error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Error logging in',
  //       error: error.message
  //     });
  //   }
  // }
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Log the email and password to debug the issue
      console.log('Received email:', email);
      console.log('Received password:', password);

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Check if email or password is undefined or null
      if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password format'
        });
      }

      // Fetch the user from Firestore by email
      const userSnapshot = await firebaseDB.collections.users.where('email', '==', email).limit(1).get();

      if (userSnapshot.empty) {
        console.log('No user found with this email.');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user data from Firestore
      const userDoc = userSnapshot.docs[0].data();
      console.log('User found:', userDoc);  // Log user data for debugging

      // Generate JWT Token
      const token = jwt.sign(
        { userId: userDoc.user_id, role: userDoc.role, email: userDoc.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return successful response with the token
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        data: {
          userId: userDoc.user_id,
          username: userDoc.username,
          email: userDoc.email,
          role: userDoc.role
        }
      });
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error logging in',
      });
    }
  }
  // async login(req, res) {
  //   try {
  //     const { email, password } = req.body;
  
  //      // Log the values to check if they're undefined
  //   console.log('Email:', email);
  //   console.log('Password:', password);

  //     if (!email || !password) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Email and password are required'
  //       });
  //     }
  
  //     // Check if email or password is undefined or null
  //     if (typeof email !== 'string' || typeof password !== 'string') {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Invalid email or password format'
  //       });
  //     }
  
  //     // Memanggil metode login dari firebaseDB
  //     const user = await firebaseDB.loginWithEmailAndPassword(email, password);
  
  //     // Generate JWT Token
  //     const token = jwt.sign(
  //       { userId: user.userId, role: user.role, email: user.email },
  //       process.env.JWT_SECRET,
  //       { expiresIn: '24h' }
  //     );
  
  //     // Mengirim response sukses dengan token
  //     res.status(200).json({
  //       success: true,
  //       message: 'Login successful',
  //       token,
  //       data: {
  //         userId: user.userId,
  //         username: user.username,
  //         email: user.email,
  //         role: user.role
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Login Error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: error.message || 'Error logging in',
  //     });
  //   }
  // }
  
}

module.exports = new AuthService();
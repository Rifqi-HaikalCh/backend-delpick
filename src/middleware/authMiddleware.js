const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');

const validateRegistrationData = (req, res, next) => {
  const { username, email, password, phone_number, role } = req.body;
  
  if (!username || !email || !password || !phone_number || !role) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid email format' 
    });
  } 

  if (password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 6 characters long' 
    });
  }

  const validRoles = ['admin', 'customer', 'driver', 'store'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid role specified' 
    });
  }

  next();
};

const checkEmailUnique = async (req, res, next) => {
  try {
    const { email } = req.body;
    const db = admin.firestore();
    
    const userSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (!userSnapshot.empty) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking email uniqueness:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking email uniqueness'
    });
  }
};

const hashPassword = async (req, res, next) => {
  try {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing password' 
    });
  }
};

module.exports = {
  validateRegistrationData,
  checkEmailUnique,
  hashPassword
};
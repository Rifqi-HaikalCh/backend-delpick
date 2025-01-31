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

// Middleware to check if the user is an admin
const checkAdmin = (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const token = req.headers.authorization.split(' ')[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the user role is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have the required permissions.'
      });
    }

    // Attach the decoded user data to the request object for use in the controller
    req.user = decoded;
    next(); // Proceed to the next middleware or controller
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed: Invalid or expired token.'
    });
  }
};

const validateUpdateUserData = (req, res, next) => {
  const { email, username } = req.body;

  if (email && !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format.'
    });
  }

  if (username && username.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Username must be at least 3 characters long.'
    });
  }

  next(); // Proceed to the next middleware or service
};

module.exports = {
  validateRegistrationData,
  checkEmailUnique,
  hashPassword,
  checkAdmin,
  validateUpdateUserData
};
const express = require('express');
const router = express.Router();
const { validateRegistrationData, hashPassword } = require('../middleware/authMiddleware');
const authService = require('../services/authService');

router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working!' });
}); 

router.post('/register/admin', 
  validateRegistrationData,
  hashPassword, 
  authService.registerAdmin
);  

router.post('/register/customer', 
  validateRegistrationData, 
  hashPassword, 
  authService.registerCustomer
);

router.post('/register/driver', 
  validateRegistrationData, 
  hashPassword, 
  authService.registerDriver
);

router.post('/register/store', 
  validateRegistrationData, 
  hashPassword, 
  authService.registerStore
);

module.exports = router;
const express = require('express');
const router = express.Router();
const { validateRegistrationData, hashPassword } = require('../middleware/authMiddleware');
const authService = require('../services/authService');
const { checkAdmin } = require('../middleware/authMiddleware');
const userService = require('../services/userService');

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

// Menambahkan route baru untuk mengambil semua data user
router.get('/users', authService.getAllUsers);

router.post('/login', authService.login);

router.post('/logout', (req, res) => {
  // Hanya memberikan respons sukses
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// Route to delete all users (only accessible by admins)
router.delete('/deleteallusers', checkAdmin, async (req, res) => {
  try {
    const result = await userService.deleteAllUsers();
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete all users'
    });
  }
});

// DELETE /api/auth/delete-user-by-email/:email (Only Admin can access)
router.delete('/delete-user-by-email/:email', checkAdmin, async (req, res) => {
  const { email } = req.params;  // Extract the email from the URL parameters

  try {
    const result = await userService.deleteUserByEmail(email);  // Call service to delete the user by email
    return res.status(200).json(result);  // Send success response
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete the user.'
    });
  }
});

// DELETE /api/auth/delete-admin/:email (Only Admin can access)
router.delete('/deleteadmin/:email', checkAdmin, async (req, res) => {
  const { email } = req.params;  // Extract the email from the URL parameters

  try {
    // Check if the email belongs to another admin user
    // The logic for this is optional, you can customize it further to prevent the logged-in admin from deleting their own account
    if (email === req.user.email) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account."
      });
    }

    // Call service to delete the user by email
    const result = await userService.deleteUserByEmail(email);  // Call service to delete the user by email
    return res.status(200).json(result);  // Success response
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete the user.'
    });
  }
});


// PUT /api/auth/update-user/:userId (Only Admin can update)
router.put('/update-user/:userId', checkAdmin, async (req, res) => {
  const { userId } = req.params;  // Extract the userId from the URL parameters
  const updatedData = req.body;  // Get the updated data from the request body

  try {
    const result = await userService.updateUserData(userId, updatedData); // Call service to update user data
    return res.status(200).json(result);  // Success response
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user data.'
    });
  }
});

// router.put('/updateuserwithvalid/:userId', checkAdmin, validateUpdateUserData, async (req, res) => {
//   const { userId } = req.params;
//   const updatedData = req.body;

//   try {
//     const result = await userService.updateUserData(userId, updatedData);
//     return res.status(200).json(result);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to update user data.'
//     });
//   }
// });

// // DELETE /api/auth/delete-user/:userId (Only Admin can access)
// router.delete('/deleteuserbyId/:userId', checkAdmin, async (req, res) => {
//   const { userId } = req.params;  // Extract the userId from the URL parameters

//   try {
//     const result = await userService.deleteUserById(userId);  // Call service to delete the user
//     return res.status(200).json(result);  // Send success response
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to delete the user.'
//     });
//   }
// });


module.exports = router;
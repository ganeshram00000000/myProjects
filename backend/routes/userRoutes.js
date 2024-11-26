const express = require('express');
const { userRegister, loginUser, logout, forgotPassword, resetPassword, getUserDetails, updatepassword, updateProfile, getSingleUser, getAlluser, updateUserRole, deleteUserForAdmin } = require('../controllers/usercontroler');
const { isAuthenticatedUser, authouriseRoles } = require('../middleware/auth');




const router = express.Router();

// Routes for user  operations
router.post('/register',  userRegister);
router.post('/login', loginUser);
router.get('/logout', logout);
router.post('/password/forgot', forgotPassword);
router.put('/password/reset/:token', resetPassword);
//my details
router.get('/me', isAuthenticatedUser, getUserDetails)
//update password
router.put('/password/update', isAuthenticatedUser,updatepassword)
//update email & name
router.put('/me/update', isAuthenticatedUser,updateProfile)
//get all user
router.get('/admin/users',isAuthenticatedUser,authouriseRoles("admin"), getAlluser);
//get single user 
router.get('/admin/users/:id',isAuthenticatedUser,authouriseRoles("admin"), getSingleUser);
//update user role for admin 
router.put('/admin/users/:id',isAuthenticatedUser,authouriseRoles("admin"), updateUserRole);
//delete user for admin 
router.delete('/admin/users/:id',isAuthenticatedUser,authouriseRoles("admin"), deleteUserForAdmin);

module.exports = router; 
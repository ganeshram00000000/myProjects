const express = require('express');
const { createorder, getSingleOrder, myOrders, getAllOrder, updateOrder, deleteOrder } = require('../controllers/orderControler');
const { isAuthenticatedUser, authouriseRoles } = require('../middleware/auth');
const router = express.Router();

router.post('/new', isAuthenticatedUser, createorder);
router.get('/singleorder/:id', isAuthenticatedUser, getSingleOrder);
router.get('/me', isAuthenticatedUser, myOrders);
router.get('/allOrder', isAuthenticatedUser, authouriseRoles("admin"), getAllOrder);
router.put('/admin/:id', isAuthenticatedUser, authouriseRoles("admin"), updateOrder);
router.delete('/admin/:id', isAuthenticatedUser, authouriseRoles("admin"), deleteOrder);

module.exports = router; 
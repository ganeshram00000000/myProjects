const express = require('express');

const { isAuthenticatedUser } = require('../middleware/auth');
const { processPayment, stripeSendApiKey } = require('../controllers/paymentControler');

const router = express.Router();

router.post('/payment/process', isAuthenticatedUser, processPayment)
router.get('/stripeapikey', stripeSendApiKey)

module.exports = router;

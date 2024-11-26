require('dotenv').config({ path: 'config/config.env' });

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports.processPayment = async (req, res, next) => {
    console.log(req.body.amount);
    
    try {
        const mypayment = await stripe.paymentIntents.create({
            amount: req.body.amount,
            currency: 'inr',
            metadata: {
                company: 'Ecommerce',
            },
        });

        res.status(200).json({
            success: true,
            client_secret: mypayment.client_secret,
        });
    } catch (error) {
        console.error(error); // Log any error that occurs
        next(error)
    }
};


module.exports.stripeSendApiKey = async (req, res, next) => {
    try { 
        res.status(200).json({
            success: true,
            stripeApiKey: process.env.STRIPE_PUBLISHABLE_KEY,
        });
    } catch (error) {
        console.error(error); // Log any error that occurs
        next(error)
    }
};
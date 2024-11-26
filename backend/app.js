const express = require('express');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRouts = require('./routes/paymentRouts');
const errorHandler = require('./utils/errorhandler');
const cookies = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload');
const path = require("path");


const app = express();
//config 
dotenv.config({ path: 'config/config.env' })

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
    credentials: true, // Allow cookies to be sent
}));
app.use(fileUpload()); 
app.use(bodyParser.urlencoded({extended:true}));

// Middleware to parse JSON
app.use(express.json());
app.use(cookies());

// Routes
app.use('/products', productRoutes);
app.use('/user',userRoutes );
app.use('/order',orderRoutes );
app.use('/payment', paymentRouts);

// Error handling middleware
app.use(errorHandler);

module.exports = app;

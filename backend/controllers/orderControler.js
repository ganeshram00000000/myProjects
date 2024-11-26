const orderModel = require("../model/orderModel");
const productsmodel = require("../model/productsmodel");

// Create new Order
module.exports.createorder = async (req, res, next) => {
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
    } = req.body;

    try {

        // New instance create karna
        const order = new orderModel({
            shippingInfo,
            orderItems,
            paymentInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paidAt: Date.now(),
            user: req.user._id
        });

        // Save karna using .save() method
        await order.save();

        res.status(201).json({
            success: true,
            order,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Order creation failed",
            error: error.message,
        });
    }
};
//get single order 
module.exports.getSingleOrder = async (req, res, next) => {
    try {
        const order = await orderModel.findOne({ _id: req.params.id }).populate("user", "name email");

        if (!order) {
            const err = new Error("Order not found with this ID");
            err.statusCode = 404;
            return next(err);
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        next(error);
    }
};

//get logged in user order
module.exports.myOrders = async (req, res, next) => {
    console.log(req.user._idS);

    try {
        const orders = await orderModel.find({ user: req.user._id })
        console.log(req.user._idS);

        if (!orders) {
            const err = new Error("Order not found ");
            err.statusCode = 404;
            return next(err);
        }
        res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        next(error);
    }
};

//get all  order  ---Admin

module.exports.getAllOrder = async (req, res, next) => {
    try {
        const orders = await orderModel.find()

        if (!orders) {
            const err = new Error("Order not found ");
            err.statusCode = 404;
            return next(err);
        }
        let totalAmount = 0;
        orders.forEach(order => totalAmount += order.totalPrice)
        res.status(200).json({
            success: true,
            totalAmount,
            orders,
        });
    } catch (error) {
        next(error);
    }
};

//update order status --admin
module.exports.updateOrder = async (req, res, next) => {
    try {
        const order = await orderModel.findOne({ _id: req.params.id })
        if (!order) {
            const err = new Error("Order not found ");
            err.statusCode = 404;
            return next(err);
        }
        if (order.orderStatus === "Delivered") {
            const err = new Error("You have already delivered this order ")
            err.statusCode = 404,
                next(err)
        }
        if (order.orderStatus === "Shipped") {
            order.orderItems.forEach(async (od) => {
                await updateStock(od.product, od.quantity)

            })
        }
        order.orderStatus = req.body.status;
        if (req.body.status === "Delivered") {
            order.deliveredAt = Date.now()

        }
        await order.save({ validateBeforeSave: false })

    } catch (error) {
        next(error);
    }
};

async function updateStock(id, quantity) {
    const product = await productsmodel.findOne({ _id: id })
    product.stock -= quantity;

    product.save({ validateBeforeSave: false })

}

//delete order 

module.exports.deleteOrder = async (req, res, next) => {
    try {
        const order = await orderModel.deleteOne({ _id: req.params.id })
        if (!order) {
            const err = new Error("Order not found ");
            err.statusCode = 404;
            return next(err);
        }
        res.status(200).json({
            success: true,
            order,
        });

    } catch (error) {
        next(error);
    }
};
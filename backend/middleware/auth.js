const jwt = require('jsonwebtoken');
const userModle = require('../model/userModle');
const { Error } = require('mongoose');
module.exports.isAuthenticatedUser = async (req, res, next) => {
    const { token } = req.cookies;


    if (!token) {
        const error = new Error("Please Login To Access this resource.");
        error.statusCode = 401;
        return next(error);
    }
    //verify token 
    try {
        const decodeData = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await userModle.findById(decodeData.id);

        if (!req.user) {
            const error = new Error("User not found.");
            error.statusCode = 404;
            return next(error);
        }

        next(); // Call the next middleware or route handler
    } catch (error) {
        next(error);


    }
};

//role chake user & admin
module.exports.authouriseRoles = (...rols) => {
    return (req, res, next) => {
        if (!rols.includes(req.user.role)) {
            const err = new Error(`Role : ${req.user.role} is not allowed to access this resouce`)
            err.statusCode = 401
            next(err)
        }
        next()
    }

}
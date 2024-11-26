const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { type } = require('os');


const userModel = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Your Name  "],
        maxLength: [30, 'Name Cannot Exceed 30 Charaters'],
        minLength: [4, 'Name  Should Have More Then 4 Charaters']
    },
    email: {
        type: String,
        required: [true, "Please Enter Your Email  "],
        unique: true,
        validate: [validator.isEmail, "Please Enter A Valid  Email"]
    },
    password: {
        type: String,
        required: [true, "Please Enter Your Password  "],
        minLength: [8, 'password  Should Be Greater  Then 8 Charaters'],
        select: false

    },
    avatar: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    role: {
        type: String,
        default: "user"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetpasswordtoken: String,
    resetpasswordexpire: Date,
})

//bcrypt use this password secure
userModel.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 12)
})

// Generate JWT Token
userModel.methods.getJWTtoken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};


//Capare Password

userModel.methods.comparePassword = async function (enterpassword) {

    return await bcrypt.compare(enterpassword, this.password)

}
// Generate Password Reset Token
userModel.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetpasswordtoken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetpasswordexpire = Date.now() + 15 * 60 * 1000;
    return resetToken;
};


module.exports = mongoose.model("user", userModel) 
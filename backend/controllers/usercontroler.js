const userModle = require("../model/userModle");
const sendToken = require("../utils/jwtTokens");
const sendEmail = require("../utils/sendEmail");
const crypto = require('crypto');
const cloudinary = require('cloudinary');
const { log } = require("console");
const { url } = require("inspector");

//user register
module.exports.userRegister = async (req, res, next) => {


    try {
        const { name, email, password, avatar } = req.body;

        if (!avatar) {
            return res.status(400).send("Avatar is required.");
        }

        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: 'avatars',
            width: 150,
            crop: "scale",
            resource_type: "image",
        })
        const newuser = new userModle(
            {
                name,
                email,
                password,
                avatar: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                },
            }
        );
        console.log(newuser);

        const user = await newuser.save();

        sendToken(user, 201, res)

    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
}

// Login User 
module.exports.loginUser = async (req, res, next) => {  
    const { email, password } = req.body;
    try {
        // Check if user has provided both email and password
        if (!email || !password) {
            const error = new Error("Please Enter Email and Password.");
            error.statusCode = 400;
            return next(error);
        }

        const user = await userModle.findOne({ email }).select("+password");
        if (!user) {
            const error = new Error("Invalid Email and Password.");
            error.statusCode = 400;
            return next(error);
        }

        // Password match
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            const error = new Error("Invalid Email and Password.");
            error.statusCode = 400;
            return next(error);
        }
        //send jwt  token function

        sendToken(user, 200, res)

    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};
// Logout User 

module.exports.logout = async (req, res, next) => {

    try {
        res.cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true
        })
        res.status(200).json({
            success: true,
            message: "LogOut Succefully.."
        })

    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};

// forgot password

module.exports.forgotPassword = async (req, res, next) => {

    const user = await userModle.findOne({ email: req.body.email })

    if (!user) {
        const err = new Error("User Not Found ")
        err.statusCode = 404;
        return next(err)
    }

    //Get Resetpassword Token 
    const resettoken = user.getResetPasswordToken()

    await user.save({ validateBeforeSave: false })

    const resetpasswordurl = `${process.env.FRONTEND_URL}/password/reset/${resettoken}`;
    const message = `Your password reset token is :-\n\n  ${resetpasswordurl} \n\n if you have not requested this email then please ignore it `;

    try {

        await sendEmail({
            email: user.email,
            subject: "password Recovery ",
            message,
        })

        res.status(200).json({
            success: true,
            message: `Email send to ${user.email} successfully..`
        })

    } catch (error) {
        user.resetpasswordtoken = undefined;
        user.resetpasswordexpire = undefined;
        await user.save({ validateBeforeSave: false })
        return next(error)
    }
}
//reset password
module.exports.resetPassword = async (req, res, next) => {

    try {
        //creating token hash 
        const resetpasswordtoken = crypto.createHash("sha256").update(req.params.token).digest("hex");
        const user = await userModle.findOne({
            resetpasswordtoken,
            resetpasswordexpire: { $gt: Date.now() }
        })
        if (!user) {
            const err = new Error("Reset password token in invaild or has been expired ")
            err.statusCode = 400;
            return next(err)
        }
        if (req.body.password !== req.body.confirmpassword) {
            const err = new Error("Password does not match")
            err.statusCode = 400;
            return next(err)
        }
        user.password = req.body.password
        user.resetpasswordtoken = undefined;
        user.resetpasswordexpire = undefined;
        await user.save()
        sendToken(user, 200, res)
    } catch (error) {
        next(error)
    }
}

//get user details

module.exports.getUserDetails = async (req, res, next) => {

    try {
        const user = await userModle.findById(req.user.id);

        res.status(200).json({
            success: true,
            user: { user },
        })



    } catch (error) {
        next(error)
    }

}


//password update
module.exports.updatepassword = async (req, res, next) => {
    try {
        const user = await userModle.findById(req.user.id).select("+password")
        const ispasswordMatch = await user.comparePassword(req.body.oldPassword);
        if (!ispasswordMatch) {
            const err = new Error("Old Password is incorrect");
            err.statusCode = 400
            next(err)
        }


        if (req.body.newPassword !== req.body.confirmPassword) {
            const err = new Error("Password does not match")
            err.statusCode = 400;
            return next(err)
        }
        user.password = req.body.newPassword

        await user.save()
        sendToken(user, 200, res)
    } catch (error) {
        next(error)

    }
}

// update Profile
module.exports.updateProfile = async (req, res, next) => {
    try {
        const newUserData = {
            name: req.body.name,
            email: req.body.email,
        };

        // console.log("Avatar data:", req.body.avatar); // Debugging log

        if (req.body.avatar && req.body.avatar.trim() !== "") {
            // Find the user first to get the existing avatar
            const user = await userModle.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            if (user.avatar && user.avatar.public_id) {
                // Delete the old avatar on Cloudinary if it exists
                await cloudinary.v2.uploader.destroy(user.avatar.public_id);
            }

            // Upload new avatar to Cloudinary
            const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
                folder: "avatars",
                width: 150,
                crop: "scale",
            });

            newUserData.avatar = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }

        // Update the user with new data
        const updatedUser = await userModle.findByIdAndUpdate(
            req.user.id,
            { $set: newUserData },
            { new: true, runValidators: true, useFindAndModify: false }
        );

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        next(error)
    }
};

//Get All User
module.exports.getAlluser = async (req, res, next) => {
    try {
        const totalUser = await userModle.countDocuments();
        const users = await userModle.find()
        res.status(200).json({
            success: true,
            totalUser,
            users
        })
    } catch (error) {
        next(error)
    }

}

//Get Single  User
module.exports.getSingleUser = async (req, res, next) => {
    try {
        const users = await userModle.findById(req.params.id)

        if (!users) {
            const err = new Error(`user does not exist with id :${req.body.id}`)
            return next(err)
        }
        res.status(200).json({
            success: true,
            users
        })
    } catch (error) {
        next(error)
    }

}


// update user  Profile ----Admin
module.exports.updateUserRole = async (req, res, next) => {
    const { name, email, role } = req.body;
    try {

        const id = await userModle.findById(req.params.id);
        console.log(id);

        if (!id) {
            const error = new Error(`User does not exist this Id: ${req.params.id}`);
            error.statusCode = 400;
            return next(error);
        };

        // Fetch the user document
        const user = await userModle.updateOne(id, { $set: { name, email, role } });

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};


// delete user  Profile ----Admin
module.exports.deleteUserForAdmin = async (req, res, next) => {
    try {
        // Fetch the user by ID
        const user = await userModle.findById(req.params.id);

        // Check if the user exists
        if (!user) {
            const error = new Error(`User does not exist this Id: ${req.params.id}`);
            error.statusCode = 400;
            return next(error);
        };

        // Delete the user
        const deleteUserResult = await userModle.deleteOne({ _id: req.params.id });

        res.status(200).json({
            success: true,
            message: "user Deleted Successfully..", data: deleteUserResult,
        });
    } catch (error) {
        next(error);
    }
};



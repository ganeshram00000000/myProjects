const productsmodel = require('../model/productsmodel');
const apifeature = require('../utils/apifeature');
const cloudinary = require('cloudinary')
// Create products ---admin 
// module.exports.createproducts = async (req, res, next) => {
//     try {
//         // Check for missing required fields
//         const { name, stock, category, price, description } = req.body;

//         if (!name || !stock || !category || !price || !description) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Please provide all required fields: name, stock, category, price, and description."
//             });
//         }
//         console.log(req.files);

//         let images = [];

//         if (typeof req.body.images === "string") {
//             images.push(req.body.images);
//         } else {
//             images = req.body.images;
//         }

//         const imagesLinks = [];

//         for (let i = 0; i < images?.length; i++) {
//             const result = await cloudinary.v2.upload_stream.upload(images[i], {
//                 folder: "products",
//             });


//             imagesLinks.push({
//                 public_id: result.public_id,
//                 url: result.secure_url,
//             });
//         }

//         req.body.images = imagesLinks;
//         req.body.user = req.user.id;

//         const product = new productsmodel(req.body);
//         await product.save();


//         res.status(201).json({
//             success: true,
//             product,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Server error while creating product",
//             error: error.message,
//         });
//     }
// }
module.exports.createproducts = async (req, res, next) => {
    try {
        // Check for missing required fields
        const { name, stock, category, price, description } = req.body;

        if (!name || !stock || !category || !price || !description) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields: name, stock, category, price, and description."
            });
        }
        // console.log(req.files);

        // Handling image(s) based on whether it's a single or multiple images
        let images = [];

        if (Array.isArray(req.files.images)) {
            images = req.files.images;  // If multiple images
        } else if (req.files.images) {
            images.push(req.files.images); // If a single image
        }

        const imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
            const image = images[i];

            // Check if image is a file path or buffer
            let uploadResult;
            if (image.tempFilePath) {
                // If using file path (standard file upload)
                uploadResult = await cloudinary.v2.uploader.upload(image.tempFilePath, {
                    folder: "products",
                });
            } else if (image.data) {
                // If using buffer (buffer-based file upload)
                uploadResult = await new Promise((resolve, reject) => {
                    cloudinary.v2.uploader.upload_stream({ folder: "products" }, (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }).end(image.data);  // Send the buffer as stream
                });
            }

            // Push the result to imagesLinks
            if (uploadResult) {
                imagesLinks.push({
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url,
                });
            }
        }

        req.body.images = imagesLinks;
        req.body.user = req.user.id;

        const product = new productsmodel(req.body);
        await product.save();

        res.status(201).json({
            success: true,
            product,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error while creating product", 
            error: error.message,
        });
    }
};

// Get all products for admin
module.exports.getAdminProducts = async (req, res, next) => {
    try {
        const products = await productsmodel.find()

        res.status(200).json({
            success: true,
            data: products,

        });
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};

// Get all products
module.exports.getallproducts = async (req, res, next) => {
    try {
        const resultparpage = 8;
        const productcount = await productsmodel.countDocuments();

        // Apply search and filter first
        const apifeatures = new apifeature(productsmodel.find(), req.query)
            .search()
            .filter();

        // Execute the filtered query without pagination to get the count
        const filteredProducts = await apifeatures.query;
        const filterproductscount = filteredProducts.length;

        // Reapply filters and add pagination for final query execution
        const paginatedFeatures = new apifeature(productsmodel.find(), req.query)
            .search()
            .filter()
            .pagination(resultparpage);

        // Execute the final query with pagination
        const products = await paginatedFeatures.query;

        if (products.length === 0) {
            const error = new Error("No products found.");
            error.statusCode = 404;
            return next(error);
        }

        res.status(200).json({
            success: true,
            productcount,
            data: products,
            resultparpage,
            filterproductscount
        });
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
};



// Update products ---admin
module.exports.updateproduct = async (req, res, next) => {
    const id = req.params._id; // Explicitly destructure 'id'
    const updateProducts = req.body; // The new data to update
    console.log(updateProducts);

    try {
        let images = [];

        // Handle multiple or single image upload
        if (Array.isArray(req.files?.images)) {
            images = req.files.images;
        } else if (req.files?.images) {
            images.push(req.files.images);
        }

        const uploadImage = async (image) => {
            if (image.tempFilePath) {
                return await cloudinary.v2.uploader.upload(image.tempFilePath, {
                    folder: "products",
                });
            } else if (image.data) {
                return new Promise((resolve, reject) => {
                    cloudinary.v2.uploader.upload_stream(
                        { folder: "products" },
                        (error, result) => {
                            if (error) return reject(error);
                            resolve(result);
                        }
                    ).end(image.data); // Send the buffer as stream
                });
            }
        };

        const imagesLinks = [];
        for (let image of images) {
            const uploadResult = await uploadImage(image);
            if (uploadResult) {
                imagesLinks.push({
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url,
                });
            }
        }

        // Fetch existing product to get the current images
        const existingProduct = await productsmodel.findById(id);

        if (!existingProduct) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        // Delete old images if new ones are uploaded
        if (imagesLinks.length > 0 && existingProduct.images.length > 0) {
            for (let image of existingProduct.images) {
                await cloudinary.v2.uploader.destroy(image.public_id); // Destroy old images
            }
        }

        // Update the images field with new ones if uploaded
        if (imagesLinks.length > 0) {
            updateProducts.images = imagesLinks; // Replace existing images
        } else {
            updateProducts.images = existingProduct.images; // Retain existing images if no new images are uploaded
        }

        const updatedProduct = await productsmodel.findByIdAndUpdate(
            id,
            { $set: updateProducts },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedProduct,
        });
    } catch (error) {
        console.log(error);
        next({
            statusCode: error.statusCode || 500,
            message: error.message || "An error occurred while updating the product.",
        });
    }
};



// Delete products ---admin
module.exports.deleteproduct = async (req, res, next) => {
    const id = req.params;  // Access the 'id' from req.params
    try {
        const deletedProduct = await productsmodel.findByIdAndDelete(id);
        if (!deletedProduct) {
            const error = new Error("Product not found.");
            error.statusCode = 404;
            return next(error);
        }

        for (let i = 0; i < deletedProduct?.images?.length; i++) {
            await cloudinary.v2.uploader.destroy(deletedProduct?.images[i]?.public_id)
        }
        res.status(200).json({
            success: true,
            message: "Product deleted successfully.",
            data: deletedProduct
        });
    } catch (error) {
        error.statusCode = 500; // Set status code for internal server error
        next(error);
    }
}

 
// Get single product
module.exports.singleproducts = async (req, res, next) => {
    const id = req.params;  // Access the 'id' from req.params
    try {
        const product = await productsmodel.findById(id);
        if (!product) {
            const error = new Error("Product not found.");
            error.statusCode = 404; // Set a custom status code for not found
            return next(error);
        }
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        error.statusCode = 500;
        next(error)
    }
}


//create reviews and update reviews
module.exports.createProductReviews = async (req, res, next) => {
    try {
        const { rating, comment, productId } = req.body;

        const review = {
            user: req.user._id,
            name: req.user.name || "Anonymous",
            rating: Number(rating),
            comment,
        };

        const product = await productsmodel.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const isReviewed = product.reviews.find((rev) => rev.user.toString() === req.user._id.toString());
        console.log(isReviewed);

        if (isReviewed) {
            product.reviews.forEach(rev => {
                if (rev.user.toString() === req.user._id.toString()) {
                    rev.rating = rating;
                    rev.comment = comment;
                }
            });
        } else {
            product.reviews.push(review);
            product.numOfReviews = product.reviews.length;
        }

        let avg = 0;
        product.reviews.forEach(rev => {
            avg += rev.rating;
        });
        product.ratings = avg / product.reviews.length;

        await product.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
        });
    } catch (error) {
        next(error)

    }
};

//Get all Reviews of products 

module.exports.getProductReviews = async (req, res, next) => {
    console.log("hello");

    try {
        const product = await productsmodel.findById(req.query.id);
        if (!product) {
            const error = new Error("Product Not Found");
            error.statusCode = 404;
            return next(error);
        };
        res.status(200).json({
            success: true,
            reviews: product.reviews,
        })
    } catch (error) {
        next(error);
    };
};
//delete reviews or products
module.exports.deleteProductReviews = async (req, res, next) => {
    try {
        // Find the product by ID
        const product = await productsmodel.findById(req.query.productId);

        // Check if the product exists
        if (!product) {
            const err = new Error('Product Not Found');
            err.statusCode = 404; // Use 404 for not found errors
            return next(err);
        }

        // Filter out the review to be deleted
        const filteredReviews = product.reviews.filter(rev => rev._id.toString() !== req.query.id.toString());

        // Check if filteredReviews are valid
        if (!Array.isArray(filteredReviews) || filteredReviews.some(rev => !rev.name)) {
            const err = new Error('Invalid review data after filtering');
            err.statusCode = 400; // Bad Request
            return next(err);
        }

        // Calculate the new average rating and number of reviews
        let avg = 0;
        let numOfReviews = filteredReviews.length;

        filteredReviews.forEach(rev => {
            avg += rev.rating; // Sum up ratings
        });

        // Prevent division by zero if there are no reviews left
        const ratings = numOfReviews > 0 ? avg / numOfReviews : 0;

        // Update the product with the new reviews, ratings, and number of reviews
        await productsmodel.findByIdAndUpdate(req.query.productId, {
            reviews: filteredReviews, // Update the reviews
            ratings,
            numOfReviews
        }, {
            new: true,
            runValidators: true
        });

        // Send a success response
        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        next(error); // Pass the error to the error handling middleware
    }
};

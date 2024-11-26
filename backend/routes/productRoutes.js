const express = require('express');
const {
    createproducts,
    getallproducts,
    updateproduct,
    deleteproduct,
    singleproducts,
    createProductReviews,
    getProductReviews,
    deleteProductReviews,
    getAdminProducts
} = require('../controllers/productsControllers');
const { isAuthenticatedUser, authouriseRoles } = require('../middleware/auth');

const router = express.Router();

// Routes for product operations
router.post('/admin',isAuthenticatedUser,authouriseRoles("admin"), createproducts);
router.get('/',  getallproducts);
router.get('/singleproduct/:_id', singleproducts);
router.put('/admin/:_id',isAuthenticatedUser,authouriseRoles("admin"), updateproduct);
router.delete('/admin/:_id',isAuthenticatedUser,authouriseRoles("admin"), deleteproduct);
 
router.put('/review',isAuthenticatedUser, createProductReviews);

router.get('/review/all', getProductReviews);

router.delete('/reviews', isAuthenticatedUser,deleteProductReviews);
router.get('/admin/product', isAuthenticatedUser,getAdminProducts);

module.exports = router;

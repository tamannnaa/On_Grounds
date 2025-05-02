const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { logRequests}=require('../middleware/userMiddleware');
const wishlistController = require('../controllers/wishlistController');

console.log('=== Initializing Wishlist Routes ===');
router.use(logRequests);
router.get('/test', wishlistController.testWishlist);
router.post('/toggle', isAuthenticated, wishlistController.toggleWishlistItem);
router.get('/items', isAuthenticated, wishlistController.getWishlistItems);
router.get('/status/:tutorId', isAuthenticated, wishlistController.checkWishlistStatus);
router.get('/', isAuthenticated, wishlistController.getWishlistPage);
router.post('/:tutorId', isAuthenticated, wishlistController.addToWishlist);
router.delete('/:tutorId', isAuthenticated, wishlistController.removeFromWishlist);
if (process.env.NODE_ENV === 'development') {
    console.log('\n=== Wishlist Routes Registered ===');
    router.stack.forEach(layer => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
            console.log(`${methods} ${layer.route.path}`);
        }
    });
    console.log('=== End Wishlist Routes ===\n');
}

module.exports = router;
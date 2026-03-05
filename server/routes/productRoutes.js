const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const productController = require('../controllers/productController');
const { optionalAuth, protect, authorize } = require('../middlewares/authMiddleware');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // store images in uploads folder
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Routes
router.post('/',    upload.single('image'), productController.createProduct);
router.get('/',     optionalAuth,           productController.getProducts);
router.put('/:id',  protect, authorize(['admin']), upload.single('image'), productController.updateProduct);
router.delete('/:id', protect, authorize(['admin']), productController.deleteProduct);

module.exports = router;
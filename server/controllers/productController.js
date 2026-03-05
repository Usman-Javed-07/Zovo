const productService  = require('../services/productService');
const favoriteService = require('../services/favoriteService');
const ratingService   = require('../services/ratingService');

exports.createProduct = async (req, res) => {
    try {
        const { name, description, material, price } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        const result = await productService.addProduct({ name, description, material, price, image });
        res.status(201).json({ success: true, message: 'Product added', productId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error adding product' });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const userId   = req.user ? req.user.id : null;
        let   products = await productService.getProducts();
        products = await favoriteService.enrichProductsWithFavorites(products, userId);
        products = await ratingService.enrichProductsWithUserRatings(products, userId);
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching products' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const id      = parseInt(req.params.id, 10);
        const product = await productService.getProductById(id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const data = {
            name:        req.body.name,
            description: req.body.description,
            material:    req.body.material,
            price:       req.body.price !== undefined ? parseFloat(req.body.price) : undefined
        };
        if (req.file) data.image = `/uploads/${req.file.filename}`;

        await productService.updateProduct(id, data);
        res.json({ success: true, message: 'Product updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error updating product' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const id      = parseInt(req.params.id, 10);
        const product = await productService.getProductById(id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        await productService.deleteProduct(id);
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error deleting product' });
    }
};
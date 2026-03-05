const productService  = require('../services/productService');
const favoriteService = require('../services/favoriteService');

exports.createProduct = async (req, res) => {
    try {
        const { name, description, material, price, rating, rating_count } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        const productData = {
            name,
            description,
            material,
            price,
            rating: parseFloat(rating) || 0,
            rating_count: parseInt(rating_count) || 0,
            image
        };

        const result = await productService.addProduct(productData);
        res.status(201).json({ message: 'Product added', productId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error adding product', error: err });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const products  = await productService.getProducts();
        const userId    = req.user ? req.user.id : null;
        const enriched  = await favoriteService.enrichProductsWithFavorites(products, userId);
        res.json(enriched);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching products', error: err });
    }
};
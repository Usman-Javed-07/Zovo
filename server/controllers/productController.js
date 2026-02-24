const productService = require('../services/productService');

exports.createProduct = async (req, res) => {
    try {
        const { name, description, material, price, rating, rating_count, is_favorite } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        const productData = {
            name,
            description,
            material,
            price,
            rating: parseFloat(rating) || 0,
            rating_count: parseInt(rating_count) || 0,
            image,
            is_favorite: is_favorite === 'true' ? 1 : 0
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
        const products = await productService.getProducts();
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching products', error: err });
    }
};
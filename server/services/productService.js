const Product = require('../models/productModel');

exports.addProduct = (data) => {
    return new Promise((resolve, reject) => {
        Product.create(data, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

exports.getProducts = () => {
    return new Promise((resolve, reject) => {
        Product.getAll((err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};
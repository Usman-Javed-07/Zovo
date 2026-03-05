const Product = require('../models/productModel');

exports.addProduct = (data) => Product.create(data);

exports.getProducts = () => Product.getAll();

exports.getProductById = (id) => Product.findById(id);

exports.updateProduct = (id, data) => Product.update(id, data);

exports.deleteProduct = (id) => Product.delete(id);
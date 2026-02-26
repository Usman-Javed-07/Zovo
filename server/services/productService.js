const Product = require('../models/productModel');

exports.addProduct = (data) => Product.create(data);

exports.getProducts = () => Product.getAll();
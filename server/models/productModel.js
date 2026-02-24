const db = require('../config/db');

const Product = {
    create: (data, callback) => {
        const sql = `
            INSERT INTO products
            (name, description, material, price, rating, rating_count, image, is_favorite)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.name,
            data.description,
            data.material,
            data.price,
            data.rating || 0,
            data.rating_count || 0,
            data.image,
            data.is_favorite || 0
        ];
        db.query(sql, values, callback);
    },

    getAll: (callback) => {
        db.query(`SELECT * FROM products ORDER BY created_at DESC`, callback);
    }
};

module.exports = Product;
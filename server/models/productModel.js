const db = require('../config/db');

const Product = {
    create: async (data) => {
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
        const [result] = await db.execute(sql, values);
        return result;
    },

    getAll: async () => {
        const [rows] = await db.execute(`SELECT * FROM products ORDER BY created_at DESC`);
        return rows;
    }
};

module.exports = Product;
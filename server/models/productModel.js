const db = require('../config/db');

const Product = {
    create: async (data) => {
        const sql = `
            INSERT INTO products (name, description, material, price, image)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(sql, [
            data.name, data.description, data.material, data.price, data.image
        ]);
        return result;
    },

    getAll: async () => {
        const [rows] = await db.execute(`
            SELECT p.id, p.name, p.description, p.material, p.price, p.image, p.created_at,
                   ROUND(COALESCE(AVG(r.rating), 0), 1) AS avg_rating,
                   COUNT(r.id)                           AS rating_count
            FROM   products p
            LEFT   JOIN product_ratings r ON r.product_id = p.id
            GROUP  BY p.id
            ORDER  BY p.created_at DESC
        `);
        return rows;
    }
};

module.exports = Product;
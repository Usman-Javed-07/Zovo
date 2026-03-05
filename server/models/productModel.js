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
    },

    findById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);
        return rows[0] || null;
    },

    update: async (id, data) => {
        const fields = [];
        const values = [];
        if (data.name        !== undefined) { fields.push('name = ?');        values.push(data.name); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
        if (data.material    !== undefined) { fields.push('material = ?');    values.push(data.material); }
        if (data.price       !== undefined) { fields.push('price = ?');       values.push(data.price); }
        if (data.image       !== undefined) { fields.push('image = ?');       values.push(data.image); }
        if (!fields.length) return;
        values.push(id);
        await db.execute(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    },

    delete: async (id) => {
        await db.execute('DELETE FROM products WHERE id = ?', [id]);
    }
};

module.exports = Product;
const db = require('../config/db');

class WalletModel {

    static async findByUser(userId) {
        const [rows] = await db.execute(
            `SELECT * FROM wallets WHERE user_id = ?`,
            [userId]
        );
        return rows[0];
    }

    static async createWallet(userId) {
        const [result] = await db.execute(
            `INSERT INTO wallets (user_id, balance) VALUES (?, 0)`,
            [userId]
        );
        return result.insertId;
    }

    static async getOrCreate(userId) {
        let wallet = await this.findByUser(userId);
        if (!wallet) {
            const id = await this.createWallet(userId);
            wallet = { id, user_id: userId, balance: 0 };
        }
        return wallet;
    }

    static async credit(userId, amount) {
        await db.execute(
            `UPDATE wallets SET balance = balance + ? WHERE user_id = ?`,
            [amount, userId]
        );
    }

    static async debit(userId, amount) {
        await db.execute(
            `UPDATE wallets SET balance = balance - ? WHERE user_id = ?`,
            [amount, userId]
        );
    }

    static async addTransaction(data) {
        const { wallet_id, user_id, amount, type, description, reference_id, reference_type } = data;
        await db.execute(
            `INSERT INTO wallet_transactions
             (wallet_id, user_id, amount, type, description, reference_id, reference_type)
             VALUES (?,?,?,?,?,?,?)`,
            [wallet_id, user_id, amount, type, description || null,
             reference_id || null, reference_type || 'manual']
        );
    }

    static async getTransactions(userId) {
        const [rows] = await db.execute(
            `SELECT wt.* FROM wallet_transactions wt
             WHERE wt.user_id = ?
             ORDER BY wt.created_at DESC`,
            [userId]
        );
        return rows;
    }
}

module.exports = WalletModel;

const WalletModel = require('../models/walletModel');

class WalletService {

    static async getBalance(userId) {
        const wallet = await WalletModel.getOrCreate(userId);
        return wallet;
    }

    static async getHistory(userId) {
        await WalletModel.getOrCreate(userId);
        return WalletModel.getTransactions(userId);
    }

    static async credit(userId, amount, description, reference_id, reference_type) {
        const wallet = await WalletModel.getOrCreate(userId);
        await WalletModel.credit(userId, amount);
        await WalletModel.addTransaction({
            wallet_id:      wallet.id,
            user_id:        userId,
            amount,
            type:           'credit',
            description:    description || 'Credit',
            reference_id,
            reference_type: reference_type || 'manual'
        });
    }
}

module.exports = WalletService;

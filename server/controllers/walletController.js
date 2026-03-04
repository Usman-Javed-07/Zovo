const WalletService = require('../services/walletService');

class WalletController {

    static async getBalance(req, res) {
        try {
            const wallet = await WalletService.getBalance(req.user.id);
            res.json(wallet);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getHistory(req, res) {
        try {
            const transactions = await WalletService.getHistory(req.user.id);
            res.json(transactions);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = WalletController;

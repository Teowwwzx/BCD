const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/wallets/user/:userId - Get wallet for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const wallet = await prisma.user_wallets.findUnique({
            where: { user_id: userId }
        });
        if (!wallet) {
            return res.status(404).json({ success: false, error: 'Wallet not found for this user.'});
        }
        res.json({ success: true, data: wallet });
    } catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/wallets - Link a new wallet to a user
router.post('/', async (req, res) => {
    try {
        const { user_id, wallet_addr } = req.body;
        if (!user_id || !wallet_addr) {
            return res.status(400).json({ success: false, error: 'user_id and wallet_addr are required' });
        }
        const newWallet = await prisma.user_wallets.create({
            data: {
                user_id: parseInt(user_id),
                wallet_addr: wallet_addr
            }
        });
        res.status(201).json({ success: true, data: newWallet });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ success: false, error: 'This user or wallet address is already linked.'});
        }
        console.error('Error creating wallet link:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
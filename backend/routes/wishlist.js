const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/wishlist/:userId - Get a user's wishlist
router.get('/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const wishlistItems = await prisma.wishlist.findMany({
            where: { user_id: userId },
            include: { products: true }
        });
        res.json({ success: true, data: wishlistItems });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/wishlist/add - Add an item to the wishlist
router.post('/add', async (req, res) => {
    try {
        const { user_id, product_id } = req.body;
        if (!user_id || !product_id) {
            return res.status(400).json({ success: false, error: 'user_id and product_id are required' });
        }
        const wishlistItem = await prisma.wishlist.create({
            data: {
                user_id: parseInt(user_id),
                product_id: parseInt(product_id)
            }
        });
        res.status(201).json({ success: true, data: wishlistItem });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ success: false, error: 'This item is already in the wishlist.' });
        }
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// DELETE /api/wishlist/remove - Remove an item from the wishlist
router.delete('/remove', async (req, res) => {
    try {
        const { user_id, product_id } = req.body;
        if (!user_id || !product_id) {
            return res.status(400).json({ success: false, error: 'user_id and product_id are required' });
        }
        await prisma.wishlist.delete({
            where: { 
                unique_user_product_wishlist: {
                    user_id: parseInt(user_id),
                    product_id: parseInt(product_id)
                }
            }
        });
        res.json({ success: true, message: 'Item removed from wishlist.' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, error: 'Item not found in wishlist.' });
        }
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
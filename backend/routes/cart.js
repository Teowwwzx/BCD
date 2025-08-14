// backend/routes/cart.js
/**
 * =================================================================
 * API DOCUMENTATION: /api/cart
 * =================================================================
 *
 * METHOD   | URL               | DESCRIPTION
 * ---------|-------------------|----------------------------------
 * POST     | /add              | Add a product to a user's cart.
 * GET      | /:userId          | Get all items in a user's cart.
 * PUT      | /update           | Update the quantity of a product in the cart.
 * DELETE   | /remove           | Remove a single product from the cart.
 * DELETE   | /clear/:userId    | Remove all items from a user's cart.
 * GET      | /count/:userId    | Get the total number of items in the cart.
 *
 * =================================================================
 *
 * REQUEST/RESPONSE FORMATS
 *
 * --- POST /add ---
 * Request Body:
 * {
 * "userId": 1,
 * "productId": 1,
 * "quantity": 2
 * }
 *
 * --- PUT /update ---
 * Request Body:
 * {
 * "userId": 1,
 * "productId": 1,
 * "quantity": 3
 * }
 *
 * --- DELETE /remove ---
 * Request Body:
 * {
 * "userId": 1,
 * "productId": 1
 * }
 *
 */
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// ----------------------------------------------------------------
// 1. CREATE (POST /add)
// ----------------------------------------------------------------
router.post('/add', async (req, res) => {
    const { userId, productId, quantity } = req.body;
    const userIdInt = parseInt(userId, 10);
    const productIdInt = parseInt(productId, 10);
    const quantityInt = parseInt(quantity, 10);

    if (!userIdInt || !productIdInt || !quantityInt || quantityInt <= 0) {
        return res.status(400).json({ success: false, error: 'Valid userId, productId, and a positive quantity are required.' });
    }

    try {
        const product = await prisma.product.findUnique({ where: { id: productIdInt } });
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found.' });
        }

        const existingCartItem = await prisma.cartItem.findUnique({
            where: { userId_productId: { userId: userIdInt, productId: productIdInt } },
        });

        let cartItem;
        if (existingCartItem) {
            const newQuantity = existingCartItem.quantity + quantityInt;
            if (product.quantity < newQuantity) {
                return res.status(400).json({ success: false, error: 'Insufficient product stock.' });
            }
            cartItem = await prisma.cartItem.update({
                where: { id: existingCartItem.id },
                data: { quantity: newQuantity },
            });
        } else {
            if (product.quantity < quantityInt) {
                return res.status(400).json({ success: false, error: 'Insufficient product stock.' });
            }
            cartItem = await prisma.cartItem.create({
                data: { userId: userIdInt, productId: productIdInt, quantity: quantityInt },
            });
        }

        res.status(201).json({ success: true, data: cartItem });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// 2. READ (GET /:userId)
// ----------------------------------------------------------------
router.get('/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
        return res.status(400).json({ success: false, error: 'Invalid user ID.' });
    }

    try {
        const cartItems = await prisma.cartItem.findMany({
            where: { userId: userId },
            include: {
                product: {
                    include: {
                        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                        seller: { select: { id: true, username: true } },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cartItems.reduce((sum, item) => {
            return sum + Number(item.product.price) * item.quantity;
        }, 0);

        res.json({
            success: true,
            data: {
                items: cartItems,
                summary: {
                    totalItems,
                    totalPrice: totalPrice.toFixed(8)
                }
            },
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// 3. UPDATE (PUT /update)
// ----------------------------------------------------------------
router.put('/update', async (req, res) => {
    const { userId, productId, quantity } = req.body;
    const userIdInt = parseInt(userId, 10);
    const productIdInt = parseInt(productId, 10);
    const quantityInt = parseInt(quantity, 10);

    if (!userIdInt || !productIdInt || isNaN(quantityInt) || quantityInt < 0) {
        return res.status(400).json({ success: false, error: 'Valid userId, productId, and a non-negative quantity are required.' });
    }

    try {
        const cartItem = await prisma.cartItem.findUnique({
            where: { userId_productId: { userId: userIdInt, productId: productIdInt } },
        });

        if (!cartItem) {
            return res.status(404).json({ success: false, error: 'Cart item not found.' });
        }

        if (quantityInt === 0) {
            await prisma.cartItem.delete({ where: { id: cartItem.id } });
            return res.json({ success: true, data: { message: 'Item removed from cart.' } });
        }
        
        const product = await prisma.product.findUnique({ where: { id: productIdInt } });
        if (!product || product.quantity < quantityInt) {
            return res.status(400).json({ success: false, error: 'Insufficient product stock.' });
        }

        const updatedItem = await prisma.cartItem.update({
            where: { id: cartItem.id },
            data: { quantity: quantityInt },
        });

        res.json({ success: true, data: updatedItem });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// 4. DELETE (Individual and full cart)
// ----------------------------------------------------------------
router.delete('/remove', async (req, res) => {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
        return res.status(400).json({ success: false, error: 'userId and productId are required.' });
    }

    try {
        const result = await prisma.cartItem.deleteMany({
            where: { userId: parseInt(userId), productId: parseInt(productId) },
        });

        if (result.count === 0) {
            return res.status(404).json({ success: false, error: 'Cart item not found.' });
        }

        res.json({ success: true, data: { message: 'Item removed from cart.' } });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

router.delete('/clear/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
        return res.status(400).json({ success: false, error: 'Invalid user ID.' });
    }

    try {
        await prisma.cartItem.deleteMany({ where: { userId: userId } });
        res.json({ success: true, data: { message: 'Cart cleared successfully.' } });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// X. UTILITY ROUTES
// ----------------------------------------------------------------
router.get('/count/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
        return res.status(400).json({ success: false, error: 'Invalid user ID.' });
    }

    try {
        const result = await prisma.cartItem.aggregate({
            where: { userId: userId },
            _sum: { quantity: true },
        });

        res.json({ success: true, data: { count: result._sum.quantity || 0 } });
    } catch (error) {
        console.error('Error fetching cart count:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

module.exports = router;
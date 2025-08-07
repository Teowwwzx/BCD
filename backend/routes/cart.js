const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Middleware to handle database connection errors
router.use(async (req, res, next) => {
  try {
    await prisma.$connect();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ success: false, error: 'Database connection error' });
  }
});

// GET /api/cart/:userId - Get user's cart items
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const userIdInt = parseInt(userId, 10);

  if (isNaN(userIdInt) || userIdInt <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
  }

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: userIdInt },
      include: {
        product: {
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1
            },
            seller: {
              select: { id: true, username: true },
            }
          }
        }
      }
    });

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.product.price || 0);
      return sum + price * item.quantity;
    }, 0);

    res.json({
      success: true,
      data: {
        items: cartItems,
        totalItems,
        totalPrice: totalPrice.toFixed(8)
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cart items' });
  }
});

// POST /api/cart/add - Add an item to the cart
router.post('/add', async (req, res) => {
  const { userId, productId, quantity } = req.body;
  const userIdInt = parseInt(userId, 10);
  const productIdInt = parseInt(productId, 10);
  const quantityInt = parseInt(quantity, 10);

  if (!userIdInt || !productIdInt || !quantityInt || quantityInt <= 0) {
    return res.status(400).json({ success: false, error: 'Valid User ID, Product ID, and a positive quantity are required' });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productIdInt } });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const existingCartItem = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: userIdInt, productId: productIdInt } },
    });

    let updatedOrNewCartItem;
    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantityInt;
      if (product.quantity < newQuantity) {
        return res.status(400).json({ success: false, error: 'Insufficient product stock' });
      }
      updatedOrNewCartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
        include: { product: true }
      });
    } else {
      if (product.quantity < quantityInt) {
        return res.status(400).json({ success: false, error: 'Insufficient product stock' });
      }
      updatedOrNewCartItem = await prisma.cartItem.create({
        data: {
          userId: userIdInt,
          productId: productIdInt,
          quantity: quantityInt
        },
        include: { product: true }
      });
    }

    const cartCountResult = await prisma.cartItem.aggregate({
      where: { userId: userIdInt },
      _sum: { quantity: true }
    });

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        cartItem: updatedOrNewCartItem,
        cartCount: cartCountResult._sum.quantity || 0
      },
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, error: 'Failed to add item to cart' });
  }
});

// PUT /api/cart/update - Update item quantity in the cart
router.put('/update', async (req, res) => {
  const { userId, productId, quantity } = req.body;
  const userIdInt = parseInt(userId, 10);
  const productIdInt = parseInt(productId, 10);
  const quantityInt = parseInt(quantity, 10);

  if (!userIdInt || !productIdInt || isNaN(quantityInt) || quantityInt < 0) {
    return res.status(400).json({ success: false, error: 'Valid User ID, Product ID, and a non-negative quantity are required' });
  }

  try {
    const existingCartItem = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: userIdInt, productId: productIdInt } },
    });

    if (!existingCartItem) {
      return res.status(404).json({ success: false, error: 'Cart item not found' });
    }

    if (quantityInt === 0) {
      // If quantity is 0, remove the item
      await prisma.cartItem.delete({ where: { id: existingCartItem.id } });
    } else {
      const product = await prisma.product.findUnique({ where: { id: productIdInt } });
      if (!product || product.quantity < quantityInt) {
        return res.status(400).json({ success: false, error: 'Insufficient product stock' });
      }
      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: quantityInt }
      });
    }

    const cartCountResult = await prisma.cartItem.aggregate({
      where: { userId: userIdInt },
      _sum: { quantity: true }
    });

    res.json({
      success: true,
      message: 'Cart updated successfully',
      data: { cartCount: cartCountResult._sum.quantity || 0 }
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ success: false, error: 'Failed to update cart item' });
  }
});

// DELETE /api/cart/remove - Remove an item from the cart
router.delete('/remove', async (req, res) => {
  const { userId, productId } = req.body;
  const userIdInt = parseInt(userId, 10);
  const productIdInt = parseInt(productId, 10);

  if (!userIdInt || !productIdInt) {
    return res.status(400).json({ success: false, error: 'User ID and Product ID are required' });
  }

  try {
    const result = await prisma.cartItem.deleteMany({
      where: { userId: userIdInt, productId: productIdInt },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, error: 'Cart item not found' });
    }

    const cartCountResult = await prisma.cartItem.aggregate({
      where: { userId: userIdInt },
      _sum: { quantity: true }
    });

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: { cartCount: cartCountResult._sum.quantity || 0 }
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, error: 'Failed to remove item from cart' });
  }
});

// DELETE /api/cart/clear/:userId - Clear the entire cart for a user
router.delete('/clear/:userId', async (req, res) => {
  const { userId } = req.params;
  const userIdInt = parseInt(userId, 10);

  if (isNaN(userIdInt) || userIdInt <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
  }

  try {
    await prisma.cartItem.deleteMany({ where: { userId: userIdInt } });
    res.json({ success: true, message: 'Cart cleared successfully', data: { cartCount: 0 } });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, error: 'Failed to clear cart' });
  }
});

// GET /api/cart/count/:userId - Get the total number of items in the cart
router.get('/count/:userId', async (req, res) => {
  const { userId } = req.params;
  const userIdInt = parseInt(userId, 10);

  if (isNaN(userIdInt) || userIdInt <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
  }

  try {
    const cartCountResult = await prisma.cartItem.aggregate({
      where: { userId: userIdInt },
      _sum: { quantity: true }
    });

    res.json({ success: true, data: { cartCount: cartCountResult._sum.quantity || 0 } });
  } catch (error) {
    console.error('Error fetching cart count:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cart count' });
  }
});

module.exports = router;
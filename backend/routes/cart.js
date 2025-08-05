const express = require('express');
const { PrismaClient } = require('@prisma/client');
const mockDb = require('../services/mockDatabase');
const router = express.Router();

// Initialize Prisma with error handling
let prisma;
let useMockDb = false;

try {
  prisma = new PrismaClient();
} catch (error) {
  console.warn('Prisma initialization failed, using mock database:', error.message);
  useMockDb = true;
}

// Get user's cart items
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let cartItems;

    if (useMockDb) {
      // Use mock database
      cartItems = await mockDb.getCartItems(parseInt(userId));
    } else {
      // Use Prisma
      try {
        cartItems = await prisma.cartItem.findMany({
          where: {
            userId: parseInt(userId)
          },
          include: {
            product: {
              include: {
                images: {
                  where: {
                    isPrimary: true
                  },
                  take: 1
                },
                seller: {
                  select: {
                    id: true,
                    username: true
                  }
                }
              }
            }
          }
        });
      } catch (dbError) {
        console.warn('Database connection failed, falling back to mock database');
        cartItems = await mockDb.getCartItems(parseInt(userId));
        useMockDb = true;
      }
    }

    // Calculate total items and total price
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.product.priceEth || item.product.price || 0) * item.quantity);
    }, 0);

    res.json({
      success: true,
      data: {
        items: cartItems,
        totalItems,
        totalPrice: totalPrice.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart items'
    });
  }
});

// Add item to cart
router.post('/add', async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Product ID are required'
      });
    }

    let cartItem, cartCount;

    if (useMockDb) {
      // Use mock database
      try {
        cartItem = await mockDb.addToCart(parseInt(userId), parseInt(productId), parseInt(quantity));
        cartCount = await mockDb.getCartCount(parseInt(userId));
      } catch (mockError) {
        return res.status(400).json({
          success: false,
          error: mockError.message
        });
      }
    } else {
      // Use Prisma
      try {
        // Check if product exists and has sufficient quantity
        const product = await prisma.product.findUnique({
          where: { id: parseInt(productId) }
        });

        if (!product) {
          return res.status(404).json({
            success: false,
            error: 'Product not found'
          });
        }

        if (product.quantity < quantity) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient product quantity'
          });
        }

        // Check if item already exists in cart
        const existingCartItem = await prisma.cartItem.findUnique({
          where: {
            userId_productId: {
              userId: parseInt(userId),
              productId: parseInt(productId)
            }
          }
        });

        if (existingCartItem) {
          // Update existing cart item
          const newQuantity = existingCartItem.quantity + parseInt(quantity);
          
          if (product.quantity < newQuantity) {
            return res.status(400).json({
              success: false,
              error: 'Insufficient product quantity for requested amount'
            });
          }

          cartItem = await prisma.cartItem.update({
            where: {
              userId_productId: {
                userId: parseInt(userId),
                productId: parseInt(productId)
              }
            },
            data: {
              quantity: newQuantity
            },
            include: {
              product: true
            }
          });
        } else {
          // Create new cart item
          cartItem = await prisma.cartItem.create({
            data: {
              userId: parseInt(userId),
              productId: parseInt(productId),
              quantity: parseInt(quantity)
            },
            include: {
              product: true
            }
          });
        }

        // Get updated cart count
        const cartCountResult = await prisma.cartItem.aggregate({
          where: {
            userId: parseInt(userId)
          },
          _sum: {
            quantity: true
          }
        });
        cartCount = cartCountResult._sum.quantity || 0;
      } catch (dbError) {
        console.warn('Database connection failed, falling back to mock database');
        useMockDb = true;
        try {
          cartItem = await mockDb.addToCart(parseInt(userId), parseInt(productId), parseInt(quantity));
          cartCount = await mockDb.getCartCount(parseInt(userId));
        } catch (mockError) {
          return res.status(400).json({
            success: false,
            error: mockError.message
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        cartItem,
        cartCount
      },
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart'
    });
  }
});

// Update cart item quantity
router.put('/update', async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'User ID, Product ID, and quantity are required'
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await prisma.cartItem.delete({
        where: {
          userId_productId: {
            userId: parseInt(userId),
            productId: parseInt(productId)
          }
        }
      });

      // Get updated cart count
      const cartCount = await prisma.cartItem.aggregate({
        where: {
          userId: parseInt(userId)
        },
        _sum: {
          quantity: true
        }
      });

      return res.json({
        success: true,
        data: {
          cartCount: cartCount._sum.quantity || 0
        },
        message: 'Item removed from cart'
      });
    }

    // Check product availability
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient product quantity'
      });
    }

    // Update cart item
    const cartItem = await prisma.cartItem.update({
      where: {
        userId_productId: {
          userId: parseInt(userId),
          productId: parseInt(productId)
        }
      },
      data: {
        quantity: parseInt(quantity)
      },
      include: {
        product: true
      }
    });

    // Get updated cart count
    const cartCount = await prisma.cartItem.aggregate({
      where: {
        userId: parseInt(userId)
      },
      _sum: {
        quantity: true
      }
    });

    res.json({
      success: true,
      data: {
        cartItem,
        cartCount: cartCount._sum.quantity || 0
      },
      message: 'Cart updated successfully'
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cart item'
    });
  }
});

// Remove item from cart
router.delete('/remove', async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Product ID are required'
      });
    }

    await prisma.cartItem.delete({
      where: {
        userId_productId: {
          userId: parseInt(userId),
          productId: parseInt(productId)
        }
      }
    });

    // Get updated cart count
    const cartCount = await prisma.cartItem.aggregate({
      where: {
        userId: parseInt(userId)
      },
      _sum: {
        quantity: true
      }
    });

    res.json({
      success: true,
      data: {
        cartCount: cartCount._sum.quantity || 0
      },
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart'
    });
  }
});

// Clear entire cart
router.delete('/clear/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.cartItem.deleteMany({
      where: {
        userId: parseInt(userId)
      }
    });

    res.json({
      success: true,
      data: {
        cartCount: 0
      },
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart'
    });
  }
});

// Get cart count for a user
router.get('/count/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let cartCount;

    if (useMockDb) {
      // Use mock database
      cartCount = await mockDb.getCartCount(parseInt(userId));
    } else {
      // Use Prisma
      try {
        const cartCountResult = await prisma.cartItem.aggregate({
          where: {
            userId: parseInt(userId)
          },
          _sum: {
            quantity: true
          }
        });
        cartCount = cartCountResult._sum.quantity || 0;
      } catch (dbError) {
        console.warn('Database connection failed, falling back to mock database');
        useMockDb = true;
        cartCount = await mockDb.getCartCount(parseInt(userId));
      }
    }

    res.json({
      success: true,
      data: {
        cartCount
      }
    });
  } catch (error) {
    console.error('Error fetching cart count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart count'
    });
  }
});

module.exports = router;
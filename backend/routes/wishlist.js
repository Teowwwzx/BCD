/**
 * =================================================================
 * API DOCUMENTATION: /api/wishlist
 * =================================================================
 *
 * METHOD   | URL               | DESCRIPTION
 * ---------|-------------------|----------------------------------
 * POST     | /                 | Add an item to the wishlist.
 * GET      | /                 | Get all wishlist items (with filtering).
 * GET      | /:id              | Get a single wishlist item by its ID.
 * PUT      | /:id              | Update an existing wishlist item.
 * DELETE   | /:id              | Delete a wishlist item.
 *
 * =================================================================
 *
 * REQUEST/RESPONSE FORMATS
 *
 * --- POST / ---
 * Request Body:
 * {
 *   "userId": 123,
 *   "productId": 456
 * }
 *
 * --- GET / Query Parameters ---
 * ?userId=123&productId=456&limit=10&offset=0
 *
 * --- PUT /:id ---
 * Request Body:
 * {
 *   "productId": 789
 * }
 *
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// ----------------------------------------------------------------
// CREATE - Add an item to the wishlist
// ----------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Validate required fields
    if (!userId || !productId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: userId, productId' 
      });
    }

    // Validate field formats
    const userIdInt = parseInt(userId);
    const productIdInt = parseInt(productId);
    if (isNaN(userIdInt) || isNaN(productIdInt)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid field format.' 
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userIdInt }
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productIdInt }
    });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    // Check if item is already in wishlist
    const existingItem = await prisma.wishlist.findFirst({
      where: {
        user_id: userIdInt,
        product_id: productIdInt
      }
    });
    if (existingItem) {
      return res.status(409).json({ 
        success: false, 
        error: 'This item is already in the wishlist.' 
      });
    }

    // Create wishlist item
    const wishlistItem = await prisma.wishlist.create({
      data: {
        user_id: userIdInt,
        product_id: productIdInt
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            status: true,
            images: {
              select: {
                imageUrl: true,
                altText: true
              },
              take: 1
            }
          }
        },
        users: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    res.status(201).json({ success: true, data: wishlistItem });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        success: false, 
        error: 'This item is already in the wishlist.' 
      });
    }
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ----------------------------------------------------------------
// READ ALL - Get all wishlist items with filtering and pagination
// ----------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { userId, productId, limit = 10, offset = 0 } = req.query;

    // Build where clause for filtering
    const where = {};
    if (userId) {
      const userIdInt = parseInt(userId);
      if (isNaN(userIdInt)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid userId format.' 
        });
      }
      where.user_id = userIdInt;
    }
    if (productId) {
      const productIdInt = parseInt(productId);
      if (isNaN(productIdInt)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid productId format.' 
        });
      }
      where.product_id = productIdInt;
    }

    // Validate pagination parameters
    const limitInt = parseInt(limit);
    const offsetInt = parseInt(offset);
    if (isNaN(limitInt) || isNaN(offsetInt) || limitInt < 1 || offsetInt < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid pagination parameters.' 
      });
    }

    // Fetch wishlist items with related data
    const wishlistItems = await prisma.wishlist.findMany({
      where,
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            status: true,
            description: true,
            images: {
              select: {
                imageUrl: true,
                altText: true
              },
              take: 1
            }
          }
        },
        users: {
          select: {
            id: true,
            username: true,
            profileImageUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limitInt,
      skip: offsetInt
    });

    // Get total count for pagination
    const total = await prisma.wishlist.count({ where });

    res.status(200).json({
      success: true,
      data: {
        wishlistItems,
        pagination: {
          total,
          limit: limitInt,
          offset: offsetInt,
          hasMore: offsetInt + limitInt < total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ----------------------------------------------------------------
// READ BY ID - Get a single wishlist item by its ID
// ----------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const wishlistId = parseInt(id);

    // Validate wishlist ID
    if (isNaN(wishlistId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid wishlist ID format.' 
      });
    }

    // Fetch wishlist item with related data
    const wishlistItem = await prisma.wishlist.findUnique({
      where: { id: wishlistId },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            status: true,
            description: true,
            category: true,
            images: {
              select: {
                imageUrl: true,
                altText: true
              },
              take: 1
            }
          }
        },
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            profileImageUrl: true
          }
        }
      }
    });

    if (!wishlistItem) {
      return res.status(404).json({ 
        success: false, 
        error: 'Wishlist item not found.' 
      });
    }

    res.status(200).json({ success: true, data: wishlistItem });
  } catch (error) {
    console.error('Error fetching wishlist item:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ----------------------------------------------------------------
// UPDATE - Update an existing wishlist item
// ----------------------------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;
    const wishlistId = parseInt(id);

    // Validate wishlist ID
    if (isNaN(wishlistId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid wishlist ID format.' 
      });
    }

    // Check if wishlist item exists
    const existingItem = await prisma.wishlist.findUnique({
      where: { id: wishlistId }
    });
    if (!existingItem) {
      return res.status(404).json({ 
        success: false, 
        error: 'Wishlist item not found.' 
      });
    }

    // Build update data object
    const updateData = {
      updatedAt: new Date()
    };

    // Validate and add productId if provided
    if (productId !== undefined) {
      const productIdInt = parseInt(productId);
      if (isNaN(productIdInt)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid product ID format.' 
        });
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productIdInt }
      });
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          error: 'Product not found.' 
        });
      }

      updateData.product_id = productIdInt;
    }

    // Update the wishlist item
    const updatedItem = await prisma.wishlist.update({
      where: { id: wishlistId },
      data: updateData,
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            status: true,
            images: {
              select: {
                imageUrl: true,
                altText: true
              },
              take: 1
            }
          }
        },
        users: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: 'Wishlist item not found.' 
      });
    }
    console.error('Error updating wishlist item:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ----------------------------------------------------------------
// DELETE - Delete a wishlist item
// ----------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const wishlistId = parseInt(id);

    // Validate wishlist ID
    if (isNaN(wishlistId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid wishlist ID format.' 
      });
    }

    // Check if wishlist item exists
    const existingItem = await prisma.wishlist.findUnique({
      where: { id: wishlistId }
    });
    if (!existingItem) {
      return res.status(404).json({ 
        success: false, 
        error: 'Wishlist item not found.' 
      });
    }

    // Delete the wishlist item
    await prisma.wishlist.delete({
      where: { id: wishlistId }
    });

    res.status(200).json({ 
      success: true, 
      message: 'Item removed from wishlist successfully.' 
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: 'Wishlist item not found.' 
      });
    }
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
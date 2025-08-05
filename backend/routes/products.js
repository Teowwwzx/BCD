const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Create a new product listing
router.post('/', async (req, res) => {
  try {
    const {
      sellerId,
      onChainListingId,
      name,
      description,
      category,
      price,
      quantity,
      location,
      imageUrl
    } = req.body;

    // Validate required fields
    if (!sellerId || !name || !price || !quantity) {
      return res.status(400).json({
        error: 'Seller ID, name, price, and quantity are required'
      });
    }

    // Validate seller exists
    const seller = await prisma.user.findUnique({
      where: { id: parseInt(sellerId) }
    });

    if (!seller) {
      return res.status(404).json({
        error: 'Seller not found'
      });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        sellerId: parseInt(sellerId),
        onChainListingId: onChainListingId ? parseInt(onChainListingId) : null,
        name,
        description,
        category,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        location,
        imageUrl
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            userRole: true,
            reputationScore: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      location,
      search,
      sellerId,
      status = 'Available'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      status: status || 'Available'
    };

    if (category) {
      where.category = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    if (sellerId) {
      where.sellerId = parseInt(sellerId);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              userRole: true,
              reputationScore: true
            }
          },
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get product categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await prisma.product.findMany({
      select: {
        category: true
      },
      where: {
        category: {
          not: null
        }
      },
      distinct: ['category']
    });

    const categoryList = categories
      .map(p => p.category)
      .filter(Boolean)
      .sort();

    res.json({ categories: categoryList });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID'
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            userRole: true,
            reputationScore: true,
            profileImageUrl: true
          }
        },
        orders: {
          select: {
            id: true,
            buyerId: true,
            quantityPurchased: true,
            status: true,
            createdAt: true,
            buyer: {
              select: {
                username: true,
                walletAddress: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        attachments: true
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID'
      });
    }

    const {
      name,
      description,
      category,
      price,
      quantity,
      location,
      imageUrl,
      status
    } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(category && { category }),
        ...(price && { price: parseFloat(price) }),
        ...(quantity && { quantity: parseInt(quantity) }),
        ...(location && { location }),
        ...(imageUrl && { imageUrl }),
        ...(status && { status })
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            userRole: true,
            reputationScore: true
          }
        }
      }
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID'
      });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        orders: true
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Check if product has active orders
    const activeOrders = existingProduct.orders.filter(
      order => !['Completed', 'Cancelled'].includes(order.status)
    );

    if (activeOrders.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete product with active orders'
      });
    }

    // Delete product
    await prisma.product.delete({
      where: { id: productId }
    });

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
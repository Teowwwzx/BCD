const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();


router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      sortBy = 'createdAt-desc', // Default sort
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // 1. Build a dynamic 'where' clause for filtering
    const where = {
      status: 'published', // Only show published products
    };
    if (category && category !== 'all') {
      where.category = { name: { equals: category, mode: 'insensitive' } };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { seller: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // 2. Build a dynamic 'orderBy' clause for sorting
    let orderBy = {};
    const [sortField, sortOrder] = sortBy.split('-');
    if (sortField === 'price') {
      orderBy = { price: sortOrder };
    } else if (sortField === 'name') {
      orderBy = { name: 'asc' }; // A-Z sorting
    } else {
      orderBy = { createdAt: 'desc' }; // Default: Newest first
    }

    // 3. Execute both queries concurrently for efficiency
    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          seller: {
            select: { id: true, username: true },
          },
          images: {
            orderBy: {
              sortOrder: 'asc', // Assumes the primary image has the lowest sort order (e.g., 0)
            },
            take: 1, // Get only the first image in the sorted list
          },
          category: {
            select: { name: true }
          }
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// GET /api/products/categories - Get all active product categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: { id: true, username: true }
        },
        orderItems: {
          select: {
            id: true,
            quantity: true,
            order: {
              select: {
                id: true,
                order_status: true,
                createdAt: true,
                users: { 
                  select: { username: true }
                }
              }
            }
          },
          orderBy: {
            order: { createdAt: 'desc' }
          }
        },
        // Also include other related data you might need
        category: true,
        images: true,
        attributes: true,
        product_reviews: true 
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error(`Error fetching product with ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// POST /api/products - Create a new product
router.post('/', async (req, res) => {
  try {
    const { sellerId, categoryId, name, description, price, stockQuantity } = req.body;

    if (!sellerId || !categoryId || !name || !price || stockQuantity === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        quantity: parseInt(stockQuantity),
        status: 'published',
        seller: {
          connect: { id: parseInt(sellerId) }
        },
        category: {
          connect: { id: parseInt(categoryId) }
        }
      },
    });
    
    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'The specified Seller or Category does not exist.' });
    }
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/products/:id - Update an existing product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    // Use the exact field names from your database schema
    const { name, description, category_id, price, stock_quantity, status } = req.body;

    // Build the data object with only the fields that were provided
    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;
    if (category_id !== undefined) dataToUpdate.category_id = parseInt(category_id);
    if (price !== undefined) dataToUpdate.price = parseFloat(price);
    if (stock_quantity !== undefined) dataToUpdate.stock_quantity = parseInt(stock_quantity);
    if (status !== undefined) dataToUpdate.status = status;
    
    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ success: false, error: 'No fields provided to update.' });
    }

    // Use prisma.product.update to apply the changes
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: dataToUpdate,
      include: { // Include related data in the response
        seller: { select: { id: true, username: true } }
      }
    });

    res.json({ success: true, message: 'Product updated successfully', data: updatedProduct });
  } catch (error) {
    console.error(`Error updating product ${req.params.id}:`, error);
    // Handle case where the product to update is not found
    if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Product not found.' });
    }
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        orderItems: {
          include: {
            order: true // Include the full order to check its status
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // --- THIS IS THE FIX ---
    // Make sure the property name 'order_status' matches your Prisma schema
    // Prisma often converts snake_case to camelCase (e.g., orderStatus)
    const activeOrders = product.orderItems.filter(
      item => !['completed', 'cancelled', 'delivered', 'refunded'].includes(item.order.order_status)
    );

    if (activeOrders.length > 0) {
      return res.status(400).json({
        error: `Cannot delete product because it is part of ${activeOrders.length} active order(s).`
      });
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(`Error deleting product with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
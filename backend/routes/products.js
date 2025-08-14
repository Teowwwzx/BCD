// backend/routes/products.js
/**
 * =================================================================
 * API DOCUMENTATION: /api/products
 * =================================================================
 *
 * METHOD   | URL               | DESCRIPTION
 * ---------|-------------------|----------------------------------
 * POST     | /                 | Create a new product.
 * GET      | /                 | Get all products (with filtering & sorting).
 * GET      | /:id              | Get a single product by its ID.
 * PUT      | /:id              | Update an existing product by its ID.
 * DELETE   | /:id              | Delete a product by its ID.
 *
 * =================================================================
 *
 * REQUEST/RESPONSE FORMATS
 *
 * --- POST / ---
 * Request Body:
 * {
 * "name": "New Gadget",
 * "description": "An amazing new gadget.",
 * "price": 199.99,
 * "quantity": 100,
 * "sellerId": 1,
 * "categoryId": 1
 * }
 *
 * --- PUT /:id ---
 * Request Body:
 * {
 * "price": 189.99,
 * "status": "archived"
 * }
 *
 * --- GET / (Query Parameters) ---
 * ?page=1
 * ?limit=10
 * ?category=Electronics
 * ?search=gadget
 * ?sortBy=price-asc  (options: createdAt-desc, price-asc, price-desc, name)
 *
 */
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// ----------------------------------------------------------------
// 1. CREATE (POST /)
// ----------------------------------------------------------------
router.post('/', async (req, res) => {
    try {
        const { sellerId, categoryId, name, description, price, quantity, sku, status, imageUrl } = req.body;

        if (!sellerId || !categoryId || !name || price === undefined || quantity === undefined) {
            return res.status(400).json({ success: false, error: 'sellerId, categoryId, name, price, and quantity are required fields.' });
        }

        const newProduct = await prisma.product.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                sku,
                status: status || 'published',
                seller: { connect: { id: parseInt(sellerId) } },
                category: { connect: { id: parseInt(categoryId) } }
            },
        });

        // If imageUrl is provided, create a ProductImage record
        if (imageUrl) {
            await prisma.productImage.create({
                data: {
                    productId: newProduct.id,
                    imageUrl,
                    altText: `${name} product image`,
                    sortOrder: 0
                }
            });
        }

        res.status(201).json({ success: true, data: newProduct });
    } catch (error) {
        if (error.code === 'P2025') { // Foreign key constraint failed
            return res.status(404).json({ success: false, error: 'The specified Seller or Category does not exist.' });
        }
        console.error('Error creating product:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ----------------------------------------------------------------
// 2. READ ALL (GET /)
// ----------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            search,
            sortBy = 'createdAt-desc',
            sellerId,
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {
            status: 'published',
        };
        if (sellerId) {
            where.sellerId = parseInt(sellerId);
        }
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

        let orderBy = {};
        const [sortField, sortOrder] = sortBy.split('-');
        if (sortField === 'price') {
            orderBy = { price: sortOrder };
        } else if (sortField === 'name') {
            orderBy = { name: 'asc' };
        } else {
            orderBy = { createdAt: 'desc' };
        }

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
                        orderBy: { sortOrder: 'asc' },
                        take: 1,
                    },
                    category: {
                        select: { name: true }
                    },
                    product_reviews: {
                        select: { rating: true }
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

// ----------------------------------------------------------------
// 3. READ BY ID (GET /:id)
// ----------------------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id);

        if (isNaN(productId)) {
            return res.status(400).json({ success: false, error: 'Invalid product ID.' });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                seller: {
                    select: { id: true, username: true }
                },
                category: true,
                images: { orderBy: { sortOrder: 'asc' } },
                attributes: true,
                product_reviews: {
                    include: {
                        users: { select: { id: true, username: true, profileImageUrl: true } }
                    }
                }
            }
        });

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found.' });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        console.error(`Error fetching product with ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// 4. UPDATE BY ID (PUT /:id)
// ----------------------------------------------------------------
router.put('/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ success: false, error: 'Invalid product ID.' });
        }

        const { name, description, categoryId, price, quantity, status } = req.body;

        const dataToUpdate = {};
        if (name !== undefined) dataToUpdate.name = name;
        if (description !== undefined) dataToUpdate.description = description;
        if (categoryId !== undefined) dataToUpdate.categoryId = parseInt(categoryId);
        if (price !== undefined) dataToUpdate.price = parseFloat(price);
        if (quantity !== undefined) dataToUpdate.quantity = parseInt(quantity);
        if (status !== undefined) dataToUpdate.status = status;

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ success: false, error: 'No fields provided to update.' });
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: dataToUpdate,
            include: {
                seller: { select: { id: true, username: true } }
            }
        });

        res.json({ success: true, data: updatedProduct });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, error: 'Product not found.' });
        }
        console.error(`Error updating product ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// 5. DELETE (DELETE by ID)
// ----------------------------------------------------------------
router.delete('/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);

        if (isNaN(productId)) {
            return res.status(400).json({ success: false, error: 'Invalid product ID.' });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                orderItems: {
                    include: {
                        order: true
                    }
                }
            }
        });

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found.' });
        }

        const activeOrders = product.orderItems.filter(
            item => !['delivered', 'cancelled', 'refunded'].includes(item.order.order_status)
        );

        if (activeOrders.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete product because it is part of ${activeOrders.length} active order(s).`
            });
        }

        await prisma.product.delete({
            where: { id: productId }
        });

        res.json({ success: true, data: { message: 'Product deleted successfully.' } });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, error: 'Product not found.' });
        }
        console.error(`Error deleting product ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});


module.exports = router;
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// POST /api/orders - Create a new order (from cart checkout)
router.post('/checkout', async (req, res) => {
  try {
    const { buyerId, shippingAddressId, billingAddressId } = req.body;

    if (!buyerId || !shippingAddressId || !billingAddressId) {
      return res.status(400).json({ success: false, error: 'buyerId, shippingAddressId, and billingAddressId are required' });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: parseInt(buyerId) },
      include: { product: { include: { seller: true } } },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    // --- Transaction starts here ---
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Validate stock for all items
      for (const item of cartItems) {
        if (item.product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${item.product.name}`);
        }
        if (item.product.sellerId === parseInt(buyerId)) {
          throw new Error(`Cannot purchase your own product: ${item.product.name}`);
        }
      }

      // 2. Calculate totals
      const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const totalAmount = subtotal; // Add tax/shipping logic here if needed

      // 3. Create the main Order record
      const order = await tx.order.create({
        data: {
          buyer_id: parseInt(buyerId),
          shippingAddressId: parseInt(shippingAddressId),
          billingAddressId: parseInt(billingAddressId),
          order_status: 'pending',
          payment_status: 'pending',
          subtotal,
          totalAmount,
        },
      });

      // 4. Create OrderItem records for each cart item
      await tx.orderItem.createMany({
        data: cartItems.map(item => ({
          orderId: order.id,
          productId: item.productId,
          seller_id: item.product.sellerId,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: parseFloat(item.product.price) * item.quantity,
          product_name: item.product.name,
          product_sku: item.product.sku,
          product_image_url: item.product.images?.[0]?.imageUrl,
        })),
      });

      // 5. Decrement stock for each product
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // 6. Clear the user's cart
      await tx.cartItem.deleteMany({
        where: { userId: parseInt(buyerId) },
      });

      return order;
    });

    res.status(201).json({ success: true, message: 'Checkout successful!', data: newOrder });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// GET /api/orders - Get all orders with filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, buyerId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (buyerId) where.buyer_id = parseInt(buyerId);
    if (status) where.order_status = status;

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take,
        include: {
          users: { select: { id: true, username: true } }, // Correct relation name
          orderItems: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/orders/:id - Get a single order by ID
router.get('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        users: { select: { id: true, username: true, email: true } },
        orderItems: {
          include: {
            product: {
              include: {
                seller: { select: { id: true, username: true } },
                images: {
                  orderBy: { sortOrder: 'asc' },
                  take: 1
                }
              }
            },
          },
        },
        shippingAddress: true,
        user_addresses_orders_billing_address_idTouser_addresses: true,
        shipments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error(`Error fetching order ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/orders/:id/status - Update an order's status
router.put('/:id/status', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { order_status: status },
    });

    res.json({ success: true, message: 'Order status updated', data: updatedOrder });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }
    console.error(`Error updating order status for ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/orders/:id - Delete an order (Admin only)
// Note: Deleting orders is generally not recommended. Cancelling is better.
router.delete('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // For safety, only allow deletion of orders that are already cancelled.
    if (order.order_status !== 'cancelled') {
      return res.status(400).json({ success: false, error: 'Only cancelled orders can be deleted. Please cancel the order first.' });
    }

    await prisma.order.delete({ where: { id: orderId } });

    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }
    console.error(`Error deleting order ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
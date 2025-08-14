/**
 * Orders API Routes
 * 
 * This module handles order management with mandatory shipment details and separated payment processing.
 * Orders are created first, then payment is processed separately to handle payment failures gracefully.
 * 
 * Key Features:
 * - Orders MUST have shipment details created automatically
 * - Orders can be created even if payment fails
 * - Stock is reserved when order is created
 * - Payment processing is separate from order creation
 * 
 * Endpoints:
 * POST /api/orders/checkout - Create order with shipment details (payment pending)
 * POST /api/orders/:id/payment - Process payment for existing order
 * GET /api/orders - Get all orders with filtering
 * GET /api/orders/:id - Get specific order details
 * PUT /api/orders/:id/status - Update order status
 * DELETE /api/orders/:id - Cancel/delete order
 * 
 * Example checkout request:
 * {
 *   "buyerId": 1,
 *   "shippingAddressId": 2,
 *   "billingAddressId": 3,
 *   "shippingMethod": "ground", // optional, defaults to "ground"
 *   "carrier": "FedEx", // optional, defaults to "Standard Shipping"
 *   "estimatedWeight": 2.5 // optional, calculated from products if not provided
 * }
 * 
 * Example payment request:
 * {
 *   "paymentMethod": "crypto",
 *   "transactionHash": "0x123...",
 *   "fromAddress": "0xabc...",
 *   "toAddress": "0xdef..."
 * }
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// POST /api/orders - Create a new order (from cart checkout)
router.post('/checkout', async (req, res) => {
  try {
    const { buyerId, shippingAddressId, billingAddressId, shippingMethod, carrier, estimatedWeight } = req.body;

    if (!buyerId || !shippingAddressId || !billingAddressId) {
      return res.status(400).json({ success: false, error: 'buyerId, shippingAddressId, and billingAddressId are required' });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: parseInt(buyerId) },
      include: { product: { include: { seller: true, images: true } } },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    // --- Transaction starts here ---
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate stock for all items
      for (const item of cartItems) {
        if (item.product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${item.product.name}`);
        }
        if (item.product.sellerId === parseInt(buyerId)) {
          throw new Error(`Cannot purchase your own product: ${item.product.name}`);
        }
      }

      // 2. Calculate totals and shipping
      const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const totalWeight = cartItems.reduce((sum, item) => {
        const weight = item.product.weightKg || 0.5; // Default 0.5kg if not specified
        return sum + (parseFloat(weight) * item.quantity);
      }, 0);
      
      // Calculate shipping cost based on weight (simple formula)
      const shippingAmount = Math.max(5.00, totalWeight * 2.50); // Minimum $5, $2.50 per kg
      const totalAmount = parseFloat(subtotal) + shippingAmount;

      // 3. Create the main Order record
      const order = await tx.order.create({
        data: {
          buyer_id: parseInt(buyerId),
          shippingAddressId: parseInt(shippingAddressId),
          billingAddressId: parseInt(billingAddressId),
          order_status: 'pending',
          payment_status: 'pending', // Order created but payment not processed yet
          subtotal,
          shippingAmount,
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

      // 5. MANDATORY: Create shipment details for the order
      const shipment = await tx.shipment.create({
        data: {
          orderId: order.id,
          carrier: carrier || 'Standard Shipping',
          shipping_method: shippingMethod || 'ground',
          shipping_cost: shippingAmount,
          weight_kg: totalWeight,
          status: 'pending',
          notes: `Order created with ${cartItems.length} items, total weight: ${totalWeight}kg`
        }
      });

      // 6. Reserve stock (decrement) - Order is created regardless of payment
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // 7. Clear the user's cart
      await tx.cartItem.deleteMany({
        where: { userId: parseInt(buyerId) },
      });

      return { order, shipment };
    });

    res.status(201).json({ 
      success: true, 
      message: 'Order created successfully! Payment can be processed separately.', 
      data: {
        order: result.order,
        shipment: result.shipment,
        note: 'Order is created with pending payment status. Stock has been reserved.'
      }
    });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// POST /api/orders/:id/payment - Process payment for an existing order
router.post('/:id/payment', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { paymentMethod, transactionHash, fromAddress, toAddress } = req.body;

    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID' });
    }

    // Check if order exists and is in pending payment status
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shipments: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.payment_status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: `Order payment status is ${order.payment_status}. Can only process payment for pending orders.` 
      });
    }

    try {
      // Process payment in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create payment transaction record
        const paymentTransaction = await tx.paymentTransaction.create({
          data: {
            orderId: orderId,
            amount: order.totalAmount,
            tx_hash: transactionHash || `mock_tx_${Date.now()}`,
            from_address: fromAddress || '0x0000000000000000000000000000000000000000',
            to_address: toAddress || '0x1111111111111111111111111111111111111111',
            status: 'confirmed' // In real implementation, this would be 'pending' initially
          }
        });

        // Update order payment status
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: { 
            payment_status: 'paid',
            order_status: 'confirmed' // Move to confirmed once payment is successful
          }
        });

        // Update shipment status to ready for pickup
        if (order.shipments) {
          await tx.shipment.update({
            where: { orderId: orderId },
            data: { status: 'pending' } // Ready for carrier pickup
          });
        }

        return { order: updatedOrder, payment: paymentTransaction };
      });

      res.json({
        success: true,
        message: 'Payment processed successfully!',
        data: result
      });

    } catch (paymentError) {
      // Payment failed - update order status but keep the order
      await prisma.order.update({
        where: { id: orderId },
        data: { payment_status: 'failed' }
      });

      res.status(400).json({
        success: false,
        error: 'Payment processing failed. Order remains in system with failed payment status.',
        orderId: orderId,
        note: 'You can retry payment or cancel the order. Stock remains reserved.'
      });
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
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
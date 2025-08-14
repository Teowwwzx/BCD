/**
 * =================================================================
 * API DOCUMENTATION: /api/orders
 * =================================================================
 *
 * METHOD   | URL               | DESCRIPTION
 * ---------|-------------------|----------------------------------
 * POST     | /                 | Create a new order from cart checkout.
 * GET      | /                 | Get all orders (with filtering).
 * GET      | /:id              | Get a single order by ID.
 * PUT      | /:id              | Update an existing order status.
 * DELETE   | /:id              | Delete an order (admin only).
 *
 * =================================================================
 *
 * REQUEST/RESPONSE FORMATS
 *
 * --- POST / ---
 * Request Body:
 * {
 *     "buyerId": 1,
 *     "shippingAddressId": 2,
 *     "billingAddressId": 3,
 *     "paymentMethod": "crypto"
 * }
 *
 * --- PUT /:id ---
 * Request Body:
 * {
 *     "order_status": "confirmed",     // Valid: "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"
 *     "payment_status": "paid"         // Valid: "pending", "paid", "failed", "refunded", "partially_refunded"
 * }
 *
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// ----------------------------------------------------------------
// CREATE - Create a new order from cart checkout
// ----------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { buyerId, shippingAddressId, billingAddressId, paymentMethod } = req.body;

    // Validate required fields
    if (!buyerId || !shippingAddressId || !billingAddressId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: buyerId, shippingAddressId, billingAddressId' 
      });
    }

    // Validate buyerId format
    const buyerIdInt = parseInt(buyerId);
    if (isNaN(buyerIdInt)) {
      return res.status(400).json({ success: false, error: 'Invalid buyerId format.' });
    }

    // Validate address IDs format
    const shippingAddressIdInt = parseInt(shippingAddressId);
    const billingAddressIdInt = parseInt(billingAddressId);
    if (isNaN(shippingAddressIdInt) || isNaN(billingAddressIdInt)) {
      return res.status(400).json({ success: false, error: 'Invalid address ID format.' });
    }

    // Validate that buyer exists
    const buyer = await prisma.user.findUnique({
      where: { id: buyerIdInt }
    });
    if (!buyer) {
      return res.status(404).json({ success: false, error: 'Buyer not found.' });
    }

    // Validate that shipping address exists and belongs to the buyer
    const shippingAddress = await prisma.user_addresses.findFirst({
      where: { 
        id: shippingAddressIdInt,
        user_id: buyerIdInt,
        address_type: 'shipping'
      }
    });
    if (!shippingAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid shipping address or address does not belong to buyer.' 
      });
    }

    // Validate that billing address exists and belongs to the buyer
    const billingAddress = await prisma.user_addresses.findFirst({
      where: { 
        id: billingAddressIdInt,
        user_id: buyerIdInt,
        address_type: 'billing'
      }
    });
    if (!billingAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid billing address or address does not belong to buyer.' 
      });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: buyerIdInt },
      include: { product: { include: { seller: true } } },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty.' });
    }

    // Determine payment status based on payment method
    const paymentStatus = paymentMethod ? 'pending' : 'pending'; // Always start as pending
    const orderStatus = 'pending'; // Orders always start as pending

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
          buyer_id: buyerIdInt,
          shippingAddressId: shippingAddressIdInt,
          billingAddressId: billingAddressIdInt,
          order_status: orderStatus,
          payment_status: paymentStatus,
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

// ----------------------------------------------------------------
// READ ALL - Get all orders with filtering
// ----------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { buyer_id, seller_id, order_status, payment_status, limit, offset } = req.query;

    // Build where clause for filtering
    const whereClause = {};
    if (buyer_id) {
      const buyerIdInt = parseInt(buyer_id);
      if (isNaN(buyerIdInt)) {
        return res.status(400).json({ success: false, error: 'Invalid buyer_id format.' });
      }
      whereClause.buyer_id = buyerIdInt;
    }
    if (order_status) {
      const validOrderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
      if (!validOrderStatuses.includes(order_status)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid order_status. Valid values: ${validOrderStatuses.join(', ')}` 
        });
      }
      whereClause.order_status = order_status;
    }
    if (payment_status) {
      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'];
      if (!validPaymentStatuses.includes(payment_status)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid payment_status. Valid values: ${validPaymentStatuses.join(', ')}` 
        });
      }
      whereClause.payment_status = payment_status;
    }

    // Add support for filtering by seller_id via related orderItems
    if (seller_id) {
      const sellerIdInt = parseInt(String(seller_id));
      if (isNaN(sellerIdInt)) {
        return res.status(400).json({ success: false, error: 'Invalid seller_id format.' });
      }
      // When filtering by seller, we need orders that have at least one orderItem with this seller_id
      whereClause.orderItems = {
        some: { seller_id: sellerIdInt }
      };
    }

    // Parse pagination parameters
    const limitInt = limit ? parseInt(limit) : 50;
    const offsetInt = offset ? parseInt(offset) : 0;
    if (isNaN(limitInt) || isNaN(offsetInt) || limitInt < 1 || offsetInt < 0) {
      return res.status(400).json({ success: false, error: 'Invalid pagination parameters.' });
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        users: {
          select: { id: true, username: true, email: true }
        },
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, price: true, sellerId: true }
            }
          }
        },
        shippingAddress: true,
        user_addresses_orders_billing_address_idTouser_addresses: true
      },
      orderBy: { createdAt: 'desc' },
      take: limitInt,
      skip: offsetInt
    });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ----------------------------------------------------------------
// READ BY ID - Get a single order by ID
// ----------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID format.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        users: {
          select: { id: true, username: true, email: true }
        },
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, price: true, sellerId: true }
            }
          }
        },
        shippingAddress: true,
        user_addresses_orders_billing_address_idTouser_addresses: true
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ----------------------------------------------------------------
// UPDATE BY ID - Update an existing order status
// ----------------------------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, payment_status } = req.body;

    // Validate ID format
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID format.' });
    }

    // Validate order_status if provided
    if (order_status) {
      const validOrderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
      if (!validOrderStatuses.includes(order_status)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid order_status. Valid values: ${validOrderStatuses.join(', ')}` 
        });
      }
    }

    // Validate payment_status if provided
    if (payment_status) {
      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'];
      if (!validPaymentStatuses.includes(payment_status)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid payment_status. Valid values: ${validPaymentStatuses.join(', ')}` 
        });
      }
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });
    if (!existingOrder) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // Build update data
    const updateData = { updated_at: new Date() };
    if (order_status) updateData.order_status = order_status;
    if (payment_status) updateData.payment_status = payment_status;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        users: {
          select: { id: true, username: true, email: true }
        },
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, price: true }
            }
          }
        }
      }
    });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ----------------------------------------------------------------
// DELETE BY ID - Delete an order (admin only)
// ----------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID format.' });
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });
    if (!existingOrder) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // For safety, only allow deletion of orders that are already cancelled
    if (existingOrder.order_status !== 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only cancelled orders can be deleted. Please cancel the order first.' 
      });
    }

    // Delete order in a transaction to handle related records
    await prisma.$transaction(async (tx) => {
      // First delete order items
      await tx.orderItem.deleteMany({
        where: { orderId: orderId }
      });
      
      // Then delete the order
      await tx.order.delete({
        where: { id: orderId }
      });
    });

    res.status(200).json({ success: true, data: { message: 'Order deleted successfully.' } });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
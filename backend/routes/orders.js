/**
 * =================================================================
 * API DOCUMENTATION: /api/orders
 * =================================================================
 *
 * METHOD   | URL               | DESCRIPTION
 * ---------|-------------------|----------------------------------
 * POST     | /                 | Create a new order from cart checkout.
 * POST     | /checkout         | Enhanced checkout with shipping calculation.
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
 * --- POST /checkout (Enhanced Checkout) ---
 * Request Body (Gateway Payment):
 * {
 *     "buyerId": 1,
 *     "shippingAddressId": 2,
 *     "billingAddressId": 3,
 *     "shippingMethodId": 1,
 *     "paymentMethod": "gateway",
 *     "paymentToken": "tok_1234567890",
 *     "customerEmail": "customer@example.com",
 *     "couponCode": "SAVE10"
 * }
 *
 * Request Body (Wallet Payment):
 * {
 *     "buyerId": 1,
 *     "shippingAddressId": 2,
 *     "billingAddressId": 3,
 *     "shippingMethodId": 1,
 *     "paymentMethod": "wallet",
 *     "fromUserId": 1,
 *     "toUserId": 2,
 *     "couponCode": "SAVE10"
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
// ENHANCED CHECKOUT - Complete checkout with shipping and payment
// ----------------------------------------------------------------
router.post('/checkout', async (req, res) => {
  try {
    const {
      buyerId,
      shippingAddressId,
      billingAddressId,
      shippingMethodId,
      paymentMethod = 'gateway',
      paymentToken,
      customerEmail,
      couponCode
    } = req.body;

    // Validate required fields
    if (!buyerId || !shippingAddressId || !billingAddressId || !shippingMethodId) {
      return res.status(400).json({
        success: false,
        error: 'Buyer ID, shipping address ID, billing address ID, and shipping method ID are required.'
      });
    }

    if (paymentMethod === 'gateway' && !paymentToken) {
      return res.status(400).json({
        success: false,
        error: 'Payment token is required for gateway payments.'
      });
    }

    // Validate numeric IDs
    const buyerIdInt = parseInt(buyerId);
    const shippingAddressIdInt = parseInt(shippingAddressId);
    const billingAddressIdInt = parseInt(billingAddressId);
    const shippingMethodIdInt = parseInt(shippingMethodId);

    if (isNaN(buyerIdInt) || isNaN(shippingAddressIdInt) || isNaN(billingAddressIdInt) || isNaN(shippingMethodIdInt)) {
      return res.status(400).json({ success: false, error: 'Invalid ID format.' });
    }

    // Get user's cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: buyerIdInt },
      include: {
        product: {
          include: {
            images: { take: 1 }
          }
        }
      }
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty.' });
    }

    // Validate addresses exist
    const [shippingAddress, billingAddress] = await Promise.all([
      prisma.user_addresses.findUnique({ where: { id: shippingAddressIdInt } }),
      prisma.user_addresses.findUnique({ where: { id: billingAddressIdInt } })
    ]);

    if (!shippingAddress || !billingAddress) {
      return res.status(404).json({ success: false, error: 'Shipping or billing address not found.' });
    }

    // Get shipping method
    const shippingMethod = await prisma.shippingMethod.findUnique({
      where: { id: shippingMethodIdInt }
    });

    if (!shippingMethod || !shippingMethod.isActive) {
      return res.status(404).json({ success: false, error: 'Shipping method not found or inactive.' });
    }

    // Calculate order totals
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.product.price) * item.quantity);
    }, 0);

    // Calculate total weight for shipping
    const totalWeight = cartItems.reduce((sum, item) => {
      const weight = parseFloat(item.product.weightKg) || 0;
      return sum + (weight * item.quantity);
    }, 0);

    // Calculate shipping cost (simplified - using base rate + per kg rate)
    const shippingCost = parseFloat(shippingMethod.baseRate) + 
                        (parseFloat(shippingMethod.perKgRate || 0) * totalWeight);

    // Apply coupon if provided
    let discountAmount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode }
      });

      if (coupon && coupon.status === 'active' && 
          (!coupon.minimum_order_amount || subtotal >= parseFloat(coupon.minimum_order_amount))) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = (subtotal * parseFloat(coupon.discount_value)) / 100;
        } else {
          discountAmount = parseFloat(coupon.discount_value);
        }

        // Apply maximum discount limit if set
        if (coupon.maximum_discount_amount && discountAmount > parseFloat(coupon.maximum_discount_amount)) {
          discountAmount = parseFloat(coupon.maximum_discount_amount);
        }

        appliedCoupon = coupon;
      }
    }

    // Calculate tax (simplified - 10% tax rate)
    const taxRate = 0.10;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * taxRate;

    // Calculate final total
    const totalAmount = subtotal - discountAmount + taxAmount + shippingCost;

    // Create order and process payment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the main Order record
      const order = await tx.order.create({
        data: {
          buyer_id: buyerIdInt,
          shippingAddressId: shippingAddressIdInt,
          billingAddressId: billingAddressIdInt,
          order_status: 'pending',
          payment_status: 'pending',
          subtotal: subtotal.toString(),
          taxAmount: taxAmount.toString(),
          shippingAmount: shippingCost.toString(),
          totalAmount: totalAmount.toString()
        },
        include: {
          users: { select: { id: true, username: true, email: true } }
        }
      });

      // 2. Create OrderItem records
      await tx.orderItem.createMany({
        data: cartItems.map(item => ({
          orderId: order.id,
          productId: item.productId,
          seller_id: item.product.sellerId,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: (parseFloat(item.product.price) * item.quantity).toString(),
          product_name: item.product.name,
          product_sku: item.product.sku,
          product_image_url: item.product.images?.[0]?.imageUrl
        }))
      });

      // 3. Create shipment record
      const shipment = await tx.shipment.create({
        data: {
          orderId: order.id,
          shipping_method: shippingMethod.name,
          shipping_cost: shippingCost.toString(),
          weight_kg: totalWeight.toString(),
          status: 'pending'
        }
      });

      // 4. Record coupon usage if applicable
      if (appliedCoupon) {
        await tx.coupon_usage.create({
          data: {
            coupon_id: appliedCoupon.id,
            user_id: buyerIdInt,
            order_id: order.id,
            discount_amount: discountAmount.toString()
          }
        });

        // Update coupon usage count
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { usage_count: { increment: 1 } }
        });
      }

      // 5. Process payment based on method
       let paymentResult = null;
       if (paymentMethod === 'gateway') {
         // Simulate gateway payment processing
         const gatewayResponse = {
           success: true,
           transactionId: `gw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
           gatewayStatus: 'succeeded',
           processingFee: (totalAmount * 0.029 + 0.30).toFixed(2)
         };

         paymentResult = await tx.paymentTransaction.create({
           data: {
             orderId: order.id,
             amount: totalAmount.toString(),
             tx_hash: gatewayResponse.transactionId,
             from_address: customerEmail || order.users.email,
             to_address: 'gateway_merchant_account',
             status: gatewayResponse.success ? 'confirmed' : 'failed',
             payment_method: 'gateway',
             gateway_response: JSON.stringify(gatewayResponse),
             processing_fee: gatewayResponse.processingFee
           }
         });

         // Update order payment status
         await tx.order.update({
           where: { id: order.id },
           data: { payment_status: gatewayResponse.success ? 'paid' : 'failed' }
         });
       } else if (paymentMethod === 'wallet') {
         // Handle wallet-to-wallet payment
         const { fromUserId, toUserId } = req.body;

         if (!fromUserId || !toUserId) {
           throw new Error('fromUserId and toUserId are required for wallet payments.');
         }

         // Get wallet addresses for both users
         const [fromWallet, toWallet] = await Promise.all([
           tx.user_wallets.findUnique({ where: { user_id: parseInt(fromUserId) } }),
           tx.user_wallets.findUnique({ where: { user_id: parseInt(toUserId) } })
         ]);

         if (!fromWallet || !toWallet) {
           throw new Error('Wallet not found for one or both users.');
         }

         // Simulate wallet transfer
         const walletTransfer = {
           success: true,
           transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
           blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
           gasUsed: Math.floor(Math.random() * 50000) + 21000,
           gasPriceGwei: (Math.random() * 50 + 10).toFixed(2)
         };

         paymentResult = await tx.paymentTransaction.create({
           data: {
             orderId: order.id,
             amount: totalAmount.toString(),
             tx_hash: walletTransfer.transactionHash,
             blockNumber: walletTransfer.blockNumber,
             gasUsed: walletTransfer.gasUsed,
             gas_price_gwei: walletTransfer.gasPriceGwei,
             from_address: fromWallet.wallet_addr,
             to_address: toWallet.wallet_addr,
             status: walletTransfer.success ? 'confirmed' : 'failed',
             payment_method: 'wallet',
             processing_fee: '0.00'
           }
         });

         // Update order payment status
         await tx.order.update({
           where: { id: order.id },
           data: { payment_status: walletTransfer.success ? 'paid' : 'failed' }
         });
       }

      // 6. Update product stock
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      // 7. Clear cart
      await tx.cartItem.deleteMany({
        where: { userId: buyerIdInt }
      });

      return {
        order,
        shipment,
        payment: paymentResult,
        appliedCoupon,
        breakdown: {
          subtotal,
          discountAmount,
          taxAmount,
          shippingCost,
          totalAmount,
          totalWeight
        }
      };
    });

    res.status(201).json({
      success: true,
      message: 'Enhanced checkout completed successfully!',
      data: result
    });

  } catch (error) {
    console.error('Error during enhanced checkout:', error);
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
    const updateData = { updatedAt: new Date() };
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
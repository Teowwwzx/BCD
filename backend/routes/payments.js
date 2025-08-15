/**
 * =================================================================
 * API DOCUMENTATION: /api/payments
 * =================================================================
 *
 * METHOD   | URL               | DESCRIPTION
 * ---------|-------------------|----------------------------------
 * POST     | /                 | Create a new payment and transaction.
 * POST     | /gateway          | Process payment via payment gateway.
 * POST     | /wallet-transfer  | Process wallet-to-wallet payment.
 * GET      | /                 | Get all payments (with filtering).
 * GET      | /:id              | Get a single payment by ID.
 * PUT      | /:id              | Update payment status.
 * DELETE   | /:id              | Delete a payment.
 *
 * =================================================================
 *
 * REQUEST/RESPONSE FORMATS
 *
 * --- POST / (Direct Transaction) ---
 * Request Body:
 * {
 *   "orderId": 123,
 *   "amount": "99.99",
 *   "tx_hash": "0x1234567890abcdef",
 *   "blockNumber": 12345678,
 *   "from_address": "0xabc123...",
 *   "to_address": "0xdef456..."
 * }
 *
 * --- POST /gateway (Payment Gateway) ---
 * Request Body:
 * {
 *   "orderId": 123,
 *   "amount": "99.99",
 *   "paymentMethod": "stripe",
 *   "paymentToken": "tok_1234567890",
 *   "customerEmail": "customer@example.com"
 * }
 *
 * --- POST /wallet-transfer (Wallet to Wallet) ---
 * Request Body:
 * {
 *   "orderId": 123,
 *   "amount": "99.99",
 *   "fromUserId": 1,
 *   "toUserId": 2,
 *   "description": "Payment for order #123"
 * }
 *
 * --- PUT /:id ---
 * Request Body:
 * {
 *   "status": "confirmed"
 * }
 *
 * Valid status values: pending, confirmed, failed
 *
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// ----------------------------------------------------------------
// CREATE - Create a new payment and transaction
// ----------------------------------------------------------------
router.post('/', async (req, res) => {
    try {
        const {
            orderId,
            amount,
            tx_hash,
            blockNumber,
            from_address,
            to_address
        } = req.body;

        // Validate required fields
        if (!orderId || !amount || !tx_hash || !from_address || !to_address) {
            return res.status(400).json({ 
                success: false, 
                error: 'Order ID, amount, transaction hash, from address, and to address are required.' 
            });
        }

        // Validate orderId format
        const orderIdInt = parseInt(orderId);
        if (isNaN(orderIdInt)) {
            return res.status(400).json({ success: false, error: 'Invalid order ID format.' });
        }

        // Validate amount format
        const amountDecimal = parseFloat(amount);
        if (isNaN(amountDecimal) || amountDecimal <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid amount format. Must be a positive number.' });
        }

        // Validate blockNumber if provided
        let blockNumberInt = null;
        if (blockNumber !== undefined && blockNumber !== null) {
            blockNumberInt = parseInt(blockNumber);
            if (isNaN(blockNumberInt)) {
                return res.status(400).json({ success: false, error: 'Invalid block number format.' });
            }
        }

        // Check if order exists
        const order = await prisma.order.findUnique({
            where: { id: orderIdInt },
            include: {
                buyer: { select: { id: true, username: true } }
            }
        });

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found.' });
        }

        // Check if payment already exists for this order
        const existingPayment = await prisma.paymentTransaction.findFirst({
            where: { orderId: orderIdInt }
        });

        if (existingPayment) {
            return res.status(400).json({ 
                success: false, 
                error: 'Payment already exists for this order.' 
            });
        }

        // Create payment transaction
        const payment = await prisma.paymentTransaction.create({
            data: {
                orderId: orderIdInt,
                amount: amountDecimal.toString(),
                tx_hash,
                blockNumber: blockNumberInt,
                from_address,
                to_address,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            include: {
                order: {
                    include: {
                        buyer: { select: { id: true, username: true } }
                    }
                }
            }
        });

        res.status(201).json({ success: true, data: payment });
    } catch (error) {
        // console.error('Error creating payment:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// PAYMENT GATEWAY - Process payment via payment gateway (Stripe)
// ----------------------------------------------------------------
router.post('/gateway', async (req, res) => {
    try {
        const {
            orderId,
            amount,
            paymentMethod = 'stripe',
            paymentToken,
            customerEmail
        } = req.body;

        // Validate required fields
        if (!orderId || !amount || !paymentToken) {
            return res.status(400).json({ 
                success: false, 
                error: 'Order ID, amount, and payment token are required.' 
            });
        }

        // Validate orderId format
        const orderIdInt = parseInt(orderId);
        if (isNaN(orderIdInt)) {
            return res.status(400).json({ success: false, error: 'Invalid order ID format.' });
        }

        // Validate amount format
        const amountDecimal = parseFloat(amount);
        if (isNaN(amountDecimal) || amountDecimal <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid amount format. Must be a positive number.' });
        }

        // Check if order exists
        const order = await prisma.order.findUnique({
            where: { id: orderIdInt },
            include: {
                buyer: { select: { id: true, username: true, email: true } }
            }
        });

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found.' });
        }

        // Check if payment already exists for this order
        const existingPayment = await prisma.paymentTransaction.findFirst({
            where: { orderId: orderIdInt }
        });

        if (existingPayment) {
            return res.status(400).json({ 
                success: false, 
                error: 'Payment already exists for this order.' 
            });
        }

        // Simulate payment gateway processing (Stripe integration would go here)
        // For now, we'll create a mock gateway response
        const gatewayResponse = {
            success: true,
            transactionId: `gw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            gatewayStatus: 'succeeded',
            processingFee: (amountDecimal * 0.029 + 0.30).toFixed(2) // 2.9% + $0.30
        };

        // Create payment transaction record
        const payment = await prisma.paymentTransaction.create({
            data: {
                orderId: orderIdInt,
                amount: amountDecimal.toString(),
                tx_hash: gatewayResponse.transactionId,
                blockNumber: null, // Not applicable for gateway payments
                from_address: customerEmail || order.buyer.email,
                to_address: 'gateway_merchant_account',
                status: gatewayResponse.success ? 'confirmed' : 'failed',
                payment_method: paymentMethod,
                gateway_response: JSON.stringify(gatewayResponse),
                processing_fee: gatewayResponse.processingFee,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            include: {
                order: {
                    include: {
                        buyer: { select: { id: true, username: true } }
                    }
                }
            }
        });

        // Update order payment status
        await prisma.order.update({
            where: { id: orderIdInt },
            data: {
                payment_status: gatewayResponse.success ? 'paid' : 'failed',
                updatedAt: new Date()
            }
        });

        res.status(201).json({ 
            success: true, 
            data: {
                payment,
                gateway: {
                    transactionId: gatewayResponse.transactionId,
                    status: gatewayResponse.gatewayStatus,
                    processingFee: gatewayResponse.processingFee
                }
            }
        });
    } catch (error) {
        console.error('Error processing gateway payment:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// WALLET TRANSFER - Process wallet-to-wallet payment
// ----------------------------------------------------------------
router.post('/wallet-transfer', async (req, res) => {
    try {
        const {
            orderId,
            amount, // ETH amount
            usdAmount, // USD amount for reference
            fromUserId,
            toUserId,
            txHash,
            blockNumber,
            gasUsed,
            gasPriceGwei,
            fromAddress,
            toAddress,
            description = 'Wallet transfer payment'
        } = req.body;

        // Validate required fields
        if (!orderId || !amount || !fromUserId || !toUserId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Order ID, amount, from user ID, and to user ID are required.' 
            });
        }

        // Validate numeric fields
        const orderIdInt = parseInt(orderId);
        const fromUserIdInt = parseInt(fromUserId);
        const toUserIdInt = parseInt(toUserId);
        const amountDecimal = parseFloat(amount);

        if (isNaN(orderIdInt) || isNaN(fromUserIdInt) || isNaN(toUserIdInt)) {
            return res.status(400).json({ success: false, error: 'Invalid ID format.' });
        }

        if (isNaN(amountDecimal) || amountDecimal <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid amount format. Must be a positive number.' });
        }

        if (fromUserIdInt === toUserIdInt) {
            return res.status(400).json({ success: false, error: 'Cannot transfer to the same user.' });
        }

        // Check if order exists and belongs to the from user
        const order = await prisma.order.findUnique({
            where: { id: orderIdInt },
            include: {
                buyer: { select: { id: true, username: true } }
            }
        });

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found.' });
        }

        if (order.buyer_id !== fromUserIdInt) {
            return res.status(403).json({ success: false, error: 'Order does not belong to the specified user.' });
        }

        // Check if payment already exists for this order
        const existingPayment = await prisma.paymentTransaction.findFirst({
            where: { orderId: orderIdInt }
        });

        if (existingPayment) {
            return res.status(400).json({ 
                success: false, 
                error: 'Payment already exists for this order.' 
            });
        }

        // Get wallet addresses for both users
        const fromWallet = await prisma.user_wallets.findUnique({
            where: { user_id: fromUserIdInt }
        });

        const toWallet = await prisma.user_wallets.findUnique({
            where: { user_id: toUserIdInt }
        });

        if (!fromWallet) {
            return res.status(404).json({ success: false, error: 'Sender wallet not found.' });
        }

        if (!toWallet) {
            return res.status(404).json({ success: false, error: 'Recipient wallet not found.' });
        }

        // Use real transaction data from MetaMask if provided, otherwise simulate
        const actualTxHash = txHash || `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create payment transaction record
        const payment = await prisma.paymentTransaction.create({
            data: {
                orderId: orderIdInt,
                amount: amountDecimal.toString(),
                tx_hash: actualTxHash,
                blockNumber: blockNumber || null,
                gasUsed: gasUsed || null,
                gas_price_gwei: gasPriceGwei || null,
                from_address: fromAddress || fromWallet.wallet_addr,
                to_address: toAddress || toWallet.wallet_addr,
                status: 'confirmed',
                payment_method: 'wallet',
                gateway_response: JSON.stringify({
                    transferId: actualTxHash,
                    fromUserId: fromUserIdInt,
                    toUserId: toUserIdInt,
                    ethAmount: amountDecimal.toString(),
                    usdAmount: usdAmount || null,
                    description,
                    realTransaction: !!txHash
                }),
                processing_fee: '0.00',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            include: {
                order: {
                    include: {
                        buyer: { select: { id: true, username: true } }
                    }
                }
            }
        });

        // Update order payment status
        await prisma.order.update({
            where: { id: orderIdInt },
            data: {
                payment_status: 'paid',
                updatedAt: new Date()
            }
        });

        res.status(201).json({ 
            success: true, 
            data: {
                payment,
                transfer: {
                    transferId: actualTxHash,
                    fromWallet: fromAddress || fromWallet.wallet_addr,
                    toWallet: toAddress || toWallet.wallet_addr,
                    description,
                    transactionHash: txHash,
                    blockNumber,
                    gasUsed,
                    gasPriceGwei
                }
            }
        });
    } catch (error) {
        console.error('Error processing wallet transfer:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// READ ALL - Get all payments with filtering and pagination
// ----------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const { 
            order_id, 
            status, 
            from_address, 
            to_address,
            limit = '50', 
            offset = '0' 
        } = req.query;

        // Validate query parameters
        const limitInt = parseInt(limit);
        const offsetInt = parseInt(offset);

        if (isNaN(limitInt) || limitInt <= 0 || limitInt > 100) {
            return res.status(400).json({ 
                success: false, 
                error: 'Limit must be a positive integer between 1 and 100.' 
            });
        }

        if (isNaN(offsetInt) || offsetInt < 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Offset must be a non-negative integer.' 
            });
        }

        // Validate order_id if provided
        let orderIdInt = null;
        if (order_id) {
            orderIdInt = parseInt(order_id);
            if (isNaN(orderIdInt)) {
                return res.status(400).json({ success: false, error: 'Invalid order ID format.' });
            }
        }

        // Validate status if provided
        const validStatuses = ['pending', 'confirmed', 'failed'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}.` 
            });
        }

        // Build filter conditions
        const whereConditions = {};
        if (orderIdInt) whereConditions.orderId = orderIdInt;
        if (status) whereConditions.status = status;
        if (from_address) whereConditions.from_address = from_address;
        if (to_address) whereConditions.to_address = to_address;

        const payments = await prisma.paymentTransaction.findMany({
            where: whereConditions,
            include: {
                order: {
                    include: {
                        buyer: { select: { id: true, username: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limitInt,
            skip: offsetInt
        });

        const totalCount = await prisma.paymentTransaction.count({
            where: whereConditions
        });

        res.status(200).json({ 
            success: true, 
            data: {
                payments,
                pagination: {
                    total: totalCount,
                    limit: limitInt,
                    offset: offsetInt,
                    hasMore: offsetInt + limitInt < totalCount
                }
            }
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// READ BY ID - Get a single payment by ID
// ----------------------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        const paymentId = parseInt(req.params.id);
        if (isNaN(paymentId)) {
            return res.status(400).json({ success: false, error: 'Invalid payment ID format.' });
        }

        const payment = await prisma.paymentTransaction.findUnique({
            where: { id: paymentId },
            include: {
                order: {
                    include: {
                        buyer: { select: { id: true, username: true, email: true } },
                        orderItems: {
                            include: {
                                product: { select: { id: true, name: true, price: true } }
                            }
                        },
                        shippingAddress: true,
                        billingAddress: true
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment not found.' });
        }

        res.status(200).json({ success: true, data: payment });
    } catch (error) {
        console.error(`Error fetching payment ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// UPDATE - Update payment status
// ----------------------------------------------------------------
router.put('/:id', async (req, res) => {
    try {
        const paymentId = parseInt(req.params.id);
        if (isNaN(paymentId)) {
            return res.status(400).json({ success: false, error: 'Invalid payment ID format.' });
        }

        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'failed'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                error: `Status is required and must be one of: ${validStatuses.join(', ')}.` 
            });
        }

        // Check if payment exists
        const existingPayment = await prisma.paymentTransaction.findUnique({
            where: { id: paymentId },
            include: {
                order: true
            }
        });

        if (!existingPayment) {
            return res.status(404).json({ success: false, error: 'Payment not found.' });
        }

        // Update payment status and related order payment status
        const result = await prisma.$transaction(async (prisma) => {
            // Update payment transaction status
            const updatedPayment = await prisma.paymentTransaction.update({
                where: { id: paymentId },
                data: {
                    status,
                    updatedAt: new Date()
                },
                include: {
                    order: {
                        include: {
                            buyer: { select: { id: true, username: true } }
                        }
                    }
                }
            });

            // Update order payment status based on payment status
            let orderPaymentStatus = 'pending';
            if (status === 'confirmed') {
                orderPaymentStatus = 'paid';
            } else if (status === 'failed') {
                orderPaymentStatus = 'failed';
            }

            await prisma.order.update({
                where: { id: existingPayment.orderId },
                data: {
                    payment_status: orderPaymentStatus,
                    updatedAt: new Date()
                }
            });

            return updatedPayment;
        });

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error(`Error updating payment ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// DELETE - Delete a payment
// ----------------------------------------------------------------
router.delete('/:id', async (req, res) => {
    try {
        const paymentId = parseInt(req.params.id);
        if (isNaN(paymentId)) {
            return res.status(400).json({ success: false, error: 'Invalid payment ID format.' });
        }

        // Check if payment exists
        const existingPayment = await prisma.paymentTransaction.findUnique({
            where: { id: paymentId }
        });

        if (!existingPayment) {
            return res.status(404).json({ success: false, error: 'Payment not found.' });
        }

        // Delete payment
        await prisma.paymentTransaction.delete({
            where: { id: paymentId }
        });

        res.status(200).json({ 
            success: true, 
            data: { message: 'Payment deleted successfully.' } 
        });
    } catch (error) {
        console.error(`Error deleting payment ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

module.exports = router;
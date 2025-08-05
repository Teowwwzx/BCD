const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Create a new order
router.post('/', async (req, res) => {
  try {
    const {
      buyerId,
      productId,
      quantityPurchased,
      totalPrice,
      onChainOrderId,
      shippingAddress
    } = req.body;

    // Validate required fields
    if (!buyerId || !productId || !quantityPurchased || !totalPrice) {
      return res.status(400).json({
        error: 'Buyer ID, product ID, quantity, and total price are required'
      });
    }

    // Validate buyer exists
    const buyer = await prisma.user.findUnique({
      where: { id: parseInt(buyerId) }
    });

    if (!buyer) {
      return res.status(404).json({
        error: 'Buyer not found'
      });
    }

    // Validate product exists and has sufficient quantity
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            walletAddress: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    if (product.status !== 'Available') {
      return res.status(400).json({
        error: 'Product is not available for purchase'
      });
    }

    if (product.quantity < parseInt(quantityPurchased)) {
      return res.status(400).json({
        error: 'Insufficient product quantity available'
      });
    }

    // Prevent self-purchase
    if (product.sellerId === parseInt(buyerId)) {
      return res.status(400).json({
        error: 'Cannot purchase your own product'
      });
    }

    // Create order and update product quantity in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          buyerId: parseInt(buyerId),
          productId: parseInt(productId),
          quantityPurchased: parseInt(quantityPurchased),
          totalPrice: parseFloat(totalPrice),
          onChainOrderId: onChainOrderId ? parseInt(onChainOrderId) : null,
          shippingAddress,
          status: 'Pending'
        },
        include: {
          buyer: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              email: true
            }
          },
          product: {
            include: {
              seller: {
                select: {
                  id: true,
                  username: true,
                  walletAddress: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Update product quantity
      await tx.product.update({
        where: { id: parseInt(productId) },
        data: {
          quantity: {
            decrement: parseInt(quantityPurchased)
          }
        }
      });

      return order;
    });

    res.status(201).json({
      message: 'Order created successfully',
      order: result
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get all orders with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      buyerId,
      sellerId,
      productId,
      status,
      startDate,
      endDate
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (buyerId) {
      where.buyerId = parseInt(buyerId);
    }

    if (productId) {
      where.productId = parseInt(productId);
    }

    if (sellerId) {
      where.product = {
        sellerId: parseInt(sellerId)
      };
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        include: {
          buyer: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              email: true
            }
          },
          product: {
            include: {
              seller: {
                select: {
                  id: true,
                  username: true,
                  walletAddress: true,
                  email: true
                }
              }
            }
          },
          shipment: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return res.status(400).json({
        error: 'Invalid order ID'
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            email: true,
            profileImageUrl: true
          }
        },
        product: {
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                walletAddress: true,
                email: true,
                profileImageUrl: true
              }
            }
          }
        },
        shipment: {
          include: {
            transporter: {
              select: {
                id: true,
                username: true,
                walletAddress: true,
                email: true
              }
            }
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                username: true,
                profileImageUrl: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId } = req.body;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return res.status(400).json({
        error: 'Invalid order ID'
      });
    }

    if (!status) {
      return res.status(400).json({
        error: 'Status is required'
      });
    }

    // Validate status
    const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'InTransit', 'Delivered', 'Completed', 'Cancelled', 'Disputed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status'
      });
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: {
          include: {
            seller: true
          }
        },
        buyer: true
      }
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    // Authorization check - only buyer, seller, or transporter can update status
    const isAuthorized = userId && (
      existingOrder.buyerId === parseInt(userId) ||
      existingOrder.product.sellerId === parseInt(userId)
    );

    if (!isAuthorized) {
      return res.status(403).json({
        error: 'Unauthorized to update this order'
      });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            email: true
          }
        },
        product: {
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                walletAddress: true,
                email: true
              }
            }
          }
        },
        shipment: true
      }
    });

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Cancel order
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, reason } = req.body;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return res.status(400).json({
        error: 'Invalid order ID'
      });
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true
      }
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    // Check if order can be cancelled
    if (!['Pending', 'Confirmed'].includes(existingOrder.status)) {
      return res.status(400).json({
        error: 'Order cannot be cancelled in current status'
      });
    }

    // Authorization check
    const isAuthorized = userId && (
      existingOrder.buyerId === parseInt(userId) ||
      existingOrder.product.sellerId === parseInt(userId)
    );

    if (!isAuthorized) {
      return res.status(403).json({
        error: 'Unauthorized to cancel this order'
      });
    }

    // Cancel order and restore product quantity in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update order status to cancelled
      const cancelledOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'Cancelled',
          cancellationReason: reason
        },
        include: {
          buyer: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              email: true
            }
          },
          product: {
            include: {
              seller: {
                select: {
                  id: true,
                  username: true,
                  walletAddress: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Restore product quantity
      await tx.product.update({
        where: { id: existingOrder.productId },
        data: {
          quantity: {
            increment: existingOrder.quantityPurchased
          }
        }
      });

      return cancelledOrder;
    });

    res.json({
      message: 'Order cancelled successfully',
      order: result
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get order statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { userId, userRole } = req.query;

    let whereClause = {};
    
    if (userId && userRole === 'Buyer') {
      whereClause.buyerId = parseInt(userId);
    } else if (userId && userRole === 'Seller') {
      whereClause.product = {
        sellerId: parseInt(userId)
      };
    }

    const [totalOrders, pendingOrders, completedOrders, cancelledOrders, totalRevenue] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.count({ where: { ...whereClause, status: 'Pending' } }),
      prisma.order.count({ where: { ...whereClause, status: 'Completed' } }),
      prisma.order.count({ where: { ...whereClause, status: 'Cancelled' } }),
      prisma.order.aggregate({
        where: { ...whereClause, status: 'Completed' },
        _sum: {
          totalPrice: true
        }
      })
    ]);

    res.json({
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue: totalRevenue._sum.totalPrice || 0
      }
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Checkout cart - convert all cart items to orders
router.post('/checkout', async (req, res) => {
  try {
    const { buyerId, shippingAddress, paymentMethod } = req.body;

    // Validate required fields
    if (!buyerId) {
      return res.status(400).json({
        error: 'Buyer ID is required'
      });
    }

    // Get cart items for the user
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: parseInt(buyerId) },
      include: {
        product: {
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                walletAddress: true
              }
            }
          }
        }
      }
    });

    if (cartItems.length === 0) {
      return res.status(400).json({
        error: 'Cart is empty'
      });
    }

    // Validate all products are available and user has sufficient quantity
    for (const item of cartItems) {
      if (item.product.status !== 'Available') {
        return res.status(400).json({
          error: `Product "${item.product.name}" is not available for purchase`
        });
      }

      if (item.product.quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient quantity for product "${item.product.name}". Available: ${item.product.quantity}, Requested: ${item.quantity}`
        });
      }

      // Prevent self-purchase
      if (item.product.sellerId === parseInt(buyerId)) {
        return res.status(400).json({
          error: `Cannot purchase your own product "${item.product.name}"`
        });
      }
    }

    // Create orders and update product quantities in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const orders = [];

      for (const item of cartItems) {
        // Calculate total price using priceEth or price
        const unitPrice = item.product.priceEth || item.product.price || 0;
        const totalPrice = unitPrice * item.quantity;

        // Create order
        const order = await tx.order.create({
          data: {
            buyerId: parseInt(buyerId),
            productId: item.productId,
            quantityPurchased: item.quantity,
            totalPrice: totalPrice,
            shippingAddress: shippingAddress || null,
            status: 'Pending'
          },
          include: {
            buyer: {
              select: {
                id: true,
                username: true,
                walletAddress: true,
                email: true
              }
            },
            product: {
              include: {
                seller: {
                  select: {
                    id: true,
                    username: true,
                    walletAddress: true,
                    email: true
                  }
                }
              }
            }
          }
        });

        // Update product quantity
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });

        orders.push(order);
      }

      // Clear the cart
      await tx.cartItem.deleteMany({
        where: { userId: parseInt(buyerId) }
      });

      return orders;
    });

    // Calculate total amount
    const totalAmount = result.reduce((sum, order) => sum + order.totalPrice, 0);

    res.status(201).json({
      message: 'Checkout completed successfully',
      orders: result,
      totalAmount: totalAmount,
      orderCount: result.length,
      paymentMethod: paymentMethod || 'ETH'
    });
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({
      error: 'Internal server error during checkout'
    });
  }
});

module.exports = router;
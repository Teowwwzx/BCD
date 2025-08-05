const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Create a new shipment
router.post('/', async (req, res) => {
  try {
    const {
      orderId,
      transporterId,
      trackingNumber,
      estimatedDeliveryDate,
      shippingMethod,
      shippingCost
    } = req.body;

    // Validate required fields
    if (!orderId || !transporterId) {
      return res.status(400).json({
        error: 'Order ID and transporter ID are required'
      });
    }

    // Validate order exists and is in correct status
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        product: {
          include: {
            seller: true
          }
        },
        buyer: true
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    if (!['Confirmed', 'Shipped'].includes(order.status)) {
      return res.status(400).json({
        error: 'Order must be confirmed before creating shipment'
      });
    }

    // Validate transporter exists
    const transporter = await prisma.user.findUnique({
      where: { 
        id: parseInt(transporterId),
        userRole: 'Transporter'
      }
    });

    if (!transporter) {
      return res.status(404).json({
        error: 'Transporter not found or user is not a transporter'
      });
    }

    // Check if shipment already exists for this order
    const existingShipment = await prisma.shipment.findUnique({
      where: { orderId: parseInt(orderId) }
    });

    if (existingShipment) {
      return res.status(400).json({
        error: 'Shipment already exists for this order'
      });
    }

    // Create shipment and update order status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the shipment
      const shipment = await tx.shipment.create({
        data: {
          orderId: parseInt(orderId),
          transporterId: parseInt(transporterId),
          trackingNumber,
          estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
          shippingMethod,
          shippingCost: shippingCost ? parseFloat(shippingCost) : null,
          status: 'Pending'
        },
        include: {
          order: {
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
          },
          transporter: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              email: true
            }
          }
        }
      });

      // Update order status to shipped if not already
      if (order.status !== 'Shipped') {
        await tx.order.update({
          where: { id: parseInt(orderId) },
          data: { status: 'Shipped' }
        });
      }

      return shipment;
    });

    res.status(201).json({
      message: 'Shipment created successfully',
      shipment: result
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get all shipments with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      transporterId,
      orderId,
      status,
      trackingNumber
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (transporterId) {
      where.transporterId = parseInt(transporterId);
    }

    if (orderId) {
      where.orderId = parseInt(orderId);
    }

    if (status) {
      where.status = status;
    }

    if (trackingNumber) {
      where.trackingNumber = {
        contains: trackingNumber,
        mode: 'insensitive'
      };
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take,
        include: {
          order: {
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
          },
          transporter: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.shipment.count({ where })
    ]);

    res.json({
      shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get shipment by tracking number
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    if (!trackingNumber) {
      return res.status(400).json({
        error: 'Tracking number is required'
      });
    }

    const shipment = await prisma.shipment.findFirst({
      where: { trackingNumber },
      include: {
        order: {
          include: {
            buyer: {
              select: {
                id: true,
                username: true,
                walletAddress: true
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            }
          }
        },
        transporter: {
          select: {
            id: true,
            username: true,
            walletAddress: true
          }
        }
      }
    });

    if (!shipment) {
      return res.status(404).json({
        error: 'Shipment not found with this tracking number'
      });
    }

    res.json({ shipment });
  } catch (error) {
    console.error('Error tracking shipment:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get shipment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const shipmentId = parseInt(id);

    if (isNaN(shipmentId)) {
      return res.status(400).json({
        error: 'Invalid shipment ID'
      });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
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
            }
          }
        },
        transporter: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            email: true,
            profileImageUrl: true
          }
        }
      }
    });

    if (!shipment) {
      return res.status(404).json({
        error: 'Shipment not found'
      });
    }

    res.json({ shipment });
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update shipment status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId, location, notes } = req.body;
    const shipmentId = parseInt(id);

    if (isNaN(shipmentId)) {
      return res.status(400).json({
        error: 'Invalid shipment ID'
      });
    }

    if (!status) {
      return res.status(400).json({
        error: 'Status is required'
      });
    }

    // Validate status
    const validStatuses = ['Pending', 'PickedUp', 'InTransit', 'OutForDelivery', 'Delivered', 'Failed', 'Returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status'
      });
    }

    // Check if shipment exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        transporter: true,
        order: {
          include: {
            product: {
              include: {
                seller: true
              }
            }
          }
        }
      }
    });

    if (!existingShipment) {
      return res.status(404).json({
        error: 'Shipment not found'
      });
    }

    // Authorization check - only transporter or seller can update status
    const isAuthorized = userId && (
      existingShipment.transporterId === parseInt(userId) ||
      existingShipment.order.product.sellerId === parseInt(userId)
    );

    if (!isAuthorized) {
      return res.status(403).json({
        error: 'Unauthorized to update this shipment'
      });
    }

    // Update shipment and order status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update shipment status
      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status,
          currentLocation: location,
          deliveryNotes: notes,
          ...(status === 'Delivered' && { actualDeliveryDate: new Date() })
        },
        include: {
          order: {
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
          },
          transporter: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              email: true
            }
          }
        }
      });

      // Update order status based on shipment status
      let orderStatus = existingShipment.order.status;
      if (status === 'InTransit' || status === 'OutForDelivery') {
        orderStatus = 'InTransit';
      } else if (status === 'Delivered') {
        orderStatus = 'Delivered';
      }

      if (orderStatus !== existingShipment.order.status) {
        await tx.order.update({
          where: { id: existingShipment.orderId },
          data: { status: orderStatus }
        });
      }

      return updatedShipment;
    });

    res.json({
      message: 'Shipment status updated successfully',
      shipment: result
    });
  } catch (error) {
    console.error('Error updating shipment status:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update shipment details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      trackingNumber,
      estimatedDeliveryDate,
      shippingMethod,
      shippingCost,
      userId
    } = req.body;
    const shipmentId = parseInt(id);

    if (isNaN(shipmentId)) {
      return res.status(400).json({
        error: 'Invalid shipment ID'
      });
    }

    // Check if shipment exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        transporter: true,
        order: {
          include: {
            product: {
              include: {
                seller: true
              }
            }
          }
        }
      }
    });

    if (!existingShipment) {
      return res.status(404).json({
        error: 'Shipment not found'
      });
    }

    // Authorization check
    const isAuthorized = userId && (
      existingShipment.transporterId === parseInt(userId) ||
      existingShipment.order.product.sellerId === parseInt(userId)
    );

    if (!isAuthorized) {
      return res.status(403).json({
        error: 'Unauthorized to update this shipment'
      });
    }

    // Update shipment
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        ...(trackingNumber && { trackingNumber }),
        ...(estimatedDeliveryDate && { estimatedDeliveryDate: new Date(estimatedDeliveryDate) }),
        ...(shippingMethod && { shippingMethod }),
        ...(shippingCost && { shippingCost: parseFloat(shippingCost) })
      },
      include: {
        order: {
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
        },
        transporter: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Shipment updated successfully',
      shipment: updatedShipment
    });
  } catch (error) {
    console.error('Error updating shipment:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get shipment statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { transporterId } = req.query;

    let whereClause = {};
    if (transporterId) {
      whereClause.transporterId = parseInt(transporterId);
    }

    const [totalShipments, pendingShipments, inTransitShipments, deliveredShipments] = await Promise.all([
      prisma.shipment.count({ where: whereClause }),
      prisma.shipment.count({ where: { ...whereClause, status: 'Pending' } }),
      prisma.shipment.count({ where: { ...whereClause, status: { in: ['InTransit', 'OutForDelivery'] } } }),
      prisma.shipment.count({ where: { ...whereClause, status: 'Delivered' } })
    ]);

    res.json({
      stats: {
        totalShipments,
        pendingShipments,
        inTransitShipments,
        deliveredShipments
      }
    });
  } catch (error) {
    console.error('Error fetching shipment statistics:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
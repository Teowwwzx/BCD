/**
 * =================================================================
 * API DOCUMENTATION: /api/shipments
 * =================================================================
 *
 * METHOD   | URL               | DESCRIPTION
 * ---------|-------------------|----------------------------------
 * POST     | /                 | Create a new shipment for an order.
 * GET      | /                 | Get all shipments (with filtering).
 * GET      | /:id              | Get a single shipment by its ID.
 * PUT      | /:id              | Update an existing shipment.
 * DELETE   | /:id              | Delete a shipment.
 *
 * =================================================================
 *
 * REQUEST/RESPONSE FORMATS
 *
 * --- POST / ---
 * Request Body:
 * {
 *   "orderId": 123,
 *   "carrier": "FedEx",
 *   "trackingNumber": "1234567890",
 *   "shippingMethod": "express"
 * }
 *
 * --- PUT /:id ---
 * Request Body:
 * {
 *   "carrier": "UPS",
 *   "trackingNumber": "0987654321",
 *   "status": "in_transit"
 * }
 *
 * --- GET / Query Parameters ---
 * ?page=1&limit=10&status=in_transit&orderId=123
 *
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// ----------------------------------------------------------------
// CREATE - Create a new shipment for an order
// ----------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { orderId, carrier, trackingNumber, shippingMethod } = req.body;

    // Validate required fields
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required.' });
    }

    const orderIdInt = parseInt(orderId);
    if (isNaN(orderIdInt)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID format.' });
    }

    // Validate other required fields
    if (!carrier || !trackingNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Carrier and tracking number are required.' 
      });
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderIdInt }
    });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // Check if shipment already exists for this order
    const existingShipment = await prisma.shipment.findUnique({
      where: { orderId: orderIdInt }
    });
    if (existingShipment) {
      return res.status(409).json({ 
        success: false, 
        error: 'A shipment already exists for this order.' 
      });
    }

    // Validate shipping method if provided
    if (shippingMethod) {
      const validMethods = ['standard', 'express', 'overnight', 'economy'];
      if (!validMethods.includes(shippingMethod)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid shipping method.' 
        });
      }
    }

    // Use a transaction to create the shipment and update the order's status
    const newShipment = await prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          orderId: orderIdInt,
          carrier,
          trackingNumber,
          shipping_method: shippingMethod || 'standard',
          status: 'picked_up'
        },
        include: {
          order: {
            select: {
              id: true,
              order_status: true,
              users: {
                select: { id: true, username: true }
              }
            }
          }
        }
      });

      await tx.order.update({
        where: { id: orderIdInt },
        data: { order_status: 'shipped' }
      });

      return shipment;
    });

    res.status(201).json({ 
      success: true, 
      data: newShipment 
    });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(404).json({ 
        success: false, 
        error: 'The specified Order ID does not exist.' 
      });
    }
    console.error('Error creating shipment:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ----------------------------------------------------------------
// READ ALL - Get all shipments with filtering and pagination
// ----------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, orderId } = req.query;

    // Validate pagination parameters
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    if (isNaN(pageInt) || isNaN(limitInt) || pageInt < 1 || limitInt < 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid pagination parameters.' 
      });
    }

    const skip = (pageInt - 1) * limitInt;

    // Build where clause for filtering
    const where = {};
    if (status) {
      const validStatuses = ['picked_up', 'in_transit', 'delivered', 'returned'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid status value.' 
        });
      }
      where.status = status;
    }
    if (orderId) {
      const orderIdInt = parseInt(orderId);
      if (isNaN(orderIdInt)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid order ID format.' 
        });
      }
      where.orderId = orderIdInt;
    }

    // Fetch shipments and total count
    const [shipments, total] = await prisma.$transaction([
      prisma.shipment.findMany({
        where,
        skip,
        take: limitInt,
        include: {
          order: {
            select: {
              id: true,
              order_status: true,
              totalAmount: true,
              users: { 
                select: { id: true, username: true, email: true } 
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.shipment.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        shipments,
        pagination: {
          page: pageInt,
          limit: limitInt,
          total,
          pages: Math.ceil(total / limitInt),
          hasMore: skip + limitInt < total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});


// ----------------------------------------------------------------
// READ BY ID - Get a single shipment by its ID
// ----------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const shipmentId = parseInt(id);

    // Validate shipment ID
    if (isNaN(shipmentId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid shipment ID format.' 
      });
    }

    // Fetch shipment with related data
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          select: {
            id: true,
            order_status: true,
            totalAmount: true,
            createdAt: true,
            users: {
              select: { 
                id: true, 
                username: true, 
                email: true,
                profileImageUrl: true 
              }
            },
            orderItems: {
              select: {
                id: true,
                quantity: true,
                price: true,
                products: {
                  select: {
                    id: true,
                    name: true,
                    images: {
                      select: {
                        imageUrl: true,
                        altText: true
                      },
                      take: 1
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!shipment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Shipment not found.' 
      });
    }

    res.status(200).json({ success: true, data: shipment });
  } catch (error) {
    console.error(`Error fetching shipment ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});


// ----------------------------------------------------------------
// UPDATE - Update an existing shipment
// ----------------------------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { carrier, trackingNumber, status, shipping_method } = req.body;
    const shipmentId = parseInt(id);

    // Validate shipment ID
    if (isNaN(shipmentId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid shipment ID format.' 
      });
    }

    // Check if shipment exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { id: shipmentId }
    });

    if (!existingShipment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Shipment not found.' 
      });
    }

    // Build update data object
    const dataToUpdate = {
      updatedAt: new Date()
    };

    // Validate and add fields if provided
    if (carrier !== undefined) {
      if (!carrier.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Carrier cannot be empty.' 
        });
      }
      dataToUpdate.carrier = carrier;
    }

    if (trackingNumber !== undefined) {
      if (!trackingNumber.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tracking number cannot be empty.' 
        });
      }
      dataToUpdate.trackingNumber = trackingNumber;
    }

    if (status !== undefined) {
      const validStatuses = ['picked_up', 'in_transit', 'delivered', 'returned'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid status value.' 
        });
      }
      dataToUpdate.status = status;
    }

    if (shipping_method !== undefined) {
      const validMethods = ['standard', 'express', 'overnight', 'economy'];
      if (!validMethods.includes(shipping_method)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid shipping method.' 
        });
      }
      dataToUpdate.shipping_method = shipping_method;
    }

    // Use transaction to update shipment and order status if needed
    const updatedShipment = await prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: dataToUpdate,
        include: {
          order: {
            select: {
              id: true,
              order_status: true,
              users: {
                select: { id: true, username: true }
              }
            }
          }
        }
      });

      // Update the parent order's status if the shipment is delivered
      if (status === 'delivered') {
        await tx.order.update({
          where: { id: shipment.orderId },
          data: { order_status: 'delivered' }
        });
      }

      return shipment;
    });

    res.status(200).json({ 
      success: true, 
      data: updatedShipment 
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: 'Shipment not found.' 
      });
    }
    console.error(`Error updating shipment ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ----------------------------------------------------------------
// DELETE - Delete a shipment
// ----------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const shipmentId = parseInt(id);

    // Validate shipment ID
    if (isNaN(shipmentId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid shipment ID format.' 
      });
    }

    // Check if shipment exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { id: shipmentId }
    });

    if (!existingShipment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Shipment not found.' 
      });
    }

    // Use transaction to delete shipment and update order status
    await prisma.$transaction(async (tx) => {
      // Delete the shipment
      await tx.shipment.delete({
        where: { id: shipmentId }
      });

      // Update the order status back to confirmed
      await tx.order.update({
        where: { id: existingShipment.orderId },
        data: { order_status: 'confirmed' }
      });
    });

    res.status(200).json({ 
      success: true, 
      message: 'Shipment deleted successfully.' 
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: 'Shipment not found.' 
      });
    }
    console.error(`Error deleting shipment ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});


module.exports = router;
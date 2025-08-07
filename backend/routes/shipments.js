const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// POST /api/shipments - Create a new shipment for an order
router.post('/', async (req, res) => {
  try {
    const { orderId, carrier, trackingNumber, shippingMethod } = req.body;
    const orderIdInt = parseInt(orderId);

    if (!orderIdInt) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    // Check if shipment already exists for this order (shipment has a UNIQUE constraint on orderId)
    const existingShipment = await prisma.shipment.findUnique({
      where: { orderId: orderIdInt }
    });
    if (existingShipment) {
      return res.status(409).json({ success: false, error: 'A shipment already exists for this order' });
    }

    // Use a transaction to create the shipment and update the order's status
    const newShipment = await prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          orderId: orderIdInt,
          carrier,
          trackingNumber: trackingNumber,
          shipping_method: shippingMethod,
          status: 'picked_up'
        }
      });

      await tx.order.update({
        where: { id: orderIdInt },
        data: { order_status: 'shipped' }
      });

      return shipment;
    });

    res.status(201).json({ success: true, message: 'Shipment created successfully', data: newShipment });
  } catch (error) {
    console.error('Error creating shipment:', error);
    if (error.code === 'P2003') { // Foreign key constraint failed
        return res.status(404).json({ success: false, error: 'The specified Order ID does not exist.' });
    }
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/shipments - Get all shipments with filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, orderId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (orderId) where.orderId = parseInt(orderId);

    const [shipments, total] = await prisma.$transaction([
      prisma.shipment.findMany({
        where,
        skip,
        take,
        include: {
          order: {
            include: {
              users: { select: { id: true, username: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.shipment.count({ where })
    ]);

    res.json({
      success: true,
      data: shipments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// GET /api/shipments/:id - Get a single shipment by its ID
router.get('/:id', async (req, res) => {
  try {
    const shipmentId = parseInt(req.params.id);
    if (isNaN(shipmentId)) {
      return res.status(400).json({ success: false, error: 'Invalid shipment ID' });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: { include: { users: true, orderItems: true } }
      }
    });

    if (!shipment) {
      return res.status(404).json({ success: false, error: 'Shipment not found' });
    }
    res.json({ success: true, data: shipment });
  } catch (error) {
    console.error(`Error fetching shipment ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// PUT /api/shipments/:id - Update a shipment's details (e.g., tracking number)
router.put('/:id', async (req, res) => {
  try {
    const shipmentId = parseInt(req.params.id);
    if (isNaN(shipmentId)) {
      return res.status(400).json({ success: false, error: 'Invalid shipment ID' });
    }

    const { carrier, trackingNumber, status } = req.body;
    
    const dataToUpdate = {};
    if (carrier !== undefined) dataToUpdate.carrier = carrier;
    if (trackingNumber !== undefined) dataToUpdate.trackingNumber = trackingNumber;
    if (status !== undefined) dataToUpdate.status = status;

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: dataToUpdate
    });
    
    // Also update the parent order's status if the shipment is delivered
    if (status === 'delivered') {
        await prisma.order.update({
            where: { id: updatedShipment.orderId },
            data: { order_status: 'delivered' }
        });
    }

    res.json({ success: true, message: 'Shipment updated successfully', data: updatedShipment });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Shipment not found' });
    }
    console.error(`Error updating shipment ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/shipments/:id - Delete a shipment
router.delete('/:id', async (req, res) => {
  try {
    const shipmentId = parseInt(req.params.id);
    if (isNaN(shipmentId)) {
      return res.status(400).json({ success: false, error: 'Invalid shipment ID' });
    }

    // Use Prisma to delete the shipment with the matching ID
    await prisma.shipment.delete({
      where: { id: shipmentId },
    });

    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) {
    // Handle the case where the shipment to be deleted is not found
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Shipment not found.' });
    }
    console.error(`Error deleting shipment ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


module.exports = router;
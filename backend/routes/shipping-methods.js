/**
 * =================================================================
 * API DOCUMENTATION: /api/shipping-methods
 * =================================================================
 *
 * METHOD   | URL               | DESCRIPTION
 * ---------|-------------------|----------------------------------
 * POST     | /                 | Create a new shipping method (admin only).
 * GET      | /                 | Get all active shipping methods.
 * GET      | /:id              | Get a single shipping method by ID.
 * PUT      | /:id              | Update an existing shipping method (admin only).
 * DELETE   | /:id              | Delete a shipping method (admin only).
 * POST     | /calculate        | Calculate shipping cost for order.
 *
 * =================================================================
 *
 * REQUEST/RESPONSE FORMATS
 *
 * --- POST / ---
 * Request Body:
 * {
 *     "name": "Express Delivery",
 *     "description": "Fast delivery within 1-2 business days",
 *     "baseRate": "15.00",
 *     "perKgRate": "2.50",
 *     "perKmRate": "0.10",
 *     "minDeliveryDays": 1,
 *     "maxDeliveryDays": 2
 * }
 *
 * --- PUT /:id ---
 * Request Body:
 * {
 *     "name": "Updated Express Delivery",
 *     "baseRate": "18.00",
 *     "isActive": false
 * }
 *
 * --- POST /calculate ---
 * Request Body:
 * {
 *     "shippingMethodId": 1,
 *     "totalWeight": 2.5,
 *     "distance": 150,
 *     "destinationPostcode": "10001"
 * }
 *
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// ----------------------------------------------------------------
// CREATE - Create a new shipping method (admin only)
// ----------------------------------------------------------------
router.post('/', async (req, res) => {
    try {
        const {
            name,
            description,
            baseRate,
            perKgRate,
            perKmRate,
            minDeliveryDays,
            maxDeliveryDays,
            isActive = true
        } = req.body;

        // Validate required fields
        if (!name || !baseRate || !minDeliveryDays || !maxDeliveryDays) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, baseRate, minDeliveryDays, maxDeliveryDays'
            });
        }

        // Validate delivery days
        if (minDeliveryDays < 0 || maxDeliveryDays < minDeliveryDays) {
            return res.status(400).json({
                success: false,
                error: 'Invalid delivery days: maxDeliveryDays must be >= minDeliveryDays >= 0'
            });
        }

        // Validate rates
        if (parseFloat(baseRate) < 0) {
            return res.status(400).json({
                success: false,
                error: 'Base rate must be >= 0'
            });
        }

        const newShippingMethod = await prisma.shippingMethod.create({
            data: {
                name,
                description,
                baseRate: parseFloat(baseRate),
                perKgRate: perKgRate ? parseFloat(perKgRate) : null,
                perKmRate: perKmRate ? parseFloat(perKmRate) : null,
                minDeliveryDays: parseInt(minDeliveryDays),
                maxDeliveryDays: parseInt(maxDeliveryDays),
                isActive
            }
        });

        res.status(201).json({
            success: true,
            message: 'Shipping method created successfully',
            data: newShippingMethod
        });
    } catch (error) {
        console.error('Error creating shipping method:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                error: 'Shipping method name already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ----------------------------------------------------------------
// READ ALL - Get all active shipping methods
// ----------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const { includeInactive = 'false' } = req.query;
        const showInactive = includeInactive.toLowerCase() === 'true';

        const whereClause = showInactive ? {} : { isActive: true };

        const shippingMethods = await prisma.shippingMethod.findMany({
            where: whereClause,
            orderBy: [
                { isActive: 'desc' },
                { minDeliveryDays: 'asc' },
                { baseRate: 'asc' }
            ]
        });

        res.status(200).json({
            success: true,
            data: shippingMethods,
            count: shippingMethods.length
        });
    } catch (error) {
        console.error('Error fetching shipping methods:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ----------------------------------------------------------------
// READ BY ID - Get a single shipping method by ID
// ----------------------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const shippingMethodId = parseInt(id);

        if (isNaN(shippingMethodId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid shipping method ID'
            });
        }

        const shippingMethod = await prisma.shippingMethod.findUnique({
            where: { id: shippingMethodId }
        });

        if (!shippingMethod) {
            return res.status(404).json({
                success: false,
                error: 'Shipping method not found'
            });
        }

        res.status(200).json({
            success: true,
            data: shippingMethod
        });
    } catch (error) {
        console.error('Error fetching shipping method:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ----------------------------------------------------------------
// UPDATE - Update an existing shipping method (admin only)
// ----------------------------------------------------------------
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const shippingMethodId = parseInt(id);

        if (isNaN(shippingMethodId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid shipping method ID'
            });
        }

        const {
            name,
            description,
            baseRate,
            perKgRate,
            perKmRate,
            minDeliveryDays,
            maxDeliveryDays,
            isActive
        } = req.body;

        // Check if shipping method exists
        const existingMethod = await prisma.shippingMethod.findUnique({
            where: { id: shippingMethodId }
        });

        if (!existingMethod) {
            return res.status(404).json({
                success: false,
                error: 'Shipping method not found'
            });
        }

        // Validate delivery days if provided
        if (minDeliveryDays !== undefined && maxDeliveryDays !== undefined) {
            if (minDeliveryDays < 0 || maxDeliveryDays < minDeliveryDays) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid delivery days: maxDeliveryDays must be >= minDeliveryDays >= 0'
                });
            }
        }

        // Validate base rate if provided
        if (baseRate !== undefined && parseFloat(baseRate) < 0) {
            return res.status(400).json({
                success: false,
                error: 'Base rate must be >= 0'
            });
        }

        // Build update data
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (baseRate !== undefined) updateData.baseRate = parseFloat(baseRate);
        if (perKgRate !== undefined) updateData.perKgRate = perKgRate ? parseFloat(perKgRate) : null;
        if (perKmRate !== undefined) updateData.perKmRate = perKmRate ? parseFloat(perKmRate) : null;
        if (minDeliveryDays !== undefined) updateData.minDeliveryDays = parseInt(minDeliveryDays);
        if (maxDeliveryDays !== undefined) updateData.maxDeliveryDays = parseInt(maxDeliveryDays);
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedShippingMethod = await prisma.shippingMethod.update({
            where: { id: shippingMethodId },
            data: updateData
        });

        res.status(200).json({
            success: true,
            message: 'Shipping method updated successfully',
            data: updatedShippingMethod
        });
    } catch (error) {
        console.error('Error updating shipping method:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                error: 'Shipping method name already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ----------------------------------------------------------------
// DELETE - Delete a shipping method (admin only)
// ----------------------------------------------------------------
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const shippingMethodId = parseInt(id);

        if (isNaN(shippingMethodId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid shipping method ID'
            });
        }

        // Check if shipping method exists
        const existingMethod = await prisma.shippingMethod.findUnique({
            where: { id: shippingMethodId }
        });

        if (!existingMethod) {
            return res.status(404).json({
                success: false,
                error: 'Shipping method not found'
            });
        }

        // Instead of hard delete, we'll soft delete by setting isActive to false
        const deletedShippingMethod = await prisma.shippingMethod.update({
            where: { id: shippingMethodId },
            data: { isActive: false }
        });

        res.status(200).json({
            success: true,
            message: 'Shipping method deactivated successfully',
            data: deletedShippingMethod
        });
    } catch (error) {
        console.error('Error deleting shipping method:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ----------------------------------------------------------------
// CALCULATE - Calculate shipping cost for order
// ----------------------------------------------------------------
router.post('/calculate', async (req, res) => {
    try {
        const {
            shippingMethodId,
            totalWeight = 0,
            distance = 0,
            destinationPostcode
        } = req.body;

        // Validate required fields
        if (!shippingMethodId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: shippingMethodId'
            });
        }

        const methodId = parseInt(shippingMethodId);
        if (isNaN(methodId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid shipping method ID'
            });
        }

        // Get shipping method
        const shippingMethod = await prisma.shippingMethod.findUnique({
            where: { id: methodId }
        });

        if (!shippingMethod || !shippingMethod.isActive) {
            return res.status(404).json({
                success: false,
                error: 'Shipping method not found or inactive'
            });
        }

        // Calculate shipping cost
        let totalCost = parseFloat(shippingMethod.base_rate);

        // Add weight-based cost
        if (shippingMethod.per_kg_rate && totalWeight > 0) {
            totalCost += parseFloat(shippingMethod.per_kg_rate) * parseFloat(totalWeight);
        }

        // Add distance-based cost
        if (shippingMethod.per_km_rate && distance > 0) {
            totalCost += parseFloat(shippingMethod.per_km_rate) * parseFloat(distance);
        }

        // Round to 2 decimal places
        totalCost = Math.round(totalCost * 100) / 100;

        res.status(200).json({
            success: true,
            data: {
                shippingMethod: {
                    id: shippingMethod.id,
                    name: shippingMethod.name,
                    description: shippingMethod.description,
                    min_delivery_days: shippingMethod.minDeliveryDays,
                    max_delivery_days: shippingMethod.maxDeliveryDays
                },
                calculation: {
                    base_rate: parseFloat(shippingMethod.base_rate),
                    weight_cost: shippingMethod.per_kg_rate ? parseFloat(shippingMethod.per_kg_rate) * parseFloat(totalWeight) : 0,
                    distance_cost: shippingMethod.per_km_rate ? parseFloat(shippingMethod.per_km_rate) * parseFloat(distance) : 0,
                    total_cost: totalCost,
                    total_weight: parseFloat(totalWeight),
                    distance: parseFloat(distance)
                }
            }
        });
    } catch (error) {
        console.error('Error calculating shipping cost:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;
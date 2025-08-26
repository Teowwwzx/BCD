/**
 * =================================================================
 * API DOCUMENTATION: /api/coupons
 * =================================================================
 *
 * METHOD   | URL               | DESCRIPTION
 * ---------|-------------------|----------------------------------
 * POST     | /                 | Create a new coupon (admin only).
 * GET      | /                 | Get all coupons (with filtering).
 * GET      | /:id              | Get a single coupon by ID.
 * PUT      | /:id              | Update an existing coupon (admin only).
 * DELETE   | /:id              | Delete a coupon (admin only).
 * POST     | /validate         | Validate a coupon code for order.
 * POST     | /apply            | Apply coupon to calculate discount.
 *
 * =================================================================
 *
 * REQUEST/RESPONSE FORMATS
 *
 * --- POST / ---
 * Request Body:
 * {
 *     "code": "SAVE20",
 *     "description": "20% off on all items",
 *     "discount_type": "percentage",
 *     "discount_value": "20.00",
 *     "minimum_order_amount": "100.00",
 *     "maximum_discount_amount": "50.00",
 *     "usageLimit": 100,
 *     "user_usage_limit": 1,
 *     "valid_from": "2024-01-01T00:00:00Z",
 *     "valid_until": "2024-12-31T23:59:59Z"
 * }
 *
 * --- PUT /:id ---
 * Request Body:
 * {
 *     "description": "Updated description",
 *     "status": "inactive",
 *     "usageLimit": 200
 * }
 *
 * --- POST /validate ---
 * Request Body:
 * {
 *     "code": "SAVE20",
 *     "userId": 1,
 *     "orderAmount": "150.00"
 * }
 *
 * --- POST /apply ---
 * Request Body:
 * {
 *     "code": "SAVE20",
 *     "orderAmount": "150.00"
 * }
 *
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// ----------------------------------------------------------------
// CREATE - Create a new coupon (admin only)
// ----------------------------------------------------------------
router.post('/', async (req, res) => {
    try {
        const {
            code,
            description,
            discount_type,
            discount_value,
            minimum_order_amount,
            maximum_discount_amount,
            usageLimit,
            user_usage_limit = 1,
            valid_from,
            valid_until,
            status = 'active'
        } = req.body;

        // Validate required fields
        if (!code || !discount_type || !discount_value || !valid_from || !valid_until) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, discount_type, discount_value, valid_from, valid_until'
            });
        }

        // Validate discount type
        if (!['percentage', 'fixed_amount'].includes(discount_type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid discount_type. Must be "percentage" or "fixed_amount"'
            });
        }

        // Validate discount value
        const discountVal = parseFloat(discount_value);
        if (discountVal <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Discount value must be greater than 0'
            });
        }

        if (discount_type === 'percentage' && discountVal > 100) {
            return res.status(400).json({
                success: false,
                error: 'Percentage discount cannot exceed 100%'
            });
        }

        // Validate dates
        const validFrom = new Date(valid_from);
        const validUntil = new Date(valid_until);
        
        if (validFrom >= validUntil) {
            return res.status(400).json({
                success: false,
                error: 'valid_until must be after valid_from'
            });
        }

        const newCoupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                description,
                discount_type,
                discount_value: discountVal,
                minimum_order_amount: minimum_order_amount ? parseFloat(minimum_order_amount) : null,
                maximum_discount_amount: maximum_discount_amount ? parseFloat(maximum_discount_amount) : null,
                usageLimit,
                user_usage_limit,
                status,
                valid_from: validFrom,
                valid_until: validUntil
            }
        });

        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            data: newCoupon
        });
    } catch (error) {
        console.error('Error creating coupon:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                error: 'Coupon code already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ----------------------------------------------------------------
// READ ALL - Get all coupons (with filtering)
// ----------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const { 
            status = 'active',
            discount_type,
            includeExpired = 'false',
            page = 1,
            limit = 20
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Build where clause
        const whereClause = {};
        
        if (status !== 'all') {
            whereClause.status = status;
        }
        
        if (discount_type) {
            whereClause.discount_type = discount_type;
        }
        
        if (includeExpired.toLowerCase() !== 'true') {
            whereClause.valid_until = {
                gte: new Date()
            };
        }

        const [coupons, totalCount] = await Promise.all([
            prisma.coupon.findMany({
                where: whereClause,
                orderBy: [
                    { status: 'asc' },
                    { valid_until: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip: offset,
                take: limitNum
            }),
            prisma.coupon.count({ where: whereClause })
        ]);

        res.status(200).json({
            success: true,
            data: coupons,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ----------------------------------------------------------------
// READ BY ID - Get a single coupon by ID
// ----------------------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const couponId = parseInt(id);

        if (isNaN(couponId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid coupon ID'
            });
        }

        const coupon = await prisma.coupon.findUnique({
            where: { id: couponId },
            include: {
                coupon_usage: {
                    include: {
                        users: {
                            select: {
                                id: true,
                                username: true,
                                email: true
                            }
                        },
                        orders: {
                            select: {
                                id: true,
                                uuid: true,
                                totalAmount: true
                            }
                        }
                    },
                    orderBy: {
                        usedAt: 'desc'
                    }
                }
            }
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                error: 'Coupon not found'
            });
        }

        res.status(200).json({
            success: true,
            data: coupon
        });
    } catch (error) {
        console.error('Error fetching coupon:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ----------------------------------------------------------------
// UPDATE - Update an existing coupon (admin only)
// ----------------------------------------------------------------
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const couponId = parseInt(id);

        if (isNaN(couponId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid coupon ID'
            });
        }

        const {
            code,
            description,
            discount_type,
            discount_value,
            minimum_order_amount,
            maximum_discount_amount,
            usageLimit,
            user_usage_limit,
            status,
            valid_from,
            valid_until
        } = req.body;

        // Check if coupon exists
        const existingCoupon = await prisma.coupon.findUnique({
            where: { id: couponId }
        });

        if (!existingCoupon) {
            return res.status(404).json({
                success: false,
                error: 'Coupon not found'
            });
        }

        // Validate discount type if provided
        if (discount_type && !['percentage', 'fixed_amount'].includes(discount_type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid discount_type. Must be "percentage" or "fixed_amount"'
            });
        }

        // Validate discount value if provided
        if (discount_value !== undefined) {
            const discountVal = parseFloat(discount_value);
            if (discountVal <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Discount value must be greater than 0'
                });
            }

            const typeToCheck = discount_type || existingCoupon.discount_type;
            if (typeToCheck === 'percentage' && discountVal > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Percentage discount cannot exceed 100%'
                });
            }
        }

        // Validate dates if provided
        if (valid_from && valid_until) {
            const validFrom = new Date(valid_from);
            const validUntil = new Date(valid_until);
            
            if (validFrom >= validUntil) {
                return res.status(400).json({
                    success: false,
                    error: 'valid_until must be after valid_from'
                });
            }
        }

        // Build update data
        const updateData = {};
        if (code !== undefined) updateData.code = code.toUpperCase();
        if (description !== undefined) updateData.description = description;
        if (discount_type !== undefined) updateData.discount_type = discount_type;
        if (discount_value !== undefined) updateData.discount_value = parseFloat(discount_value);
        if (minimum_order_amount !== undefined) updateData.minimum_order_amount = minimum_order_amount ? parseFloat(minimum_order_amount) : null;
        if (maximum_discount_amount !== undefined) updateData.maximum_discount_amount = maximum_discount_amount ? parseFloat(maximum_discount_amount) : null;
        if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
        if (user_usage_limit !== undefined) updateData.user_usage_limit = user_usage_limit;
        if (status !== undefined) updateData.status = status;
        if (valid_from !== undefined) updateData.valid_from = new Date(valid_from);
        if (valid_until !== undefined) updateData.valid_until = new Date(valid_until);

        const updatedCoupon = await prisma.coupon.update({
            where: { id: couponId },
            data: updateData
        });

        res.status(200).json({
            success: true,
            message: 'Coupon updated successfully',
            data: updatedCoupon
        });
    } catch (error) {
        console.error('Error updating coupon:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                error: 'Coupon code already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ----------------------------------------------------------------
// DELETE - Delete a coupon (admin only)
// ----------------------------------------------------------------
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const couponId = parseInt(id);

        if (isNaN(couponId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid coupon ID'
            });
        }

        // Check if coupon exists
        const existingCoupon = await prisma.coupon.findUnique({
            where: { id: couponId }
        });

        if (!existingCoupon) {
            return res.status(404).json({
                success: false,
                error: 'Coupon not found'
            });
        }

        // Check if coupon has been used
        const usageCount = await prisma.coupon_usage.count({
            where: { coupon_id: couponId }
        });

        if (usageCount > 0) {
            // Soft delete by setting status to inactive
            const deactivatedCoupon = await prisma.coupon.update({
                where: { id: couponId },
                data: { status: 'inactive' }
            });

            return res.status(200).json({
                success: true,
                message: 'Coupon deactivated successfully (has usage history)',
                data: deactivatedCoupon
            });
        } else {
            // Hard delete if never used
            await prisma.coupon.delete({
                where: { id: couponId }
            });

            res.status(200).json({
                success: true,
                message: 'Coupon deleted successfully'
            });
        }
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ----------------------------------------------------------------
// VALIDATE - Validate a coupon code for order
// ----------------------------------------------------------------
router.post('/validate', async (req, res) => {
    try {
        const { code, userId, orderAmount } = req.body;

        // Validate required fields
        if (!code || !userId || !orderAmount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, userId, orderAmount'
            });
        }

        const amount = parseFloat(orderAmount);
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Order amount must be greater than 0'
            });
        }

        // Find coupon by code
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                error: 'Coupon not found'
            });
        }

        // Check if coupon is active
        if (coupon.status !== 'active') {
            return res.status(400).json({
                success: false,
                error: 'Coupon is not active'
            });
        }

        // Check if coupon is within valid date range
        const now = new Date();
        if (now < coupon.valid_from || now > coupon.valid_until) {
            return res.status(400).json({
                success: false,
                error: 'Coupon is not valid at this time'
            });
        }

        // Check minimum order amount
        if (coupon.minimum_order_amount && amount < coupon.minimum_order_amount) {
            return res.status(400).json({
                success: false,
                error: `Minimum order amount of $${coupon.minimum_order_amount} required`
            });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usage_count >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                error: 'Coupon usage limit exceeded'
            });
        }

        // Check user usage limit
        const userUsageCount = await prisma.coupon_usage.count({
            where: {
                coupon_id: coupon.id,
                user_id: parseInt(userId)
            }
        });

        if (coupon.user_usage_limit && userUsageCount >= coupon.user_usage_limit) {
            return res.status(400).json({
                success: false,
                error: 'You have already used this coupon the maximum number of times'
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discount_type === 'percentage') {
            discountAmount = (amount * coupon.discount_value) / 100;
        } else {
            discountAmount = parseFloat(coupon.discount_value);
        }

        // Apply maximum discount limit
        if (coupon.maximum_discount_amount && discountAmount > coupon.maximum_discount_amount) {
            discountAmount = parseFloat(coupon.maximum_discount_amount);
        }

        // Ensure discount doesn't exceed order amount
        if (discountAmount > amount) {
            discountAmount = amount;
        }

        res.status(200).json({
            success: true,
            data: {
                coupon: {
                    id: coupon.id,
                    code: coupon.code,
                    description: coupon.description,
                    discount_type: coupon.discount_type,
                    discount_value: coupon.discount_value
                },
                validation: {
                    isValid: true,
                    discountAmount: Math.round(discountAmount * 100) / 100,
                    finalAmount: Math.round((amount - discountAmount) * 100) / 100,
                    orderAmount: amount
                }
            }
        });
    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ----------------------------------------------------------------
// APPLY - Apply coupon to calculate discount (without user validation)
// ----------------------------------------------------------------
router.post('/apply', async (req, res) => {
    try {
        const { code, orderAmount } = req.body;

        // Validate required fields
        if (!code || !orderAmount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: code, orderAmount'
            });
        }

        const amount = parseFloat(orderAmount);
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Order amount must be greater than 0'
            });
        }

        // Find coupon by code
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                error: 'Coupon not found'
            });
        }

        // Check if coupon is active
        if (coupon.status !== 'active') {
            return res.status(400).json({
                success: false,
                error: 'Coupon is not active'
            });
        }

        // Check if coupon is within valid date range
        const now = new Date();
        if (now < coupon.valid_from || now > coupon.valid_until) {
            return res.status(400).json({
                success: false,
                error: 'Coupon is not valid at this time'
            });
        }

        // Check minimum order amount
        if (coupon.minimum_order_amount && amount < coupon.minimum_order_amount) {
            return res.status(400).json({
                success: false,
                error: `Minimum order amount of $${coupon.minimum_order_amount} required`
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discount_type === 'percentage') {
            discountAmount = (amount * coupon.discount_value) / 100;
        } else {
            discountAmount = parseFloat(coupon.discount_value);
        }

        // Apply maximum discount limit
        if (coupon.maximum_discount_amount && discountAmount > coupon.maximum_discount_amount) {
            discountAmount = parseFloat(coupon.maximum_discount_amount);
        }

        // Ensure discount doesn't exceed order amount
        if (discountAmount > amount) {
            discountAmount = amount;
        }

        res.status(200).json({
            success: true,
            data: {
                coupon: {
                    id: coupon.id,
                    code: coupon.code,
                    description: coupon.description,
                    discount_type: coupon.discount_type,
                    discount_value: coupon.discount_value
                },
                calculation: {
                    orderAmount: amount,
                    discountAmount: Math.round(discountAmount * 100) / 100,
                    finalAmount: Math.round((amount - discountAmount) * 100) / 100,
                    savings: Math.round(discountAmount * 100) / 100
                }
            }
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;
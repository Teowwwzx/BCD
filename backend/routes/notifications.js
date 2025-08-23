/**
 * =================================================================
 * API DOCUMENTATION: /api/notifications
 * =================================================================
 *
 * METHOD   | URL                           | DESCRIPTION
 * ---------|-------------------------------|----------------------------------
 * GET      | /:userId                      | Get all notifications for a user.
 * POST     | /                             | Create a new notification.
 * PUT      | /:notificationId/read         | Mark a notification as read.
 *
 * =================================================================
 *
 * REQUEST/RESPONSE FORMATS
 *
 * --- POST / ---
 * Request Body:
 * {
 *     "userId": 1,
 *     "type": "order_update",
 *     "title": "Order Status Update",
 *     "message": "Your order has been shipped."
 * }
 *
 * Valid notification types: order_update, payment_received, product_review, system_message, promotion
 *
 * --- PUT /:notificationId/read ---
 * No request body required.
 *
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// ----------------------------------------------------------------
// GET BY USER ID - Get all notifications for a specific user
// ----------------------------------------------------------------
router.get('/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        if (isNaN(userId)) {
            return res.status(400).json({ success: false, error: 'Invalid user ID.' });
        }

        // Get query parameters for pagination and filtering
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const isRead = req.query.isRead;
        const type = req.query.type;
        
        const skip = (page - 1) * limit;
        
        // Build where clause
        const whereClause = { userId: userId };
        if (isRead !== undefined) {
            whereClause.isRead = isRead === 'true';
        }
        if (type) {
            whereClause.type = type;
        }

        // Get notifications with pagination
        const [notifications, totalCount] = await Promise.all([
            prisma.notification.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip: skip,
                take: limit
            }),
            prisma.notification.count({ where: whereClause })
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error(`Error fetching notifications for user ${req.params.userId}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// CREATE - Create a new notification
// ----------------------------------------------------------------
router.post('/', async (req, res) => {
    try {
        const { userId, type, title, message } = req.body;

        // Validate required fields
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required.' });
        }
        if (!type) {
            return res.status(400).json({ success: false, error: 'Notification type is required.' });
        }
        if (!title) {
            return res.status(400).json({ success: false, error: 'Notification title is required.' });
        }
        if (!message) {
            return res.status(400).json({ success: false, error: 'Notification message is required.' });
        }

        // Validate notification type enum
        const validTypes = ['order_update', 'payment_received', 'product_review', 'system_message', 'promotion'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid notification type. Valid types are: ${validTypes.join(', ')}.` 
            });
        }

        // Validate userId is a number
        const userIdInt = parseInt(userId);
        if (isNaN(userIdInt)) {
            return res.status(400).json({ success: false, error: 'Invalid user ID format.' });
        }

        // Check if user exists
        const userExists = await prisma.user.findUnique({
            where: { id: userIdInt }
        });
        
        if (!userExists) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        // Check for duplicate notification (same user, type, title, and message)
        const existingNotification = await prisma.notification.findFirst({
            where: {
                userId: userIdInt,
                type: type,
                title: title,
                message: message,
                isRead: false // Only check unread notifications to prevent duplicates
            }
        });
        
        if (existingNotification) {
            return res.status(409).json({ 
                success: false, 
                error: 'A similar unread notification already exists for this user.' 
            });
        }

        // Create the notification
        const notification = await prisma.notification.create({
            data: {
                userId: userIdInt,
                type,
                title,
                message,
                isRead: false
            }
        });

        res.status(201).json({ success: true, data: notification });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// UPDATE - Mark a notification as read
// ----------------------------------------------------------------
router.put('/:notificationId/read', async (req, res) => {
    try {
        const notificationId = parseInt(req.params.notificationId);
        
        if (isNaN(notificationId)) {
            return res.status(400).json({ success: false, error: 'Invalid notification ID.' });
        }

        // Check if notification exists first
        const existingNotification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });
        
        if (!existingNotification) {
            return res.status(404).json({ success: false, error: 'Notification not found.' });
        }

        // Update notification to mark as read
        const updatedNotification = await prisma.notification.update({
            where: { id: notificationId },
            data: { 
                isRead: true,
                readAt: new Date()
            }
        });

        res.json({ success: true, data: updatedNotification });
    } catch (error) {
        console.error(`Error marking notification ${req.params.notificationId} as read:`, error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

module.exports = router;
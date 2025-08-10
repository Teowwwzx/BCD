const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// --- GET /api/notifications/:userId ---
// Fetches all notifications for a specific user, newest first.
router.get('/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ success: false, error: 'Invalid user ID' });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' }, // Show newest notifications first
        });

        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error(`Error fetching notifications for user ${req.params.userId}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// --- POST /api/notifications ---
// Creates a new notification.
router.post('/', async (req, res) => {
    try {
        const { userId, type, title, message } = req.body;

        if (!userId || !type || !title || !message) {
            return res.status(400).json({ success: false, error: 'userId, type, title, and message are required' });
        }

        const newNotification = await prisma.notification.create({
            data: {
                userId: parseInt(userId),
                type, // e.g., 'system_message', 'order_update'
                title,
                message,
            },
        });

        res.status(201).json({ success: true, data: newNotification });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// --- PUT /api/notifications/:notificationId/read ---
// Marks a single notification as read.
router.put('/:notificationId/read', async (req, res) => {
    try {
        const notificationId = parseInt(req.params.notificationId);
        if (isNaN(notificationId)) {
            return res.status(400).json({ success: false, error: 'Invalid notification ID' });
        }

        const updatedNotification = await prisma.notification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                read_at: new Date(),
            },
        });

        res.json({ success: true, data: updatedNotification });
    } catch (error) {
        // Handle case where the notification to update is not found
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, error: 'Notification not found.' });
        }
        console.error(`Error marking notification ${req.params.notificationId} as read:`, error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
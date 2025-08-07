const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/addresses/user/:userId - Get all addresses for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const addresses = await prisma.user_addresses.findMany({
            where: { user_id: userId }
        });
        res.json({ success: true, data: addresses });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/addresses - Create a new address for a user
router.post('/', async (req, res) => {
    try {
        const { user_id, address_type, location_type, addr_line_1, city, state, postcode, country } = req.body;
        if (!user_id || !addr_line_1 || !city || !state || !postcode || !country) {
            return res.status(400).json({ success: false, error: 'Missing required address fields' });
        }
        const newAddress = await prisma.user_addresses.create({
            data: {
                user_id: parseInt(user_id),
                address_type,
                location_type,
                ...req.body
            }
        });
        res.status(201).json({ success: true, data: newAddress });
    } catch (error) {
        console.error('Error creating address:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// DELETE /api/addresses/:id - Delete an address
router.delete('/:id', async (req, res) => {
    try {
        const addressId = parseInt(req.params.id);
        await prisma.user_addresses.delete({
            where: { id: addressId }
        });
        res.json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, error: 'Address not found.' });
        }
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
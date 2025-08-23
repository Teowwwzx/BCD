/**
 * =================================================================
 * API DOCUMENTATION: /api/addresses
 * =================================================================
 *
 * METHOD   | URL               | DESCRIPTION
 * ---------|-------------------|----------------------------------
 * POST     | /                 | Create a new address for a user.
 * GET      | /user/:userId     | Get all addresses for a user.
 * GET      | /:id              | Get a single address by ID.
 * PUT      | /:id              | Update an existing address.
 * DELETE   | /:id              | Delete an address.
 *
 * =================================================================
 *
 * REQUEST/RESPONSE FORMATS
 *
 * --- POST / ---
 * Request Body:
 * {
 *     "user_id": 1,
 *     "address_type": "shipping",     // Valid: "shipping", "billing"
 *     "location_type": "residential", // Valid: "residential", "company"
 *     "addr_line_1": "123 Main Street",
 *     "addr_line_2": "Apt 4B",
 *     "city": "New York",
 *     "state": "NY",
 *     "postcode": "10001",
 *     "country": "USA"
 * }
 *
 * --- PUT /:id ---
 * Request Body:
 * {
 *     "address_type": "billing",      // Valid: "shipping", "billing"
 *     "location_type": "company",     // Valid: "residential", "company"
 *     "addr_line_1": "456 Oak Avenue",
 *     "city": "Boston",
 *     "state": "MA",
 *     "postcode": "02101"
 * }
 *
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// ----------------------------------------------------------------
// CREATE - Create a new address for a user
// ----------------------------------------------------------------
router.post('/', async (req, res) => {
    try {
        const { user_id, addr_line_1, addr_line_2, city, state, postcode, country } = req.body;
        
        // Get and validate enum values
        const validAddressTypes = ['shipping', 'billing'];
        const validLocationTypes = ['residential', 'company'];
        
        const address_type = req.body.address_type || 'shipping';
        const location_type = req.body.location_type || 'residential';

        // Validate required fields
        if (!user_id || !addr_line_1 || !city || !state || !postcode || !country) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: user_id, addr_line_1, city, state, postcode, country' 
            });
        }

        // Validate user_id format
        const userIdInt = parseInt(user_id);
        if (isNaN(userIdInt)) {
            return res.status(400).json({ success: false, error: 'Invalid user_id format.' });
        }

        // Check if user exists
        const userExists = await prisma.user.findUnique({
            where: { id: userIdInt }
        });
        
        if (!userExists) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }
        
        if (!validAddressTypes.includes(address_type)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid address_type. Must be one of: ${validAddressTypes.join(', ')}` 
            });
        }
        
        if (!validLocationTypes.includes(location_type)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid location_type. Must be one of: ${validLocationTypes.join(', ')}` 
            });
        }

        // Create the address
        const newAddress = await prisma.user_addresses.create({
            data: {
                user_id: userIdInt,
                address_type: address_type,
                location_type: location_type,
                addr_line_1,
                addr_line_2: addr_line_2 || null,
                city,
                state,
                postcode,
                country
            }
        });

        res.status(201).json({ success: true, data: newAddress });
    } catch (error) {
        console.error('Error creating address:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// READ ALL - Get all addresses for a specific user
// ----------------------------------------------------------------
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { address_type, location_type } = req.query;

        // Validate userId format
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

        // Build filter conditions
        const whereConditions = {
            user_id: userIdInt
        };

        if (address_type) {
            whereConditions.address_type = address_type;
        }

        if (location_type) {
            whereConditions.location_type = location_type;
        }

        // Fetch addresses with optional filtering
        const addresses = await prisma.user_addresses.findMany({
            where: whereConditions,
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json({ success: true, data: addresses });
    } catch (error) {
        console.error('Error fetching user addresses:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// READ BY ID - Get a single address by ID
// ----------------------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID format
        const addressId = parseInt(id);
        if (isNaN(addressId)) {
            return res.status(400).json({ success: false, error: 'Invalid address ID format.' });
        }

        // Fetch the address
        const address = await prisma.user_addresses.findUnique({
            where: { id: addressId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        if (!address) {
            return res.status(404).json({ success: false, error: 'Address not found.' });
        }

        res.status(200).json({ success: true, data: address });
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// UPDATE - Update an existing address
// ----------------------------------------------------------------
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { address_type, location_type, addr_line_1, addr_line_2, city, state, postcode, country } = req.body;

        // Validate ID format
        const addressId = parseInt(id);
        if (isNaN(addressId)) {
            return res.status(400).json({ success: false, error: 'Invalid address ID format.' });
        }

        // Check if address exists
        const existingAddress = await prisma.user_addresses.findUnique({
            where: { id: addressId }
        });
        
        if (!existingAddress) {
            return res.status(404).json({ success: false, error: 'Address not found.' });
        }

        // Validate enum values if provided
        const validAddressTypes = ['shipping', 'billing'];
        const validLocationTypes = ['residential', 'company'];
        
        if (address_type !== undefined && !validAddressTypes.includes(address_type)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid address_type. Must be one of: ${validAddressTypes.join(', ')}` 
            });
        }
        
        if (location_type !== undefined && !validLocationTypes.includes(location_type)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid location_type. Must be one of: ${validLocationTypes.join(', ')}` 
            });
        }

        // Build update data object with only provided fields
        const updateData = {};
        if (address_type !== undefined) updateData.address_type = address_type;
        if (location_type !== undefined) updateData.location_type = location_type;
        if (addr_line_1 !== undefined) updateData.addr_line_1 = addr_line_1;
        if (addr_line_2 !== undefined) updateData.addr_line_2 = addr_line_2;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;
        if (postcode !== undefined) updateData.postcode = postcode;
        if (country !== undefined) updateData.country = country;

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, error: 'No valid fields provided for update.' });
        }

        // Update the address
        const updatedAddress = await prisma.user_addresses.update({
            where: { id: addressId },
            data: updateData
        });

        res.status(200).json({ success: true, data: updatedAddress });
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// DELETE - Delete an address
// ----------------------------------------------------------------
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID format
        const addressId = parseInt(id);
        if (isNaN(addressId)) {
            return res.status(400).json({ success: false, error: 'Invalid address ID format.' });
        }

        // Check if address exists before deletion
        const existingAddress = await prisma.user_addresses.findUnique({
            where: { id: addressId }
        });
        
        if (!existingAddress) {
            return res.status(404).json({ success: false, error: 'Address not found.' });
        }

        // Delete the address
        await prisma.user_addresses.delete({
            where: { id: addressId }
        });

        res.status(200).json({ success: true, message: 'Address deleted successfully.' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

module.exports = router;
// backend/routes/users.js
/**
 * =================================================================
 * API DOCUMENTATION: /api/users
 * =================================================================
 *
 * METHOD   | URL               | DESCRIPTION
 * ---------|-------------------|----------------------------------
 * POST     | /                 | Create a new user.
 * GET      | /                 | Get all users (with filtering and pagination).
 * GET      | /:id              | Get a single user by their ID.
 * PUT      | /:id              | Update an existing user by their ID.
 * DELETE   | /:id              | Delete a user by their ID.
 *
 * =================================================================
 *
 * REQUEST/RESPONSE FORMATS
 *
 * --- POST / ---
 * Request Body:
 * {
 *   "username": "newuser",
 *   "email": "new@example.com",
 *   "password": "password123",
 *   "f_name": "New",
 *   "l_name": "User",
 *   "user_role": "buyer"
 * }
 *
 * --- PUT /:id ---
 * Request Body:
 * {
 *   "email": "updated@example.com",
 *   "status": "active"
 * }
 *
 * --- GET / (Query Parameters) ---
 * ?page=1
 * ?limit=10
 * ?role=seller
 * ?status=active
 * ?search=john
 *
 */
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const router = express.Router();

const prisma = new PrismaClient();

// ----------------------------------------------------------------
// 1. CREATE (POST /)
// ----------------------------------------------------------------
router.post('/', async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            f_name,
            l_name,
            phone,
            dob,
            profileImageUrl,
            user_role,
            status
        } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, error: 'Username, email, and password are required fields.' });
        }

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ username }, { email }] }
        });

        if (existingUser) {
            return res.status(409).json({ success: false, error: 'User with this username or email already exists.' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                f_name,
                l_name,
                phone,
                dob: dob ? new Date(dob) : null,
                profileImageUrl,
                user_role: user_role || 'buyer',
                status: status || 'pending_verification'
            }
        });

        const { passwordHash: _, ...userResponse } = newUser;

        res.status(201).json({ success: true, data: userResponse });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ----------------------------------------------------------------
// 2. READ ALL (GET /)
// ----------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            role,
            status,
            search
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {};
        if (role) where.user_role = role;
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { f_name: { contains: search, mode: 'insensitive' } },
                { l_name: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [users, total] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                skip,
                take,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    f_name: true,
                    l_name: true,
                    phone: true,
                    profileImageUrl: true,
                    user_role: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            products: true,
                            orders: true,
                            cartItems: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ----------------------------------------------------------------
// 3. READ BY ID (GET /:id)
// ----------------------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            return res.status(400).json({ success: false, error: 'Invalid user ID.' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                f_name: true,
                l_name: true,
                phone: true,
                dob: true,
                profileImageUrl: true,
                user_role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                products: {
                    select: { id: true, name: true, price: true, status: true, createdAt: true },
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                },
                orders: {
                    select: { id: true, uuid: true, order_status: true, totalAmount: true, createdAt: true },
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: { products: true, orders: true, cartItems: true, product_reviews: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        console.error(`Error fetching user with ID ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// 4. UPDATE BY ID (PUT /:id)
// ----------------------------------------------------------------
router.put('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ success: false, error: 'Invalid user ID.' });
        }

        const {
            username,
            email,
            password,
            f_name,
            l_name,
            phone,
            dob,
            profileImageUrl,
            user_role,
            status
        } = req.body;

        const dataToUpdate = {};
        if (username !== undefined) dataToUpdate.username = username;
        if (email !== undefined) dataToUpdate.email = email;
        if (f_name !== undefined) dataToUpdate.f_name = f_name;
        if (l_name !== undefined) dataToUpdate.l_name = l_name;
        if (phone !== undefined) dataToUpdate.phone = phone;
        if (dob !== undefined) dataToUpdate.dob = dob ? new Date(dob) : null;
        if (profileImageUrl !== undefined) dataToUpdate.profileImageUrl = profileImageUrl;
        if (user_role !== undefined) dataToUpdate.user_role = user_role;
        if (status !== undefined) dataToUpdate.status = status;
        
        if (password) {
            const saltRounds = 10;
            dataToUpdate.passwordHash = await bcrypt.hash(password, saltRounds);
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ success: false, error: 'No fields provided to update.' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate
        });

        const { passwordHash: _, ...userResponse } = updatedUser;

        res.json({ success: true, data: userResponse });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }
        if (error.code === 'P2002') {
            return res.status(409).json({ success: false, error: 'Username or email already exists.' });
        }
        console.error(`Error updating user ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

// ----------------------------------------------------------------
// 5. DELETE (DELETE by ID)
// ----------------------------------------------------------------
router.delete('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        if (isNaN(userId)) {
            return res.status(400).json({ success: false, error: 'Invalid user ID.' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        products: true,
                        orders: true,
                        product_reviews: true,
                        cartItems: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        const hasRelatedData = user._count.products > 0 || user._count.orders > 0 || user._count.product_reviews > 0;

        if (hasRelatedData) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete user with existing data (${user._count.products} products, ${user._count.orders} orders, ${user._count.product_reviews} reviews). Consider deactivating the user instead.`
            });
        }

        await prisma.user.delete({ where: { id: userId } });

        res.json({ success: true, data: { message: 'User deleted successfully.' } });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }
        console.error(`Error deleting user ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

module.exports = router;
/**
 * =================================================================
 * API DOCUMENTATION: /api/auth
 * =================================================================
 *
 * METHOD   | URL               | DESCRIPTION
 * ---------|-------------------|----------------------------------
 * POST     | /register         | Register a new user account.
 * POST     | /login            | Login with email and password.
 * GET      | /profile          | Get current user profile (protected).
 *
 * =================================================================
 *
 * REQUEST/RESPONSE FORMATS
 *
 * --- POST /register ---
 * Request Body:
 * {
 *     "username": "newuser",
 *     "email": "user@example.com",
 *     "password": "password123",
 *     "f_name": "John",
 *     "l_name": "Doe",
 *     "phone": "+1234567890",
 *     "user_role": "buyer"
 * }
 *
 * --- POST /login ---
 * Request Body:
 * {
 *     "email": "user@example.com",
 *     "password": "password123"
 * }
 *
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();


// ----------------------------------------------------------------
// REGISTER - Create a new user account
// ----------------------------------------------------------------
router.post('/register', async (req, res) => {
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
        } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username, email, and password are required.'
            });
        }

        // Check for existing user
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this username or email already exists.'
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = await prisma.user.create({
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
                status: 'pending_verification'
            }
        });

        // Remove password hash from response
        const { passwordHash: _, ...userResponse } = user;

        res.status(201).json({
            success: true,
            data: {
                message: 'User created successfully.',
                user: userResponse
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});


// ----------------------------------------------------------------
// LOGIN - Authenticate user and return JWT token
// ----------------------------------------------------------------
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required.'
            });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials.'
            });
        }

        // Check if user account is active
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'User account is not active.'
            });
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials.'
            });
        }

        // Generate JWT token (using 'id' for consistency with middleware)
        const token = jwt.sign(
            { id: user.id, userId: user.id, role: user.user_role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password hash from response
        const { passwordHash: _, ...userResponse } = user;

        res.json({
            success: true,
            data: {
                message: 'Login successful.',
                token,
                user: userResponse
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});


// ----------------------------------------------------------------
// PROFILE - Get current user profile (protected route)
// ----------------------------------------------------------------
router.get('/profile', authMiddleware.isLoggedIn, async (req, res) => {
    try {
        const user = req.user; // User data loaded by middleware

        // Return user profile data (excluding sensitive information)
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    f_name: user.f_name,
                    l_name: user.l_name,
                    phone: user.phone,
                    user_role: user.user_role,
                    status: user.status,
                    created_at: user.created_at,
                    updated_at: user.updated_at
                }
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});

module.exports = router;
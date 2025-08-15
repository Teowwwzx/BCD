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
 * POST     | /verify-email     | Verify email with token.
 * POST     | /resend-verification | Resend verification email.
 * POST     | /forgot-password  | Request password reset email.
 * POST     | /reset-password   | Reset password with token.
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
const emailService = require('../src/services/emailService');

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

        // Generate email verification token
        const emailVerificationToken = emailService.generateToken();

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
                status: 'pending_verification',
                isEmailVerified: false,
                emailVerificationToken
            }
        });

        // Send verification email
        try {
            await emailService.sendVerificationEmail(email, username, emailVerificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails, but log it
        }

        // Remove password hash from response
        const { passwordHash: _, emailVerificationToken: __, ...userResponse } = user;

        res.status(201).json({
            success: true,
            data: {
                message: 'User created successfully. Please check your email to verify your account.',
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

        // Check if user account is active and email is verified
        if (user.status !== 'active' || !user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                error: 'Please verify your email address before logging in. Check your inbox for a verification email.'
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


// ----------------------------------------------------------------
// VERIFY EMAIL - Verify user email with token
// ----------------------------------------------------------------
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Verification token is required.'
            });
        }

        // Find user with this verification token
        const user = await prisma.user.findFirst({
            where: {
                emailVerificationToken: token,
                isEmailVerified: false
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired verification token.'
            });
        }

        // Update user as verified and active
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                status: 'active',
                emailVerificationToken: null
            }
        });

        // Send welcome email
        try {
            await emailService.sendWelcomeEmail(user.email, user.username);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        // Remove sensitive data from response
        const { passwordHash: _, emailVerificationToken: __, ...userResponse } = updatedUser;

        res.json({
            success: true,
            data: {
                message: 'Email verified successfully! Your account is now active.',
                user: userResponse
            }
        });
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});


// ----------------------------------------------------------------
// RESEND VERIFICATION - Resend verification email
// ----------------------------------------------------------------
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required.'
            });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found.'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                error: 'Email is already verified.'
            });
        }

        // Generate new verification token
        const emailVerificationToken = emailService.generateToken();

        // Update user with new token
        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerificationToken }
        });

        // Send verification email
        await emailService.sendVerificationEmail(email, user.username, emailVerificationToken);

        res.json({
            success: true,
            data: {
                message: 'Verification email sent successfully. Please check your inbox.'
            }
        });
    } catch (error) {
        console.error('Error resending verification email:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});


// ----------------------------------------------------------------
// FORGOT PASSWORD - Request password reset email
// ----------------------------------------------------------------
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required.'
            });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Don't reveal if user exists or not for security
            return res.json({
                success: true,
                data: {
                    message: 'If an account with this email exists, a password reset link has been sent.'
                }
            });
        }

        if (!user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                error: 'Please verify your email address first.'
            });
        }

        // Generate password reset token and expiry (1 hour)
        const passwordResetToken = emailService.generateToken();
        const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Update user with reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken,
                passwordResetExpires
            }
        });

        // Send password reset email
        await emailService.sendPasswordResetEmail(email, user.username, passwordResetToken);

        res.json({
            success: true,
            data: {
                message: 'If an account with this email exists, a password reset link has been sent.'
            }
        });
    } catch (error) {
        console.error('Error requesting password reset:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});


// ----------------------------------------------------------------
// RESET PASSWORD - Reset password with token
// ----------------------------------------------------------------
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Token, new password, and confirm password are required.'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Passwords do not match.'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long.'
            });
        }

        // Find user with valid reset token
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpires: {
                    gt: new Date()
                }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token.'
            });
        }

        // Hash new password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update user password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                passwordResetToken: null,
                passwordResetExpires: null
            }
        });

        res.json({
            success: true,
            data: {
                message: 'Password reset successfully. You can now login with your new password.'
            }
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});

module.exports = router;
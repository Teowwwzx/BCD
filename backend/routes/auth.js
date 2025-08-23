/**
 * =================================================================
 * API DOCUMENTATION: /api/auth
 * =================================================================
 *
 * METHOD   | URL                    | DESCRIPTION
 * ---------|------------------------|----------------------------------
 * POST     | /register              | Register a new user account.
 * POST     | /login                 | Login with email and password.
 * GET      | /profile               | Get current user profile (protected).
 * POST     | /verify-email          | Verify email with token.
 * POST     | /resend-verification   | Resend verification email.
 * POST     | /forgot-password       | Request password reset email.
 * POST     | /reset-password        | Reset password with token.
 * POST     | /direct-reset-password | Reset password directly without token.
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
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const emailService = require('../src/services/emailService');

// Export a function that accepts prisma client as dependency
module.exports = (prisma) => {
    const router = express.Router();


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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format.'
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
                status: 'pending_verification',
            }
        });

        // Generate email verification token and store it
        const verificationTokenString = emailService.generateToken();
        await prisma.token.create({
            data: {
                token: verificationTokenString,
                userId: user.id,
                type: 'EMAIL_VERIFICATION',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });

        // Send verification email
        try {
            await emailService.sendVerificationEmail(email, username, verificationTokenString);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails, but log it
        }

        // Remove password hash from response
        const { passwordHash: _, ...userResponse } = user;

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
        if (user.status === 'pending_verification') {
            return res.status(403).json({
                success: false,
                error: 'Please verify your email address before logging in. Check your inbox for a verification email.'
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: `Your account status is: ${user.status}. Please contact support.`
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
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
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

        // Find the token in the database
        const verificationToken = await prisma.token.findUnique({
            where: {
                token: token,
                type: 'EMAIL_VERIFICATION',
            },
        });

        if (!verificationToken || new Date() > new Date(verificationToken.expiresAt)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired verification token.',
            });
        }

        // Token is valid, so update the user
        const updatedUser = await prisma.user.update({
            where: { id: verificationToken.userId },
            data: {
                status: 'active',
            },
        });

        // Delete the used token
        await prisma.token.delete({ where: { id: verificationToken.id } });

        // Send welcome email
        try {
            await emailService.sendWelcomeEmail(updatedUser.email, updatedUser.username);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        // Remove sensitive data from response
        const { passwordHash: _, ...userResponse } = updatedUser;

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

        if (user.status === 'active') {
            return res.status(400).json({
                success: false,
                error: 'Email is already verified.'
            });
        }

        // Invalidate any old verification tokens
        await prisma.token.deleteMany({
            where: {
                userId: user.id,
                type: 'EMAIL_VERIFICATION',
            },
        });

        // Generate new verification token
        const verificationTokenString = emailService.generateToken();
        await prisma.token.create({
            data: {
                token: verificationTokenString,
                userId: user.id,
                type: 'EMAIL_VERIFICATION',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });


        // Send verification email
        await emailService.sendVerificationEmail(email, user.username, verificationTokenString);

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

        if (user.status !== 'active') {
            return res.status(400).json({
                success: false,
                error: 'Please verify your email address first.'
            });
        }

        // Invalidate all existing password reset tokens for this user
        await prisma.token.deleteMany({
            where: {
                userId: user.id,
                type: 'PASSWORD_RESET',
            },
        });

        // Generate password reset token and expiry (1 hour)
        const tokenString = emailService.generateToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Create new token in the database
        await prisma.token.create({
            data: {
                token: tokenString,
                expiresAt,
                type: 'PASSWORD_RESET',
                userId: user.id,
            },
        });

        // Send password reset email
        await emailService.sendPasswordResetEmail(email, user.username, tokenString);

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

        // Find the token in the database
        const resetToken = await prisma.token.findUnique({
            where: {
                token: token,
                type: 'PASSWORD_RESET',
            },
        });

        // Regarding "max 3 attempts": For security, password reset tokens are single-use.
        // This implementation invalidates the token immediately upon a single use attempt.
        // If you require multiple attempts with the same token, the database schema
        // would need to be updated to include an attempt counter.

        // Check if token is valid and not expired
        if (!resetToken || new Date() > new Date(resetToken.expiresAt)) {
            // If the token is found but expired, delete it.
            if (resetToken) {
                await prisma.token.delete({ where: { id: resetToken.id } });
            }
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token. Please request a new one.',
            });
        }

        // The token is valid, so we can delete it to prevent reuse
        await prisma.token.delete({
            where: { id: resetToken.id },
        });


        // Hash new password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update user password
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: {
                passwordHash,
            },
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


// ----------------------------------------------------------------
// DIRECT RESET PASSWORD - Reset password without token
// ----------------------------------------------------------------
router.post('/direct-reset-password', async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        // Validate required fields
        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Email, new password, and confirm password are required.'
            });
        }

        // Check that passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Passwords do not match.'
            });
        }

        // Validate password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long.'
            });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found with this email address.'
            });
        }

        // Hash the new password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update user's password in the database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
            }
        });

        // Clear any existing password reset tokens for this user
        await prisma.token.deleteMany({
            where: {
                userId: user.id,
                type: 'PASSWORD_RESET',
            },
        });

        res.json({
            success: true,
            data: {
                message: 'Password updated successfully. You can now login with your new password.'
            }
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error.'
        });
    }
});



    return router;
};
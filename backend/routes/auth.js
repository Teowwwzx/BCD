const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();


// User Registration
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

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required',
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this username or email already exists',
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

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
      },
    });

    const { passwordHash: _, ...userResponse } = user;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});


// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'User account is not active',
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.user_role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const { passwordHash: _, ...userResponse } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});


router.get('/profile', authMiddleware.isLoggedIn, async (req, res) => {
    try {
        const user = req.user; // Get user ID from the decoded token

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    f_name: user.f_name,
                    l_name: user.l_name,
                    user_role: user.user_role
                }
            }
        });

    } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
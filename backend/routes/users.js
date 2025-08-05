const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Create or register a new user
router.post('/', async (req, res) => {
  try {
    const {
      walletAddress,
      username,
      email,
      profileImageUrl,
      bio,
      userRole
    } = req.body;

    // Validate required fields
    if (!walletAddress || !userRole) {
      return res.status(400).json({
        error: 'Wallet address and user role are required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this wallet address already exists'
      });
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        walletAddress,
        username,
        email,
        profileImageUrl,
        bio,
        userRole
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        userRole: user.userRole,
        reputationScore: user.reputationScore,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get user by wallet address - MUST come before /:id route
router.get('/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || address.length !== 42) {
      return res.status(400).json({
        error: 'Invalid wallet address'
      });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: address },
      include: {
        productsAsSeller: {
          select: {
            id: true,
            name: true,
            price: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            productsAsSeller: true,
            ordersAsBuyer: true,
            ordersAsSeller: true,
            reviewsGiven: true,
            reviewsReceived: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        reputationScore: user.reputationScore,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        productsAsSeller: user.productsAsSeller,
        stats: user._count
      }
    });
  } catch (error) {
    console.error('Error getting user by wallet:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get user by ID - MUST come after specific routes
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        productsAsSeller: {
          select: {
            id: true,
            name: true,
            price: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            productsAsSeller: true,
            ordersAsBuyer: true,
            ordersAsSeller: true,
            reviewsGiven: true,
            reviewsReceived: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        userRole: user.userRole,
        reputationScore: user.reputationScore,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        productsAsSeller: user.productsAsSeller,
        stats: user._count
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    const {
      username,
      email,
      profileImageUrl,
      bio
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        email,
        profileImageUrl,
        bio
      }
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        walletAddress: updatedUser.walletAddress,
        profileImageUrl: updatedUser.profileImageUrl,
        bio: updatedUser.bio,
        userRole: updatedUser.userRole,
        reputationScore: updatedUser.reputationScore,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get all users (with pagination) - MUST come last
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = role ? { userRole: role } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          walletAddress: true,
          username: true,
          profileImageUrl: true,
          userRole: true,
          reputationScore: true,
          createdAt: true,
          _count: {
            select: {
              productsAsSeller: true,
              ordersAsBuyer: true,
              ordersAsSeller: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/auth');

// @route   GET api/stats
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/', authMiddleware.checkRole(['admin']), async (req, res) => {
  try {
    // Basic counts
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    const totalOrders = await prisma.order.count();
    
    // Total Sales Volume (TTV) - sum of all completed orders
    const totalSalesVolume = await prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        order_status: 'delivered',
      },
    });

    // New Users This Month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Pending Products (assuming draft status means pending approval)
    const pendingProducts = await prisma.product.count({
      where: {
        status: 'draft',
      },
    });

    // Open Disputes (orders with failed payments or pending status that need attention)
    const openDisputes = await prisma.order.count({
      where: {
        OR: [
          { payment_status: 'failed' },
          { 
            AND: [
              { order_status: 'pending' },
              { 
                createdAt: {
                  lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // older than 24 hours
                }
              }
            ]
          }
        ],
      },
    });

    // Total Revenue (for backward compatibility)
    const totalRevenue = totalSalesVolume._sum.totalAmount || 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        totalSalesVolume: totalSalesVolume._sum.totalAmount || 0,
        newUsersThisMonth,
        pendingProducts,
        openDisputes,
      },
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

module.exports = router;
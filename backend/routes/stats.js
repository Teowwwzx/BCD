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
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    const totalOrders = await prisma.order.count();
    
    const totalRevenue = await prisma.order.aggregate({
      _sum: {
        finalPrice: true,
      },
      where: {
        status: 'Completed',
      },
    });

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.finalPrice || 0,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
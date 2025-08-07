const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// POST /api/reviews - Create a new review
router.post('/', async (req, res) => {
  try {
    const { userId, productId, order_item_id, rating, title, review_text } = req.body;

    if (!userId || !productId || !rating) {
      return res.status(400).json({ success: false, error: 'User ID, Product ID, and rating are required' });
    }

    const userIdInt = parseInt(userId);
    const productIdInt = parseInt(productId);
    const ratingInt = parseInt(rating);

    // --- NEW: VERIFIED PURCHASE CHECK ---
    // Check if there is a completed order item linking this user to this product.
    const purchasedItem = await prisma.orderItem.findFirst({
        where: {
            order: {
                buyer_id: userIdInt,
                order_status: 'delivered' // Or 'completed'
            },
            productId: productIdInt
        }
    });

    if (!purchasedItem) {
        return res.status(403).json({ 
            success: false, 
            error: "You can only review products you have purchased and received." 
        });
    }
    // --- END NEW CHECK ---

    // Check if a review already exists for this specific purchase
    const existingReview = await prisma.product_reviews.findUnique({
        where: { order_item_id: purchasedItem.id }
    });

    if (existingReview) {
        return res.status(409).json({ success: false, error: "You have already submitted a review for this purchase." });
    }

    // Create the review
    const newReview = await prisma.product_reviews.create({
      data: {
        user_id: userIdInt,
        product_id: productIdInt,
        order_item_id: purchasedItem.id, // Link to the specific purchase
        rating: ratingInt,
        title,
        review_text,
        is_verified_purchase: true, // Automatically set to true because we just checked
        status: 'pending'
      },
      include: { users: { select: { id: true, username: true } } }
    });
    res.status(201).json({ success: true, data: newReview });

  } catch (error) {
    if (error.code === 'P2002') {
        return res.status(409).json({ success: false, error: 'You have already reviewed this product.'});
    }
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/reviews - Get reviews with filtering
router.get('/', async (req, res) => {
    try {
        const { productId, userId, status } = req.query;
        const where = {};
        if (productId) where.product_id = parseInt(productId);
        if (userId) where.user_id = parseInt(userId);
        if (status) where.status = status;
        
        const reviews = await prisma.product_reviews.findMany({
            where,
            include: {
                users: {
                    select: {
                        id: true,
                        username: true,
                        profileImageUrl: true 
                    }
                }
            },
            orderBy: { 
                created_at: 'desc' 
            }
        });
        res.json({ success: true, data: reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// PUT /api/reviews/:id - Update a review (e.g., by the user who wrote it)
router.put('/:id', async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        const { rating, title, review_text } = req.body;
        const updatedReview = await prisma.product_reviews.update({
            where: { id: reviewId },
            data: {
                rating: rating ? parseInt(rating) : undefined,
                title,
                review_text
            }
        });
        res.json({ success: true, data: updatedReview });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, error: 'Review not found.' });
        }
        console.error('Error updating review:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});


// PATCH /api/reviews/:id/status - Update review status (for admins)
router.patch('/:id/status', async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }
    const updatedReview = await prisma.product_reviews.update({
      where: { id: reviewId },
      data: { status },
    });
    res.json({ success: true, data: updatedReview });
  } catch (error) {
    if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Review not found.' });
    }
    console.error('Error updating review status:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// DELETE /api/reviews/:id - Delete a review (for admins or the user)
router.delete('/:id', async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id);
        await prisma.product_reviews.delete({
            where: { id: reviewId }
        });
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, error: 'Review not found.' });
        }
        console.error('Error deleting review:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
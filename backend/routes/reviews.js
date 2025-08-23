/**
 * =================================================================
 * API DOCUMENTATION: /api/reviews
 * =================================================================
 *
 * METHOD   | URL               | DESCRIPTION
 * ---------|-------------------|----------------------------------
 * POST     | /                 | Create a new product review.
 * GET      | /                 | Get all reviews (with filtering).
 * GET      | /:id              | Get a single review by ID.
 * PUT      | /:id              | Update an existing review.
 * DELETE   | /:id              | Delete a review.
 *
 * =================================================================
 *
 * REQUEST/RESPONSE FORMATS
 *
 * --- POST / ---
 * Request Body:
 * {
 *   "userId": 1,
 *   "productId": 2,
 *   "rating": 5,
 *   "title": "Excellent product!",
 *   "review_text": "This product exceeded my expectations..."
 * }
 *
 * --- PUT /:id ---
 * Request Body:
 * {
 *   "rating": 4,
 *   "title": "Updated title",
 *   "review_text": "Updated review text"
 * }
 *
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// ----------------------------------------------------------------
// CREATE - Create a new product review
// ----------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { userId, productId, rating, title, review_text } = req.body;

    // Validate required fields
    if (!userId || !productId || !rating) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: userId, productId, rating' 
      });
    }

    // Validate field formats
    const userIdInt = parseInt(userId);
    const productIdInt = parseInt(productId);
    const ratingInt = parseInt(rating);
    
    if (isNaN(userIdInt) || isNaN(productIdInt) || isNaN(ratingInt)) {
      return res.status(400).json({ success: false, error: 'Invalid field format.' });
    }

    // Validate rating range
    if (ratingInt < 1 || ratingInt > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5.' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userIdInt }
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productIdInt }
    });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    // Check if there is a completed order item linking this user to this product
    const purchasedItem = await prisma.orderItem.findFirst({
      where: {
        order: {
          buyer_id: userIdInt,
          order_status: 'delivered'
        },
        productId: productIdInt
      }
    });

    if (!purchasedItem) {
      return res.status(403).json({ 
        success: false, 
        error: 'You can only review products you have purchased and received.' 
      });
    }

    // Check if a review already exists for this specific purchase
    const existingReview = await prisma.product_reviews.findUnique({
      where: { order_item_id: purchasedItem.id }
    });

    if (existingReview) {
      return res.status(409).json({ 
        success: false, 
        error: 'You have already submitted a review for this purchase.' 
      });
    }

    // Create the review
    const newReview = await prisma.product_reviews.create({
      data: {
        user_id: userIdInt,
        product_id: productIdInt,
        order_item_id: purchasedItem.id,
        rating: ratingInt,
        title,
        review_text,
        is_verified_purchase: true,
        status: 'pending'
      },
      include: { 
        users: { 
          select: { id: true, username: true, profileImageUrl: true } 
        } 
      }
    });
    
    res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        success: false, 
        error: 'You have already reviewed this product.' 
      });
    }
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ----------------------------------------------------------------
// READ ALL - Get all reviews with filtering and pagination
// ----------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { productId, userId, status, limit = 10, offset = 0 } = req.query;

    // Build where clause for filtering
    const where = {};
    if (productId) {
      const productIdInt = parseInt(productId);
      if (isNaN(productIdInt)) {
        return res.status(400).json({ success: false, error: 'Invalid productId format.' });
      }
      where.product_id = productIdInt;
    }
    if (userId) {
      const userIdInt = parseInt(userId);
      if (isNaN(userIdInt)) {
        return res.status(400).json({ success: false, error: 'Invalid userId format.' });
      }
      where.user_id = userIdInt;
    }
    if (status) {
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status value.' });
      }
      where.status = status;
    }

    // Validate pagination parameters
    const limitInt = parseInt(limit);
    const offsetInt = parseInt(offset);
    if (isNaN(limitInt) || isNaN(offsetInt) || limitInt < 1 || offsetInt < 0) {
      return res.status(400).json({ success: false, error: 'Invalid pagination parameters.' });
    }

    // Fetch reviews with related data
    const reviews = await prisma.product_reviews.findMany({
      where,
      include: {
        users: { 
          select: { id: true, username: true, profileImageUrl: true } 
        },
        products: { 
          select: { 
            id: true, 
            name: true,
            images: {
              select: {
                imageUrl: true,
                altText: true
              },
              take: 1
            }
          } 
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limitInt,
      skip: offsetInt
    });

    // Get total count for pagination
    const total = await prisma.product_reviews.count({ where });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          limit: limitInt,
          offset: offsetInt,
          hasMore: offsetInt + limitInt < total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ----------------------------------------------------------------
// READ BY ID - Get a specific review by ID
// ----------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reviewId = parseInt(id);

    // Validate review ID
    if (isNaN(reviewId)) {
      return res.status(400).json({ success: false, error: 'Invalid review ID format.' });
    }

    // Fetch review with related data
    const review = await prisma.product_reviews.findUnique({
      where: { id: reviewId },
      include: {
        users: { 
          select: { id: true, username: true, profileImageUrl: true } 
        },
        products: { 
          select: { 
            id: true, 
            name: true, 
            price: true,
            images: {
              select: {
                imageUrl: true,
                altText: true
              },
              take: 1
            }
          } 
        },
        order_items: {
          select: { id: true, quantity: true, price: true }
        }
      }
    });

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ----------------------------------------------------------------
// UPDATE - Update an existing review
// ----------------------------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, review_text } = req.body;
    const reviewId = parseInt(id);

    // Validate review ID
    if (isNaN(reviewId)) {
      return res.status(400).json({ success: false, error: 'Invalid review ID format.' });
    }

    // Check if review exists
    const existingReview = await prisma.product_reviews.findUnique({
      where: { id: reviewId }
    });

    if (!existingReview) {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }

    // Build update data object
    const updateData = {
      updatedAt: new Date()
    };

    // Validate and add rating if provided
    if (rating !== undefined) {
      const ratingInt = parseInt(rating);
      if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
        return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5.' });
      }
      updateData.rating = ratingInt;
    }

    // Add title if provided
    if (title !== undefined) {
      updateData.title = title;
    }

    // Add review text if provided
    if (review_text !== undefined) {
      updateData.review_text = review_text;
    }

    // Update the review
    const updatedReview = await prisma.product_reviews.update({
      where: { id: reviewId },
      data: updateData,
      include: { 
        users: { 
          select: { id: true, username: true, profileImageUrl: true } 
        },
        products: {
          select: { 
            id: true, 
            name: true,
            images: {
              select: {
                imageUrl: true,
                altText: true
              },
              take: 1
            }
          }
        }
      }
    });

    res.status(200).json({ success: true, data: updatedReview });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }
    console.error('Error updating review:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});


// ----------------------------------------------------------------
// UPDATE STATUS - Update review status (for admins)
// ----------------------------------------------------------------
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const reviewId = parseInt(id);

    // Validate review ID
    if (isNaN(reviewId)) {
      return res.status(400).json({ success: false, error: 'Invalid review ID format.' });
    }

    // Validate status
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required.' });
    }

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value.' });
    }

    // Check if review exists
    const existingReview = await prisma.product_reviews.findUnique({
      where: { id: reviewId }
    });

    if (!existingReview) {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }

    // Update review status
    const updatedReview = await prisma.product_reviews.update({
      where: { id: reviewId },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: { 
        users: { 
          select: { id: true, username: true, profileImageUrl: true } 
        },
        products: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(200).json({ success: true, data: updatedReview });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }
    console.error('Error updating review status:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});


// ----------------------------------------------------------------
// DELETE - Delete a review
// ----------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reviewId = parseInt(id);

    // Validate review ID
    if (isNaN(reviewId)) {
      return res.status(400).json({ success: false, error: 'Invalid review ID format.' });
    }

    // Check if review exists
    const existingReview = await prisma.product_reviews.findUnique({
      where: { id: reviewId }
    });

    if (!existingReview) {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }

    // Delete the review
    await prisma.product_reviews.delete({
      where: { id: reviewId }
    });

    res.status(200).json({ 
      success: true, 
      message: 'Review deleted successfully.' 
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Review not found.' });
    }
    console.error('Error deleting review:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
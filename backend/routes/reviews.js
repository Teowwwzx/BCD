const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Create a new review
router.post('/', async (req, res) => {
  try {
    const {
      reviewerId,
      orderId,
      productId,
      rating,
      comment,
      reviewType = 'Product'
    } = req.body;

    // Validate required fields
    if (!reviewerId || !rating) {
      return res.status(400).json({
        error: 'Reviewer ID and rating are required'
      });
    }

    if (!orderId && !productId) {
      return res.status(400).json({
        error: 'Either order ID or product ID is required'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    // Validate reviewer exists
    const reviewer = await prisma.user.findUnique({
      where: { id: parseInt(reviewerId) }
    });

    if (!reviewer) {
      return res.status(404).json({
        error: 'Reviewer not found'
      });
    }

    let order = null;
    let product = null;

    // If orderId is provided, validate order and get product
    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) },
        include: {
          product: {
            include: {
              seller: true
            }
          },
          buyer: true
        }
      });

      if (!order) {
        return res.status(404).json({
          error: 'Order not found'
        });
      }

      // Check if reviewer is the buyer of this order
      if (order.buyerId !== parseInt(reviewerId)) {
        return res.status(403).json({
          error: 'Only the buyer can review this order'
        });
      }

      // Check if order is completed
      if (order.status !== 'Completed' && order.status !== 'Delivered') {
        return res.status(400).json({
          error: 'Can only review completed or delivered orders'
        });
      }

      product = order.product;
    } else if (productId) {
      // If only productId is provided, validate product
      product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
        include: {
          seller: true
        }
      });

      if (!product) {
        return res.status(404).json({
          error: 'Product not found'
        });
      }

      // Check if reviewer has purchased this product
      const hasPurchased = await prisma.order.findFirst({
        where: {
          buyerId: parseInt(reviewerId),
          productId: parseInt(productId),
          status: { in: ['Completed', 'Delivered'] }
        }
      });

      if (!hasPurchased) {
        return res.status(403).json({
          error: 'Can only review products you have purchased'
        });
      }
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: parseInt(reviewerId),
        ...(orderId && { orderId: parseInt(orderId) }),
        ...(productId && { productId: parseInt(productId) })
      }
    });

    if (existingReview) {
      return res.status(400).json({
        error: 'Review already exists for this order/product'
      });
    }

    // Create review and update seller reputation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the review
      const review = await tx.review.create({
        data: {
          reviewerId: parseInt(reviewerId),
          orderId: orderId ? parseInt(orderId) : null,
          productId: productId ? parseInt(productId) : product.id,
          rating: parseInt(rating),
          comment,
          reviewType
        },
        include: {
          reviewer: {
            select: {
              id: true,
              username: true,
              profileImageUrl: true
            }
          },
          order: {
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              sellerId: true
            }
          }
        }
      });

      // Update seller's reputation score
      const sellerId = product.sellerId;
      const sellerReviews = await tx.review.findMany({
        where: {
          product: {
            sellerId: sellerId
          }
        }
      });

      const totalRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / sellerReviews.length;
      const reputationScore = Math.round(averageRating * 20); // Convert to 0-100 scale

      await tx.user.update({
        where: { id: sellerId },
        data: { reputationScore }
      });

      return review;
    });

    res.status(201).json({
      message: 'Review created successfully',
      review: result
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get all reviews with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      productId,
      reviewerId,
      orderId,
      rating,
      reviewType
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (productId) {
      where.productId = parseInt(productId);
    }

    if (reviewerId) {
      where.reviewerId = parseInt(reviewerId);
    }

    if (orderId) {
      where.orderId = parseInt(orderId);
    }

    if (rating) {
      where.rating = parseInt(rating);
    }

    if (reviewType) {
      where.reviewType = reviewType;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take,
        include: {
          reviewer: {
            select: {
              id: true,
              username: true,
              profileImageUrl: true,
              reputationScore: true
            }
          },
          order: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              quantityPurchased: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              seller: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.review.count({ where })
    ]);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get review statistics for a product
router.get('/product/:productId/stats', async (req, res) => {
  try {
    const { productId } = req.params;

    if (isNaN(parseInt(productId))) {
      return res.status(400).json({
        error: 'Invalid product ID'
      });
    }

    const reviews = await prisma.review.findMany({
      where: { productId: parseInt(productId) },
      select: { rating: true }
    });

    if (reviews.length === 0) {
      return res.json({
        stats: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          }
        }
      });
    }

    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    res.json({
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Error getting product review stats:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get review statistics for a seller
router.get('/seller/:sellerId/stats', async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (isNaN(parseInt(sellerId))) {
      return res.status(400).json({
        error: 'Invalid seller ID'
      });
    }

    const reviews = await prisma.review.findMany({
      where: {
        product: {
          sellerId: parseInt(sellerId)
        }
      },
      select: { rating: true }
    });

    if (reviews.length === 0) {
      return res.json({
        stats: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          }
        }
      });
    }

    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    res.json({
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Error getting seller review stats:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get review by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reviewId = parseInt(id);

    if (isNaN(reviewId)) {
      return res.status(400).json({
        error: 'Invalid review ID'
      });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            profileImageUrl: true,
            reputationScore: true
          }
        },
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            quantityPurchased: true,
            totalPrice: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true,
            seller: {
              select: {
                id: true,
                username: true,
                profileImageUrl: true
              }
            }
          }
        }
      }
    });

    if (!review) {
      return res.status(404).json({
        error: 'Review not found'
      });
    }

    res.json({ review });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update review
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, userId } = req.body;
    const reviewId = parseInt(id);

    if (isNaN(reviewId)) {
      return res.status(400).json({
        error: 'Invalid review ID'
      });
    }

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: {
          include: {
            seller: true
          }
        }
      }
    });

    if (!existingReview) {
      return res.status(404).json({
        error: 'Review not found'
      });
    }

    // Authorization check - only reviewer can update
    if (existingReview.reviewerId !== parseInt(userId)) {
      return res.status(403).json({
        error: 'Unauthorized to update this review'
      });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    // Update review and recalculate seller reputation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the review
      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data: {
          ...(rating && { rating: parseInt(rating) }),
          ...(comment !== undefined && { comment })
        },
        include: {
          reviewer: {
            select: {
              id: true,
              username: true,
              profileImageUrl: true,
              reputationScore: true
            }
          },
          order: {
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              seller: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          }
        }
      });

      // Recalculate seller's reputation score if rating was updated
      if (rating) {
        const sellerId = existingReview.product.sellerId;
        const sellerReviews = await tx.review.findMany({
          where: {
            product: {
              sellerId: sellerId
            }
          }
        });

        const totalRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / sellerReviews.length;
        const reputationScore = Math.round(averageRating * 20); // Convert to 0-100 scale

        await tx.user.update({
          where: { id: sellerId },
          data: { reputationScore }
        });
      }

      return updatedReview;
    });

    res.json({
      message: 'Review updated successfully',
      review: result
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Delete review
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const reviewId = parseInt(id);

    if (isNaN(reviewId)) {
      return res.status(400).json({
        error: 'Invalid review ID'
      });
    }

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: {
          include: {
            seller: true
          }
        }
      }
    });

    if (!existingReview) {
      return res.status(404).json({
        error: 'Review not found'
      });
    }

    // Authorization check - only reviewer can delete
    if (existingReview.reviewerId !== parseInt(userId)) {
      return res.status(403).json({
        error: 'Unauthorized to delete this review'
      });
    }

    // Delete review and recalculate seller reputation in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the review
      await tx.review.delete({
        where: { id: reviewId }
      });

      // Recalculate seller's reputation score
      const sellerId = existingReview.product.sellerId;
      const remainingReviews = await tx.review.findMany({
        where: {
          product: {
            sellerId: sellerId
          }
        }
      });

      let reputationScore = 50; // Default score
      if (remainingReviews.length > 0) {
        const totalRating = remainingReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / remainingReviews.length;
        reputationScore = Math.round(averageRating * 20); // Convert to 0-100 scale
      }

      await tx.user.update({
        where: { id: sellerId },
        data: { reputationScore }
      });
    });

    res.json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});



module.exports = router;
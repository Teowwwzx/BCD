'use client';

import React, { useState, useEffect } from 'react';
import { useReviews } from '../hooks/useReviews';
import { ReviewStatus } from '../types';

interface ProductReviewsProps {
  productId: number;
  currentUserId?: number;
  isAdmin?: boolean;
}

interface ReviewFormData {
  rating: number;
  title: string;
  review_text: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ 
  productId, 
  currentUserId, 
  isAdmin = false 
}) => {
  const {
    reviews,
    loading,
    error,
    reviewStats,
    fetchReviews,
    createReview,
    updateReviewStatus,
    getReviewStats,
  } = useReviews();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    rating: 5,
    title: '',
    review_text: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('approved');

  useEffect(() => {
    // Fetch reviews for this product
    fetchReviews(productId, undefined, isAdmin ? undefined : 'approved');
    // Fetch review statistics
    getReviewStats(productId);
  }, [productId, isAdmin]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      alert('Please log in to submit a review');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        product_id: productId,
        user_id: currentUserId,
        rating: reviewForm.rating,
        title: reviewForm.title,
        review_text: reviewForm.review_text,
      };

      const newReview = await createReview(reviewData);
      if (newReview) {
        setShowReviewForm(false);
        setReviewForm({ rating: 5, title: '', review_text: '' });
        // Refresh stats
        getReviewStats(productId);
        alert('Review submitted successfully! It will be visible after approval.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (reviewId: number, newStatus: ReviewStatus) => {
    if (!isAdmin) return;
    
    const updatedReview = await updateReviewStatus(reviewId, newStatus);
    if (updatedReview) {
      // Refresh reviews and stats
      fetchReviews(productId, undefined, filterStatus === 'all' ? undefined : filterStatus);
      getReviewStats(productId);
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-2xl ${
              interactive ? 'cursor-pointer hover:text-yellow-400' : 'cursor-default'
            } ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const renderReviewStats = () => {
    if (!reviewStats) return null;

    return (
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
        <div className="flex items-center space-x-4 mb-4">
          <div className="text-3xl font-bold">{reviewStats.averageRating.toFixed(1)}</div>
          {renderStars(Math.round(reviewStats.averageRating))}
          <div className="text-gray-600">({reviewStats.totalReviews} reviews)</div>
        </div>
        
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <span className="text-sm w-8">{rating}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{
                    width: `${reviewStats.totalReviews > 0 
                      ? (reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution] / reviewStats.totalReviews) * 100 
                      : 0}%`
                  }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-8">
                {reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReviewForm = () => {
    if (!showReviewForm) return null;

    return (
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
        <form onSubmit={handleSubmitReview}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            {renderStars(reviewForm.rating, true, (rating) => 
              setReviewForm(prev => ({ ...prev, rating }))
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={reviewForm.title}
              onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Summarize your experience"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={reviewForm.review_text}
              onChange={(e) => setReviewForm(prev => ({ ...prev, review_text: e.target.value }))}
              placeholder="Share your thoughts about this product"
              required
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderReviewItem = (review: any) => {
    return (
      <div key={review.id} className="border-b border-gray-200 py-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                {review.user.profileImageUrl ? (
                <img 
                  src={review.user.profileImageUrl} 
                  alt={review.user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {review.user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">{review.user.username}</div>
                <div className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
              {review.is_verified_purchase && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Verified Purchase
                </span>
              )}
            </div>
            
            <div className="mb-2">
              {renderStars(review.rating)}
            </div>
            
            {review.title && (
              <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
            )}
            
            {review.review_text && (
              <p className="text-gray-700 mb-3">{review.review_text}</p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Status: 
                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                  review.status === 'approved' ? 'bg-green-100 text-green-800' :
                  review.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {review.status}
                </span>
              </span>
              {review.helpful_count > 0 && (
                <span>{review.helpful_count} people found this helpful</span>
              )}
            </div>
          </div>
          
          {isAdmin && (
            <div className="ml-4 space-x-2">
              <select
                value={review.status}
                onChange={(e) => handleStatusChange(review.id, e.target.value as ReviewStatus)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={ReviewStatus.Pending}>Pending</option>
                <option value={ReviewStatus.Approved}>Approved</option>
                <option value={ReviewStatus.Rejected}>Rejected</option>
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {renderReviewStats()}
      
      {/* Admin Controls */}
      {isAdmin && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              fetchReviews(productId, undefined, e.target.value === 'all' ? undefined : e.target.value);
            }}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="all">All Reviews</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}
      
      {/* Write Review Button */}
      {currentUserId && !isAdmin && (
        <div className="mb-6">
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Write a Review
          </button>
        </div>
      )}
      
      {renderReviewForm()}
      
      {/* Reviews List */}
      <div className="bg-white rounded-lg">
        <h3 className="text-lg font-semibold p-6 border-b border-gray-200">
          Reviews ({reviews.length})
        </h3>
        
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            Error: {error}
          </div>
        )}
        
        {reviews.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No reviews yet. Be the first to review this product!
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reviews.map(renderReviewItem)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
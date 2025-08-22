import { useState, useEffect } from 'react';
import type { Review, ReviewStatus } from '../types';

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface CreateReviewData {
  product_id: number;
  user_id: number;
  order_item_id?: number;
  rating: number;
  title?: string;
  review_text?: string;
}

interface UpdateReviewData {
  rating?: number;
  title?: string;
  review_text?: string;
  status?: ReviewStatus;
}

interface UseReviewsReturn {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  reviewStats: ReviewStats | null;
  fetchReviews: (productId?: number, userId?: number, status?: string) => Promise<void>;
  createReview: (reviewData: CreateReviewData) => Promise<Review | null>;
  updateReview: (id: number, reviewData: UpdateReviewData) => Promise<Review | null>;
  deleteReview: (id: number, userId: number) => Promise<boolean>;
  getReviewStats: (productId: number) => Promise<ReviewStats | null>;
  updateReviewStatus: (id: number, status: ReviewStatus) => Promise<Review | null>;
  getReviewById: (id: number) => Promise<Review | null>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useReviews = (): UseReviewsReturn => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);

  const handleApiCall = async <T>(apiCall: () => Promise<Response>): Promise<T | null> => {
    try {
      setError(null);
      const response = await apiCall();
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API call failed');
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('API call error:', errorMessage);
      return null;
    }
  };

  const fetchReviews = async (productId?: number, userId?: number, status?: string): Promise<void> => {
    setLoading(true);
    
    const params = new URLSearchParams();
    if (productId) params.append('productId', productId.toString());
    if (userId) params.append('userId', userId.toString());
    if (status) params.append('status', status);
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/reviews${queryString ? `?${queryString}` : ''}`;
    
    const data = await handleApiCall<{reviews: Review[], pagination: any}>(() => fetch(url));
    
    if (data && data.reviews) {
      setReviews(data.reviews);
    }
    
    setLoading(false);
  };

  const createReview = async (reviewData: CreateReviewData): Promise<Review | null> => {
    const data = await handleApiCall<Review>(() =>
      fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      })
    );
    
    if (data) {
      setReviews(prev => [data, ...prev]);
    }
    
    return data;
  };

  const updateReview = async (id: number, reviewData: UpdateReviewData): Promise<Review | null> => {
    const data = await handleApiCall<Review>(() =>
      fetch(`${API_BASE_URL}/reviews/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      })
    );
    
    if (data) {
      setReviews(prev => prev.map(review => review.id === id ? data : review));
    }
    
    return data;
  };

  const deleteReview = async (id: number, userId: number): Promise<boolean> => {
    const success = await handleApiCall<boolean>(() =>
      fetch(`${API_BASE_URL}/reviews/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      })
    );
    
    if (success) {
      setReviews(prev => prev.filter(review => review.id !== id));
      return true;
    }
    
    return false;
  };

  const getReviewStats = async (productId: number): Promise<ReviewStats | null> => {
    const data = await handleApiCall<ReviewStats>(() =>
      fetch(`${API_BASE_URL}/reviews/product/${productId}/stats`)
    );
    
    if (data) {
      setReviewStats(data);
    }
    
    return data;
  };

  const updateReviewStatus = async (id: number, status: ReviewStatus): Promise<Review | null> => {
    const data = await handleApiCall<Review>(() =>
      fetch(`${API_BASE_URL}/reviews/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
    );
    
    if (data) {
      setReviews(prev => prev.map(review => review.id === id ? data : review));
    }
    
    return data;
  };

  const getReviewById = async (id: number): Promise<Review | null> => {
    const data = await handleApiCall<Review>(() =>
      fetch(`${API_BASE_URL}/reviews/${id}`)
    );
    
    return data;
  };

  return {
    reviews,
    loading,
    error,
    reviewStats,
    fetchReviews,
    createReview,
    updateReview,
    deleteReview,
    getReviewStats,
    updateReviewStatus,
    getReviewById,
  };
};

export default useReviews;
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useReviews } from '../../../hooks/useReviews';
import { useSeller } from '../../../hooks/useSeller';
import { UserRole, Review } from '../../../types';
import { useRouter } from 'next/navigation';

const SReviews: React.FC = () => {
  // 1. State Hooks
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 2. Context Hooks
  const { user, authIsLoading } = useAuth();
  const { products, fetchProducts } = useSeller();
  const {
    reviews,
    loading: reviewsLoading,
    error,
    fetchReviews,
    deleteReview,
  } = useReviews();
  const router = useRouter();

  // 3. Effect Hooks
  useEffect(() => {
    if (!authIsLoading) {
      if (!user) {
        router.push('/auth');
        return;
      }
      if (user.user_role !== UserRole.Seller && user.user_role !== UserRole.Admin) {
        router.push('/sell');
        return;
      }
    }
  }, [user, authIsLoading, router]);

  useEffect(() => {
    if (user && (user.user_role === UserRole.Seller || user.user_role === UserRole.Admin)) {
      fetchProducts();
    }
  }, [user, fetchProducts]);

  useEffect(() => {
    if (products.length > 0) {
      // Fetch reviews for all S's products
      const productIds = products.map(p => p.id);
      // For now, fetch all reviews and filter client-side
      // In a real app, you'd want to modify the API to support S-specific filtering
      fetchReviews(undefined, undefined, filterStatus === 'all' ? undefined : filterStatus);
    }
  }, [products, filterStatus, fetchReviews]);

  // 4. Performance Hooks
  const SProductIds = useMemo(() => {
    return new Set(products.map(p => p.id));
  }, [products]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review: Review) => {
      // Only show reviews for S's products
      if (!SProductIds.has(review.product_id)) {
        return false;
      }

      const matchesSearch = searchTerm === '' ||
        review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.review_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.user.username.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProduct = selectedProduct === '' ||
        review.product_id.toString() === selectedProduct;

      return matchesSearch && matchesProduct;
    });
  }, [reviews, SProductIds, searchTerm, selectedProduct]);

  

  const productNameMap = useMemo(() => {
    return new Map(products.map(product => [product.id, product.name]));
  }, [products]);

  const getProductName = useCallback((productId: number): string => {
    return productNameMap.get(productId) || 'Unknown Product';
  }, [productNameMap]);

  const handleDeleteReview = useCallback(async (): Promise<void> => {
    if (!reviewToDelete || !user) return;

    setIsDeleting(true);
    try {
      const success = await deleteReview(reviewToDelete, user.id);
      if (success) {
        setShowDeleteModal(false);
        setReviewToDelete(null);
        // Refresh reviews
        fetchReviews(undefined, undefined, filterStatus === 'all' ? undefined : filterStatus);
      }
    } catch (err) {
      console.error('Error deleting review:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [reviewToDelete, user, deleteReview, fetchReviews]);

  const renderStars = useCallback((rating: number): JSX.Element => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-sm text-gray-600 ml-2">{rating}/5</span>
      </div>
    );
  }, []);

  const renderReviewCard = useCallback((review: Review): JSX.Element => {
    const productName = getProductName(review.product_id);
    
    return (
      <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                {review.user.profileImageUrl ? (
                  <img 
                    src={review.user.profileImageUrl} 
                    alt={review.user.username}
                    className="w-10 h-10 rounded-full object-cover"
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
            
            <div className="mb-3">
              <div className="text-sm text-gray-600 mb-1">
                Product: <span className="font-medium">{productName}</span>
              </div>
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
          
          <div className="ml-4">
            <button
              onClick={() => {
                setReviewToDelete(review.id);
                setShowDeleteModal(true);
              }}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }, [getProductName, renderStars, setReviewToDelete, setShowDeleteModal]);

  if (authIsLoading || reviewsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || (user.user_role !== UserRole.Seller && user.user_role !== UserRole.Admin)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need to be a Seller or Admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product Reviews</h1>
          <p className="mt-2 text-gray-600">
            Manage reviews for your products. You can delete inappropriate or spam reviews.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Reviews</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Products</option>
                {products.map(product => (
                  <option key={product.id} value={product.id.toString()}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Reviews
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, content, or username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="text-red-700">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Reviews ({filteredReviews.length})
            </h2>
            <button
              onClick={() => fetchReviews(undefined, undefined, filterStatus === 'all' ? undefined : filterStatus)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <div className="text-gray-500">
                {searchTerm || selectedProduct ? 'No reviews match your filters.' : 'No reviews found for your products.'}
              </div>
            </div>
          ) : (
            <div>
              {filteredReviews.map(renderReviewCard)}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Review
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteReview}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setReviewToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SReviews;
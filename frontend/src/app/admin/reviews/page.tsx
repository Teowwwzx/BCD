'use client';

import React, { useState, useEffect } from 'react';
import { useReviews } from '../../../hooks/useReviews';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

interface AdminReviewsPageProps { }

const AdminReviewsPage: React.FC<AdminReviewsPageProps> = () => {
  const {
    reviews,
    loading,
    error,
    fetchReviews,
    updateReviewStatus,
  } = useReviews();

  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  useEffect(() => {
    // Fetch all reviews for admin view
    fetchReviews(undefined, undefined, filterStatus === 'all' ? undefined : filterStatus);
  }, [filterStatus]);

  const handleStatusChange = async (reviewId: number, newStatus: 'pending' | 'approved' | 'rejected') => {
    const updatedReview = await updateReviewStatus(reviewId, newStatus);
    if (updatedReview) {
      // Refresh the reviews list
      fetchReviews(undefined, undefined, filterStatus === 'all' ? undefined : filterStatus);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchTerm === '' ||
      review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.review_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProduct = selectedProduct === '' ||
      review.product_id.toString() === selectedProduct;

    return matchesSearch && matchesProduct;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderReviewCard = (review: any) => {
    return (
      <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
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
                Product ID: {review.product_id} • {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(review.status)}`}>
              {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
            </span>
            {review.is_verified_purchase && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Verified
              </span>
            )}
          </div>
        </div>

        <div className="mb-3">
          {renderStars(review.rating)}
        </div>

        {review.title && (
          <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>
        )}

        {review.review_text && (
          <p className="text-gray-700 mb-4">{review.review_text}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Review ID: {review.id}
            {review.helpful_count > 0 && (
              <span className="ml-4">{review.helpful_count} helpful votes</span>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusChange(review.id, 'approved')}
              disabled={review.status === 'approved'}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Approve
            </button>
            <button
              onClick={() => handleStatusChange(review.id, 'rejected')}
              disabled={review.status === 'rejected'}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject
            </button>
            <button
              onClick={() => handleStatusChange(review.id, 'pending')}
              disabled={review.status === 'pending'}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pending
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getStatusCounts = () => {
    const counts = {
      all: reviews.length,
      pending: reviews.filter(r => r.status === 'pending').length,
      approved: reviews.filter(r => r.status === 'approved').length,
      rejected: reviews.filter(r => r.status === 'rejected').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Management</h1>
          <p className="text-gray-600">Moderate and manage product reviews</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
            <div className="text-sm text-gray-600">Total Reviews</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
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
                Search Reviews
              </label>
              <input
                type="text"
                placeholder="Search by title, content, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Product ID
              </label>
              <input
                type="text"
                placeholder="Enter product ID..."
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
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
                {searchTerm || selectedProduct ? 'No reviews match your filters.' : 'No reviews found.'}
              </div>
            </div>
          ) : (
            <div>
              {filteredReviews.map(renderReviewCard)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviewsPage;
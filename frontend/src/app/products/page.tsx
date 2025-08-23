// frontend/src/app/products/page.tsx

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts, DisplayProduct } from '../../hooks/useProducts';
import { ProductsParams } from '../../types';
import { useCart } from '../../contexts/CartContext';
import ProductCard from '../../components/ProductCard';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { SuccessModal } from '../../components/Modal';
import Pagination from '../../components/Pagination';

export default function ProductsPage() {
    // 1. State Hooks
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt-desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [addedProduct, setAddedProduct] = useState<DisplayProduct | null>(null);

    // 2. Context Hooks
    const router = useRouter();
    const { addToCart, loading: cartLoading } = useCart();

    // Prepare params for useProducts hook
    // Already implemented with pagination
    const productsParams: ProductsParams = {
        page: currentPage,
        limit: 12,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchTerm || undefined,
        sortBy
    };

    const { allProducts: products, loading, error, pagination, fetchProducts } = useProducts(productsParams);

    // 3. Effect Hooks - None needed as useProducts handles the fetching

    // 4. Performance Hooks
    // Categories for filter dropdown (simplified - could be fetched from API)
    const categories = useMemo(() => {
        return [
            { label: 'All Categories', value: 'all' },
            { label: 'Electronics', value: 'Electronics' },
            { label: 'Clothing', value: 'Clothing' },
            { label: 'Books', value: 'Books' },
            { label: 'Home & Garden', value: 'Home & Garden' },
            { label: 'Sports', value: 'Sports' }
        ];
    }, []);

    // Handle filter/search changes
    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
        setCurrentPage(1); // Reset to first page when searching
    }, []);

    const handleCategoryChange = useCallback((value: string) => {
        setSelectedCategory(value);
        setCurrentPage(1); // Reset to first page when filtering
    }, []);

    const handleSortChange = useCallback((value: string) => {
        setSortBy(value);
        setCurrentPage(1); // Reset to first page when sorting
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleAddToCart = async (product: DisplayProduct) => {
        if (product.isBlockchain) {
            alert("On-chain assets must be purchased directly from their detail page.");
            router.push(`/products/${product.id}`);
            return;
        }
        try {
            const dbId = parseInt(product.id.replace('db-', ''));
            await addToCart(dbId, 1, product.quantity);
            setAddedProduct(product);
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Add to cart error:', err);
            // Error handling is already done in the CartContext
        }
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        setAddedProduct(null);
    };

    const handleViewCart = () => {
        setShowSuccessModal(false);
        setAddedProduct(null);
        router.push('/cart');
    };

    if (loading) {
        return (
            <div className="bg-gray-900 min-h-screen">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-900 min-h-screen">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                    Error loading products
                                </h3>
                                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                    {error}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="bg-gray-900 min-h-screen">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-white mb-8">All Products</h1>

                {/* Filters and Search */}
                <div className="bg-gray-800 rounded-lg p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-2">
                                Search Products
                            </label>
                            <input
                                type="text"
                                id="search"
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Search by name or seller..."
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                id="category"
                                value={selectedCategory}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {categories.map(category => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort */}
                        <div>
                            <label htmlFor="sort" className="block text-sm font-medium text-gray-300 mb-2">
                                Sort By
                            </label>
                            <select
                                id="sort"
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="createdAt-desc">Newest First</option>
                                <option value="name">Name (A-Z)</option>
                                <option value="price-asc">Price (Low to High)</option>
                                <option value="price-desc">Price (High to Low)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                {products.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">📦</div>
                        <h3 className="text-lg font-medium text-white mb-2">No products found</h3>
                        <p className="text-gray-400">
                            {searchTerm || selectedCategory !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'No products available at the moment'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                            {products.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product as DisplayProduct}
                                    onAddToCart={() => handleAddToCart(product)}
                                    cartLoading={cartLoading}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && (
                            <Pagination
                                pagination={pagination}
                                onPageChange={handlePageChange}
                                className="mt-8"
                            />
                        )}
                    </>
                )}
            </div>
            <Footer />
            {showSuccessModal && addedProduct && (
                <SuccessModal
                    isOpen={showSuccessModal}
                    onClose={handleSuccessModalClose}
                    title="Added to Cart!"
                    message={`${addedProduct.name} has been added to your cart.`}
                    actionText="View Cart"
                    onAction={handleViewCart}
                />
            )}
        </div>
    );
}
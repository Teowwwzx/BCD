// frontend/src/app/seller/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; // Updated to useAuth
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Modal from '../../components/Modal'; // 1. Import our Modal component
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';


// Assuming a Product type, which should be moved to types/index.ts
interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  sales: number;
  revenue: string;
  dateAdded: string;
}

// ... (Sale interface remains the same)

export default function SellPage() {
  const { isLoggedIn } = useAuth(); // Updated to useAuth
  const router = useRouter();
  
  // ... (existing state for tabs, products, sales, newProduct)
  const [products, setProducts] = useState<Product[]>([
      // ... same initial product data
  ]);

  // 2. Add state for the delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/auth');
    }
  }, [isLoggedIn, router]);
  
  if (!isLoggedIn) {
    // Return a loader to prevent flicker during redirect
    return <div>Loading...</div>;
  }
  
  // --- LOGIC FOR DELETE CONFIRMATION ---

  // 3. This function opens the modal and sets the product to be deleted
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  // 4. This function handles the actual deletion after confirmation
  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    
    // In a real application, you would call an API here:
    // await deleteProduct(productToDelete.id);
    console.log(`Deleting product: ${productToDelete.name} (ID: ${productToDelete.id})`);
    
    // For this example, we'll just filter it from the local state
    setProducts(products.filter(p => p.id !== productToDelete.id));

    // Close the modal and reset the state
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };
  
  // ... (other functions like getStatusColor, formatDate, etc. remain the same)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ... (Dashboard header and tabs) ... */}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Products</h2>
              {/* ... Add New Product Button ... */}
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                {/* ... table thead ... */}
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      {/* ... other table cells ... */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        {/* 5. Attach the onClick handler to the delete button */}
                        <button 
                          onClick={() => handleDeleteClick(product)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ... (Other tabs: Sales, Analytics) ... */}
      </div>

      {/* 6. Add the Modal component to the page */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Confirm Deletion"
      >
        <div>
          <p className="text-gray-300 mb-6">
            Are you sure you want to permanently delete the product: <strong className="text-white">{productToDelete?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-4">
            <button 
              onClick={() => setIsDeleteModalOpen(false)} 
              className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-500"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmDelete} 
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* ... (Add Product Modal) ... */}

      <Footer />
    </div>
  );
};
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

// Use the environment variable for the API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// =================================================================
// SELLER-SPECIFIC TYPES
// =================================================================

export interface SellerProduct {
  id: number;
  name: string;
  description?: string;
  price: string;
  category: string;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  sales: number;
  revenue: string;
  dateAdded: string;
}

export interface Sale {
  id: string;
  productName: string;
  buyer: string;
  amount: string;
  date: string;
  status: 'pending' | 'completed' | 'refunded';
}

export interface NewProductForm {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: number;
  images: File[];
}

export interface UseSellerReturn {
  // Data
  products: SellerProduct[];
  sales: Sale[];
  newProduct: NewProductForm;
  
  // UI State
  activeTab: string;
  showAddProduct: boolean;
  
  // Loading and Error States
  productsIsLoading: boolean;
  salesIsLoading: boolean;
  productsError: string | null;
  salesError: string | null;
  
  // Computed Values
  totalRevenue: number;
  totalSales: number;
  activeProducts: number;
  
  // State Setters
  setNewProduct: React.Dispatch<React.SetStateAction<NewProductForm>>;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  setShowAddProduct: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Actions
  handleAddProduct: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchSales: () => Promise<void>;
  
  // Utility Functions
  getStatusColor: (status: string) => string;
  formatDate: (dateString: string) => string;
}

// =================================================================
// THE HOOK
// =================================================================

// Global state to prevent multiple simultaneous API calls
let isProductsFetching = false;
let isSalesFetching = false;
let productsCache: SellerProduct[] = [];
let salesCache: Sale[] = [];
let lastProductsFetch = 0;
let lastSalesFetch = 0;
const CACHE_DURATION = 30000; // 30 seconds

export const useSeller = (): UseSellerReturn => {
  // 1. Context Hooks
  const { user, isLoggedIn } = useAuth();

  // 2. State Hooks
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products, setProducts] = useState<SellerProduct[]>(productsCache);
  const [sales, setSales] = useState<Sale[]>(salesCache);
  const [productsIsLoading, setProductsIsLoading] = useState(false);
  const [salesIsLoading, setSalesIsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [salesError, setSalesError] = useState<string | null>(null);
  
  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: 0,
    images: []
  });

  // 3. Callback Functions (declared before useEffect)
  const fetchProducts = useCallback(async () => {
    if (!user?.id || isProductsFetching) return;
    
    const now = Date.now();
    if (now - lastProductsFetch < CACHE_DURATION && productsCache.length > 0) {
      setProducts(productsCache);
      return;
    }
    
    isProductsFetching = true;
    setProductsIsLoading(true);
    setProductsError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/products?sellerId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      const transformedProducts: SellerProduct[] = data.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: `${product.price} ETH`,
        category: product.category,
        stock: product.quantity,
        status: product.status === 'active' && product.quantity > 0 ? 'active' : 
                product.quantity === 0 ? 'out_of_stock' : 'inactive',
        sales: 0,
        revenue: '0 ETH',
        dateAdded: product.created_at || new Date().toISOString()
      }));
      
      productsCache = transformedProducts;
      lastProductsFetch = now;
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProductsError(error instanceof Error ? error.message : 'Failed to fetch products');
      setProducts([]);
    } finally {
      setProductsIsLoading(false);
      isProductsFetching = false;
    }
  }, [user?.id]);
  
  const fetchSales = useCallback(async () => {
    if (!user?.id || isSalesFetching) return;
    
    const now = Date.now();
    if (now - lastSalesFetch < CACHE_DURATION && salesCache.length > 0) {
      setSales(salesCache);
      return;
    }
    
    isSalesFetching = true;
    setSalesIsLoading(true);
    setSalesError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/orders?sellerId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sales');
      }
      
      const data = await response.json();
      const transformedSales: Sale[] = data.map((order: any) => ({
        id: order.id.toString(),
        productName: order.product_name || 'Unknown Product',
        buyer: order.buyer_name || 'Unknown Buyer',
        amount: `${order.total_amount} ETH`,
        date: order.created_at || new Date().toISOString(),
        status: order.status === 'completed' ? 'completed' : 
                order.status === 'refunded' ? 'refunded' : 'pending'
      }));
      
      salesCache = transformedSales;
      lastSalesFetch = now;
      setSales(transformedSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSalesError(error instanceof Error ? error.message : 'Failed to fetch sales');
      setSales([]);
    } finally {
      setSalesIsLoading(false);
      isSalesFetching = false;
    }
  }, [user?.id]);

  // 4. Effect Hooks
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      fetchProducts();
      fetchSales();
    }
  }, [isLoggedIn, user?.id, fetchProducts, fetchSales]);

  // 5. Performance Hooks (useCallback for other functions)

  const handleAddProduct = useCallback(async () => {
    if (!user?.id) {
      alert('You must be logged in to add products');
      return;
    }
    
    try {
      // TODO: Implement actual API call to create product
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        quantity: newProduct.stock,
        sellerId: user.id,
        categoryId: 1, // TODO: Map category name to ID
        status: 'published'
      };
      
      console.log('Adding new product:', productData);
      alert('Product will be added to the blockchain marketplace');
      
      // Reset form and close modal
      setShowAddProduct(false);
      setNewProduct({ 
        name: '', 
        description: '', 
        price: '', 
        category: '', 
        stock: 0, 
        images: [] 
      });
      
      // Refresh products list
      await fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    }
  }, [newProduct, user?.id, fetchProducts]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // 5. Computed Values
  const totalRevenue = products.reduce((sum, product) => {
    return sum + parseFloat(product.revenue.replace(' ETH', ''));
  }, 0);

  const totalSales = products.reduce((sum, product) => sum + product.sales, 0);
  const activeProducts = products.filter(p => p.status === 'active').length;

  return {
    // Data
    products,
    sales,
    newProduct,
    
    // UI State
    activeTab,
    showAddProduct,
    
    // Loading and Error States
    productsIsLoading,
    salesIsLoading,
    productsError,
    salesError,
    
    // Computed Values
    totalRevenue,
    totalSales,
    activeProducts,
    
    // State Setters
    setNewProduct,
    setActiveTab,
    setShowAddProduct,
    
    // Actions
    handleAddProduct,
    fetchProducts,
    fetchSales,
    
    // Utility Functions
    getStatusColor,
    formatDate,
  };
};
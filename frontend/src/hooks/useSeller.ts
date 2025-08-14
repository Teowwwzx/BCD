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

export const useSeller = (): UseSellerReturn => {
  // 1. Context Hooks
  const { user, isLoggedIn } = useAuth();

  // 2. State Hooks
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
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

  // 3. Effect Hooks
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      fetchProducts();
      fetchSales();
    }
  }, [isLoggedIn, user?.id]);

  // 4. Performance Hooks (useCallback)
  const fetchProducts = useCallback(async () => {
    if (!user?.id) return;
    
    setProductsIsLoading(true);
    setProductsError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/products?sellerId=${user.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform API data to SellerProduct format
      const transformedProducts: SellerProduct[] = data.products?.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: `${product.price} ETH`,
        category: product.category?.name || 'Uncategorized',
        stock: product.quantity || 0,
        status: product.quantity > 0 ? 'active' : 'out_of_stock',
        sales: 0, // TODO: Get from orders/sales data
        revenue: '0 ETH', // TODO: Calculate from sales
        dateAdded: product.createdAt || new Date().toISOString()
      })) || [];
      
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProductsError(error instanceof Error ? error.message : 'Failed to fetch products');
      
      // Fallback to mock data for development
      setProducts([
        {
          id: 1,
          name: "Premium Wireless Headphones",
          price: "0.15 ETH",
          category: "Electronics",
          stock: 25,
          status: 'active',
          sales: 12,
          revenue: "1.8 ETH",
          dateAdded: "2024-01-10"
        },
        {
          id: 2,
          name: "Smart Fitness Watch",
          price: "0.08 ETH",
          category: "Electronics",
          stock: 0,
          status: 'out_of_stock',
          sales: 8,
          revenue: "0.64 ETH",
          dateAdded: "2024-01-05"
        },
        {
          id: 3,
          name: "Organic Coffee Beans",
          price: "0.02 ETH",
          category: "Food & Beverage",
          stock: 50,
          status: 'active',
          sales: 25,
          revenue: "0.5 ETH",
          dateAdded: "2023-12-20"
        }
      ]);
    } finally {
      setProductsIsLoading(false);
    }
  }, [user?.id]);

  const fetchSales = useCallback(async () => {
    if (!user?.id) return;
    
    setSalesIsLoading(true);
    setSalesError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/orders?sellerId=${user.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sales: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform API data to Sale format
      const transformedSales: Sale[] = data.orders?.map((order: any) => ({
        id: order.uuid || order.id,
        productName: order.orderItems?.[0]?.product_name || 'Unknown Product',
        buyer: `${order.buyer?.username || 'Unknown'}`,
        amount: `${order.totalAmount} ETH`,
        date: order.createdAt,
        status: order.order_status === 'completed' ? 'completed' : 'pending'
      })) || [];
      
      setSales(transformedSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSalesError(error instanceof Error ? error.message : 'Failed to fetch sales');
      
      // Fallback to mock data for development
      setSales([
        {
          id: "SALE-001",
          productName: "Premium Wireless Headphones",
          buyer: "0xabcd...1234",
          amount: "0.15 ETH",
          date: "2024-01-20",
          status: 'completed'
        },
        {
          id: "SALE-002",
          productName: "Smart Fitness Watch",
          buyer: "0xefgh...5678",
          amount: "0.08 ETH",
          date: "2024-01-19",
          status: 'pending'
        },
        {
          id: "SALE-003",
          productName: "Organic Coffee Beans",
          buyer: "0xijkl...9012",
          amount: "0.02 ETH",
          date: "2024-01-18",
          status: 'completed'
        }
      ]);
    } finally {
      setSalesIsLoading(false);
    }
  }, [user?.id]);

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
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
  productId?: number | null;
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
  imageUrl?: string; // optional direct URL
}

export interface UseSellerReturn {
  // Data
  products: SellerProduct[];
  sales: Sale[];
  newProduct: NewProductForm;
  editProduct: NewProductForm | null;
  
  // UI State
  activeTab: string;
  showAddProduct: boolean;
  showEditProduct: boolean;
  
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
  setEditProduct: React.Dispatch<React.SetStateAction<NewProductForm | null>>;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  setShowAddProduct: React.Dispatch<React.SetStateAction<boolean>>;
  setShowEditProduct: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Actions
  handleAddProduct: () => Promise<void>;
  handleEditProduct: (product: SellerProduct) => void;
  handleUpdateProduct: () => Promise<void>;
  handleDeleteProduct: (productId: number) => Promise<void>;
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
  const [showEditProduct, setShowEditProduct] = useState(false);
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
    images: [],
    imageUrl: ''
  });
  const [editProduct, setEditProduct] = useState<NewProductForm | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

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
      
      const result = await response.json();
      const list = Array.isArray(result) ? result : (result.data || []);
      const transformedProducts: SellerProduct[] = list.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: `${Number(product.price)} ETH`,
        category: product.category?.name || 'Uncategorized',
        stock: product.quantity ?? 0,
        status: product.quantity > 0 && product.status === 'published' ? 'active' : (product.quantity === 0 ? 'out_of_stock' : 'inactive'),
        sales: 0,
        revenue: '0 ETH',
        dateAdded: product.createdAt || new Date().toISOString()
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
      // Use seller_id (snake_case) per backend API
      const response = await fetch(`${API_BASE_URL}/orders?seller_id=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sales');
      }
      
      const result = await response.json();
      const orders = Array.isArray(result) ? result : (result.data || []);
  
      // Flatten order items that belong to this seller
      const transformedSales: Sale[] = [];
      for (const order of orders) {
        const buyerName = order.users?.username || 'Unknown Buyer';
        const createdDate = order.createdAt || new Date().toISOString();
        const orderStatus = order.order_status || order.status;
        const paymentStatus = order.payment_status;
        const mappedStatus: Sale['status'] = orderStatus === 'refunded'
          ? 'refunded'
          : (orderStatus === 'delivered' || orderStatus === 'confirmed' || paymentStatus === 'paid')
            ? 'completed'
            : 'pending';
        const items = order.orderItems || [];
        for (const item of items) {
          if (item.seller_id === user.id) {
            const amountNum = Number(item.totalPrice ?? item.total_price ?? 0);
            transformedSales.push({
              id: `${order.id}-${item.id}`,
              productId: item.productId ?? item.product?.id ?? null,
              productName: item.product?.name || item.product_name || 'Unknown Product',
              buyer: buyerName,
              amount: `${amountNum} ETH`,
              date: createdDate,
              status: mappedStatus,
            });
          }
        }
      }
      
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
  
    // Basic validation
    if (!newProduct.name || !newProduct.description || !newProduct.price || !newProduct.category || newProduct.stock <= 0) {
      alert('Please fill in all required fields and ensure stock is greater than 0.');
      return;
    }
    
    try {
      // 1) Fetch categories and find the matching one by name (case-insensitive)
      const catRes = await fetch(`${API_BASE_URL}/categories`);
      if (!catRes.ok) throw new Error('Failed to load categories');
      const catJson = await catRes.json();
      const categories = Array.isArray(catJson) ? catJson : (catJson.data || []);
      const match = categories.find((c: any) => (c.name || '').toLowerCase() === newProduct.category.toLowerCase());
      if (!match) {
        alert('Selected category not found. Please choose a valid category.');
        return;
      }
  
      const payload = {
        sellerId: user.id,
        categoryId: match.id,
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        quantity: newProduct.stock,
        status: 'published',
        ...(newProduct.imageUrl ? { imageUrl: newProduct.imageUrl } : {})
      };
  
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create product');
      }
  
      alert('Product created successfully');
  
      // Reset form and close modal
      setShowAddProduct(false);
      setNewProduct({ name: '', description: '', price: '', category: '', stock: 0, images: [], imageUrl: '' });
  
      // Invalidate caches and refresh
      productsCache = [];
      await fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      alert(error instanceof Error ? error.message : 'Failed to add product. Please try again.');
    }
  }, [newProduct, user?.id, fetchProducts]);

  const handleEditProduct = useCallback((product: SellerProduct) => {
    // Prepare edit form data mapped from SellerProduct
    const priceValue = String(parseFloat(product.price.replace(' ETH', '')) || '');
    setEditProduct({
      name: product.name,
      description: product.description || '',
      price: priceValue,
      category: product.category,
      stock: product.stock,
      images: [],
      imageUrl: ''
    });
    setEditingProductId(product.id);
    setShowEditProduct(true);
  }, []);

  const handleUpdateProduct = useCallback(async () => {
    if (!user?.id || !editProduct) return;

    try {
      // 1) Find categoryId by name
      const catRes = await fetch(`${API_BASE_URL}/categories`);
      const categories = await catRes.json();
      const cats = Array.isArray(categories) ? categories : (categories.data || []);
      const matchedCategory = cats.find((c: any) => String(c.name).toLowerCase() === String(editProduct.category).toLowerCase());
      const categoryId = matchedCategory?.id;

      // 2) Use the selected product id stored when opening the edit modal
      const productId = editingProductId;
      if (!productId) {
        alert('No product selected to update.');
        return;
      }

      const payload: any = {
        name: editProduct.name,
        description: editProduct.description,
        price: parseFloat(editProduct.price),
        quantity: editProduct.stock,
      };
      if (categoryId) payload.categoryId = categoryId;

      const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to update product');
      }

      setShowEditProduct(false);
      setEditProduct(null);
      setEditingProductId(null);
      // Invalidate cache so the next fetch reflects updated data immediately
      productsCache = [];
      lastProductsFetch = 0;
      await fetchProducts();
      alert('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      alert(error instanceof Error ? error.message : 'Failed to update product. Please try again.');
    }
  }, [editProduct, user?.id, fetchProducts, editingProductId]);

  const handleDeleteProduct = useCallback(async (productId: number) => {
    if (!productId) return;
    const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to delete this product? This action cannot be undone.') : true;
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`, { method: 'DELETE' });
      const text = await res.text();
      let json: any;
      try { json = JSON.parse(text); } catch { json = { success: res.ok, error: text }; }
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || 'Failed to delete product');
      }
      // Invalidate cache and refresh list
      productsCache = [];
      lastProductsFetch = 0;
      await fetchProducts();
      alert('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete product.');
    }
  }, [fetchProducts]);

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
  const completedSales = sales.filter(s => s.status === 'completed');
  const totalRevenue = completedSales.reduce((sum, s) => sum + (parseFloat(String(s.amount).replace(' ETH', '')) || 0), 0);
  const totalSales = completedSales.length;
  const activeProducts = products.filter(p => p.status === 'active').length;

  // Enhance products with per-product sales and revenue
  const salesByProduct = new Map<number, { count: number; revenue: number }>();
  for (const s of completedSales) {
    if (s.productId != null) {
      const prev = salesByProduct.get(s.productId) || { count: 0, revenue: 0 };
      prev.count += 1;
      prev.revenue += (parseFloat(String(s.amount).replace(' ETH', '')) || 0);
      salesByProduct.set(s.productId, prev);
    }
  }
  const enhancedProducts = products.map(p => {
    const stat = salesByProduct.get(p.id) || { count: 0, revenue: 0 };
    return {
      ...p,
      sales: stat.count,
      revenue: `${stat.revenue.toFixed(2)} ETH`,
    } as SellerProduct;
  });

  return {
    // Data
    products: enhancedProducts,
    sales,
    newProduct,
    editProduct,
    
    // UI State
    activeTab,
    showAddProduct,
    showEditProduct,
    
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
    setEditProduct,
    setActiveTab,
    setShowAddProduct,
    setShowEditProduct,
    
    // Actions
    handleAddProduct,
    handleEditProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    fetchProducts,
    fetchSales,
    
    // Utility Functions
    getStatusColor,
    formatDate,
  };
};
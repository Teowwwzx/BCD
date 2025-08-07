// Mock Database Service for Cart Functionality
// This simulates database operations when the actual database is not available

class MockDatabase {
  constructor() {
    // In-memory storage
    this.users = [
      { id: 1, username: 'john_doe', email: 'john@example.com', role: 'Buyer' },
      { id: 2, username: 'jane_seller', email: 'jane@example.com', role: 'Seller' }
    ];
    
    this.products = [
      {
        id: 1,
        sellerId: 2,
        categoryId: 1,
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 99.99,
        quantity: 50,
        status: 'active',
        images: [{ imageUrl: '/api/placeholder/300/300', altText: 'Headphones' }]
      },
      {
        id: 2,
        sellerId: 2,
        categoryId: 1,
        name: 'Smart Watch',
        description: 'Feature-rich smartwatch with health monitoring',
        price: 199.99,
        quantity: 30,
        status: 'active',
        images: [{ imageUrl: '/api/placeholder/300/300', altText: 'Smart Watch' }]
      },
      {
        id: 3,
        sellerId: 2,
        categoryId: 2,
        name: 'Laptop Stand',
        description: 'Ergonomic laptop stand for better posture',
        price: 49.99,
        quantity: 25,
        status: 'active',
        images: [{ imageUrl: '/api/placeholder/300/300', altText: 'Laptop Stand' }]
      }
    ];
    
    this.cartItems = [];
    this.nextCartItemId = 1;
  }

  // Cart operations
  async getCartItems(userId) {
    const userCartItems = this.cartItems.filter(item => item.userId === userId);
    
    // Populate with product data
    const populatedItems = userCartItems.map(cartItem => {
      const product = this.products.find(p => p.id === cartItem.productId);
      return {
        ...cartItem,
        product: product || null
      };
    }).filter(item => item.product !== null);

    return populatedItems;
  }

  async addToCart(userId, productId, quantity = 1) {
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.quantity < quantity) {
      throw new Error('Insufficient product quantity');
    }

    // Check if item already exists in cart
    const existingItemIndex = this.cartItems.findIndex(
      item => item.userId === userId && item.productId === productId
    );

    if (existingItemIndex !== -1) {
      // Update existing item
      const newQuantity = this.cartItems[existingItemIndex].quantity + quantity;
      
      if (product.quantity < newQuantity) {
        throw new Error('Insufficient product quantity for requested amount');
      }

      this.cartItems[existingItemIndex].quantity = newQuantity;
      this.cartItems[existingItemIndex].updatedAt = new Date();
      
      return {
        ...this.cartItems[existingItemIndex],
        product
      };
    } else {
      // Create new cart item
      const newCartItem = {
        id: this.nextCartItemId++,
        userId,
        productId,
        quantity,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.cartItems.push(newCartItem);
      
      return {
        ...newCartItem,
        product
      };
    }
  }

  async updateCartItem(userId, productId, quantity) {
    const itemIndex = this.cartItems.findIndex(
      item => item.userId === userId && item.productId === productId
    );

    if (itemIndex === -1) {
      throw new Error('Cart item not found');
    }

    if (quantity <= 0) {
      // Remove item
      this.cartItems.splice(itemIndex, 1);
      return null;
    }

    const product = this.products.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.quantity < quantity) {
      throw new Error('Insufficient product quantity');
    }

    this.cartItems[itemIndex].quantity = quantity;
    this.cartItems[itemIndex].updatedAt = new Date();

    return {
      ...this.cartItems[itemIndex],
      product
    };
  }

  async removeFromCart(userId, productId) {
    const itemIndex = this.cartItems.findIndex(
      item => item.userId === userId && item.productId === productId
    );

    if (itemIndex === -1) {
      return false;
    }

    this.cartItems.splice(itemIndex, 1);
    return true;
  }

  async clearCart(userId) {
    this.cartItems = this.cartItems.filter(item => item.userId !== userId);
    return true;
  }

  async getCartCount(userId) {
    const userCartItems = this.cartItems.filter(item => item.userId === userId);
    return userCartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Simulate product quantity deduction (like Shopee)
  async deductProductQuantity(productId, quantity) {
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.quantity < quantity) {
      throw new Error('Insufficient product quantity');
    }

    product.quantity -= quantity;
    return product;
  }

  // Get product by ID
  async getProduct(productId) {
    return this.products.find(p => p.id === productId) || null;
  }

  // Get all products
  async getProducts() {
    return this.products;
  }

  // Create a new product
  async createProduct(productData) {
    const newProduct = {
      id: Math.max(...this.products.map(p => p.id), 0) + 1,
      ...productData,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      seller: {
        id: productData.sellerId,
        username: 'test_seller',
        walletAddress: '0x1234567890abcdef',
        userRole: 'Seller',
        reputationScore: 4.5
      }
    };
    
    this.products.push(newProduct);
    return newProduct;
  }

  // Update a product
  async updateProduct(productId, updateData) {
    const productIndex = this.products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      throw new Error('Product not found');
    }

    this.products[productIndex] = {
      ...this.products[productIndex],
      ...updateData,
      updatedAt: new Date()
    };

    return this.products[productIndex];
  }

  // Delete a product
  async deleteProduct(productId) {
    const productIndex = this.products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      throw new Error('Product not found');
    }

    this.products.splice(productIndex, 1);
    return true;
  }
}

// Singleton instance
const mockDb = new MockDatabase();

module.exports = mockDb;
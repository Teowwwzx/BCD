const { app, request, TEST_USERS, createAndLoginUser, authenticatedRequest } = require('./setup');

describe('Products API - Role-based Access Tests', () => {
  let buyerAuth, sellerAuth, adminAuth;
  let buyerUser, sellerUser, adminUser;
  let testProduct;

  beforeEach(async () => {
    // Create and login users for each role
    const buyerData = await createAndLoginUser('buyer');
    const sellerData = await createAndLoginUser('seller');
    const adminData = await createAndLoginUser('admin');

    buyerAuth = authenticatedRequest(app, buyerData.token);
    sellerAuth = authenticatedRequest(app, sellerData.token);
    adminAuth = authenticatedRequest(app, adminData.token);

    buyerUser = buyerData.user;
    sellerUser = sellerData.user;
    adminUser = adminData.user;

    // Create a test product for update/delete tests
    const productResponse = await adminAuth.post('/api/products')
      .send({
        name: 'Test Product',
        description: 'A test product for API testing',
        price: 99.99,
        stock_quantity: 10,
        category_id: 1,
        seller_id: sellerUser.id
      });
    
    if (productResponse.status === 201) {
      testProduct = productResponse.body.data.product;
    }
  });

  describe('POST /api/products - Create Product', () => {
    const newProductData = {
      name: 'New Test Product',
      description: 'A new product for testing',
      price: 149.99,
      stock_quantity: 5,
      category_id: 1
    };

    test('seller should be able to create their own products', async () => {
      const response = await sellerAuth.post('/api/products')
        .send(newProductData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(newProductData.name);
      expect(response.body.data.product.seller_id).toBe(sellerUser.id);
    });

    test('admin should be able to create products for any seller', async () => {
      const productWithSeller = {
        ...newProductData,
        seller_id: sellerUser.id
      };

      const response = await adminAuth.post('/api/products')
        .send(productWithSeller)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(newProductData.name);
      expect(response.body.data.product.seller_id).toBe(sellerUser.id);
    });

    test('buyer should not be able to create products', async () => {
      const response = await buyerAuth.post('/api/products')
        .send(newProductData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });

    test('unauthenticated request should be rejected', async () => {
      const response = await request(app)
        .post('/api/products')
        .send(newProductData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/products - Get All Products', () => {
    test('anyone should be able to view all products (public endpoint)', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    test('buyer should be able to view all products', async () => {
      const response = await buyerAuth.get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    test('seller should be able to view all products', async () => {
      const response = await sellerAuth.get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    test('admin should be able to view all products', async () => {
      const response = await adminAuth.get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    test('should support filtering by category', async () => {
      const response = await request(app)
        .get('/api/products?category_id=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    test('should support filtering by seller', async () => {
      const response = await request(app)
        .get(`/api/products?seller_id=${sellerUser.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });
  });

  describe('GET /api/products/:id - Get Product by ID', () => {
    test('anyone should be able to view a specific product', async () => {
      if (!testProduct) {
        console.log('Skipping test - no test product available');
        return;
      }

      const response = await request(app)
        .get(`/api/products/${testProduct.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.id).toBe(testProduct.id);
    });

    test('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /api/products/:id - Update Product', () => {
    const updateData = {
      name: 'Updated Product Name',
      price: 199.99,
      stock_quantity: 15
    };

    test('seller should be able to update their own products', async () => {
      if (!testProduct) {
        console.log('Skipping test - no test product available');
        return;
      }

      const response = await sellerAuth.put(`/api/products/${testProduct.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(updateData.name);
      expect(response.body.data.product.price).toBe(updateData.price);
    });

    test('admin should be able to update any product', async () => {
      if (!testProduct) {
        console.log('Skipping test - no test product available');
        return;
      }

      const response = await adminAuth.put(`/api/products/${testProduct.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(updateData.name);
    });

    test('buyer should not be able to update products', async () => {
      if (!testProduct) {
        console.log('Skipping test - no test product available');
        return;
      }

      const response = await buyerAuth.put(`/api/products/${testProduct.id}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });

    test('seller should not be able to update other sellers products', async () => {
      // Create another seller and their product
      const anotherSellerData = await createAndLoginUser('seller', {
        username: 'anotherseller',
        email: 'anotherseller@test.com',
        password: 'password123',
        user_role: 'seller'
      });
      const anotherSellerAuth = authenticatedRequest(app, anotherSellerData.token);

      // Create product for another seller
      const anotherProductResponse = await adminAuth.post('/api/products')
        .send({
          name: 'Another Seller Product',
          description: 'Product by another seller',
          price: 79.99,
          stock_quantity: 8,
          category_id: 1,
          seller_id: anotherSellerData.user.id
        });

      if (anotherProductResponse.status === 201) {
        const anotherProduct = anotherProductResponse.body.data.product;
        
        const response = await sellerAuth.put(`/api/products/${anotherProduct.id}`)
          .send(updateData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('permission');
      }
    });

    test('should return 404 for non-existent product', async () => {
      const response = await adminAuth.put('/api/products/99999')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('unauthenticated request should be rejected', async () => {
      if (!testProduct) {
        console.log('Skipping test - no test product available');
        return;
      }

      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/products/:id - Delete Product', () => {
    test('seller should be able to delete their own products', async () => {
      if (!testProduct) {
        console.log('Skipping test - no test product available');
        return;
      }

      const response = await sellerAuth.delete(`/api/products/${testProduct.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('deleted');
    });

    test('admin should be able to delete any product', async () => {
      // Create a new product for this test
      const productResponse = await adminAuth.post('/api/products')
        .send({
          name: 'Product to Delete',
          description: 'This product will be deleted',
          price: 59.99,
          stock_quantity: 3,
          category_id: 1,
          seller_id: sellerUser.id
        });

      if (productResponse.status === 201) {
        const productToDelete = productResponse.body.data.product;
        
        const response = await adminAuth.delete(`/api/products/${productToDelete.id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain('deleted');
      }
    });

    test('buyer should not be able to delete products', async () => {
      if (!testProduct) {
        console.log('Skipping test - no test product available');
        return;
      }

      const response = await buyerAuth.delete(`/api/products/${testProduct.id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });

    test('should return 404 for non-existent product', async () => {
      const response = await adminAuth.delete('/api/products/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('unauthenticated request should be rejected', async () => {
      if (!testProduct) {
        console.log('Skipping test - no test product available');
        return;
      }

      const response = await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
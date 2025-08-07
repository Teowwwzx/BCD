const request = require('supertest');
const { createTestApp } = require('./test-app');

describe('Products API', () => {
  let app;

  beforeAll(() => {
    // Force mock database usage for all tests
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/products', () => {
    it('should return all products successfully', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return products with correct structure', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      if (response.body.data.length > 0) {
        const product = response.body.data[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('description');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('quantity');
        expect(product).toHaveProperty('categoryId');
        expect(product).toHaveProperty('sellerId');
      }
    });

    it('should handle category filter', async () => {
      const response = await request(app)
        .get('/api/products?category=1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should handle seller filter', async () => {
      const response = await request(app)
        .get('/api/products?seller=1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should handle search query', async () => {
      const response = await request(app)
        .get('/api/products?search=test')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a specific product', async () => {
      const response = await request(app)
        .get('/api/products/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', 1);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/99999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid product ID', async () => {
      const response = await request(app)
        .get('/api/products/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/products', () => {
    const validProduct = {
      name: 'Test Product',
      description: 'A test product description',
      price: 99.99,
      quantity: 10,
      categoryId: 1,
      sellerId: 1,
      location: 'Test Location',
      imageUrl: 'https://example.com/image.jpg'
    };

    it('should create a new product successfully', async () => {
      const response = await request(app)
        .post('/api/products')
        .send(validProduct)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Product created successfully');
      expect(response.body).toHaveProperty('product');
      expect(response.body.product).toHaveProperty('name', validProduct.name);
      expect(response.body.product).toHaveProperty('price', validProduct.price);
      expect(response.body.product).toHaveProperty('sellerId', validProduct.sellerId);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidProduct = { name: 'Test Product' }; // missing required fields

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });

    it('should return 400 for invalid price', async () => {
      const invalidProduct = { ...validProduct, price: -10 };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid quantity', async () => {
      const invalidProduct = { ...validProduct, quantity: -5 };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/products/:id', () => {
    const updateData = {
      name: 'Updated Product Name',
      price: 149.99
    };

    it('should update a product successfully', async () => {
      const response = await request(app)
        .put('/api/products/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Product updated successfully');
      expect(response.body).toHaveProperty('product');
      expect(response.body.product).toHaveProperty('name', updateData.name);
      expect(response.body.product).toHaveProperty('price', updateData.price);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .put('/api/products/99999')
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidUpdate = { price: -50 };

      const response = await request(app)
        .put('/api/products/1')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete a product successfully', async () => {
      const response = await request(app)
        .delete('/api/products/1')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Product deleted successfully');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/api/products/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    it('should return 400 for invalid product ID', async () => {
      const response = await request(app)
        .delete('/api/products/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Malformed JSON typically results in empty response body
      expect(response.status).toBe(400);
    });

    it('should handle large payloads gracefully', async () => {
      const largeProduct = {
        name: 'A'.repeat(1000),
        description: 'B'.repeat(5000),
        price: 99.99,
        quantity: 10,
        categoryId: 1,
        sellerId: 1
      };

      const response = await request(app)
        .post('/api/products')
        .send(largeProduct);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
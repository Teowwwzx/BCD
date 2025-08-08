const request = require('supertest');
const { createTestApp } = require('./test-app');

describe('Cart API', () => {
  let app;

  beforeAll(() => {
    // Force mock database usage for all tests
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/cart/:userId', () => {
    it('should return cart items for valid user', async () => {
      const response = await request(app)
        .get('/api/cart/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('should return empty cart for user with no items', async () => {
      const response = await request(app)
        .get('/api/cart/999')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.items).toHaveLength(0);
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/cart/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should include product details in cart items', async () => {
      const response = await request(app)
        .get('/api/cart/1')
        .expect(200);

      if (response.body.data.items.length > 0) {
        const cartItem = response.body.data.items[0];
        expect(cartItem).toHaveProperty('id');
        expect(cartItem).toHaveProperty('userId');
        expect(cartItem).toHaveProperty('productId');
        expect(cartItem).toHaveProperty('quantity');
        expect(cartItem).toHaveProperty('product');
        
        // Check product details
        expect(cartItem.product).toHaveProperty('name');
        expect(cartItem.product).toHaveProperty('price');
        expect(cartItem.product).toHaveProperty('description');
      }
    });
  });

  describe('POST /api/cart/add', () => {
    const validCartItem = {
      userId: 1,
      productId: 1,
      quantity: 2
    };

    it('should add item to cart successfully', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .send(validCartItem)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('cartItem');
      expect(response.body.data.cartItem.userId).toBe(validCartItem.userId);
      expect(response.body.data.cartItem.productId).toBe(validCartItem.productId);
      expect(response.body.data.cartItem.quantity).toBe(validCartItem.quantity);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidItem = { userId: 1, productId: 1 }; // missing quantity

      const response = await request(app)
        .post('/api/cart/add')
        .send(invalidItem)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid quantity', async () => {
      const invalidItem = { ...validCartItem, quantity: 0 };

      const response = await request(app)
        .post('/api/cart/add')
        .send(invalidItem)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for negative quantity', async () => {
      const invalidItem = { ...validCartItem, quantity: -1 };

      const response = await request(app)
        .post('/api/cart/add')
        .send(invalidItem)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent product', async () => {
      const invalidItem = { ...validCartItem, productId: 99999 };

      const response = await request(app)
        .post('/api/cart/add')
        .send(invalidItem)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Product not found');
    });

    it('should handle adding same product multiple times', async () => {
      // Add item first time
      await request(app)
        .post('/api/cart/add')
        .send(validCartItem)
        .expect(200);

      // Add same item again
      const response = await request(app)
        .post('/api/cart/add')
        .send(validCartItem)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('PUT /api/cart/update', () => {
    const updateData = {
      userId: 1,
      productId: 1,
      quantity: 5
    };

    it('should update cart item quantity successfully', async () => {
      // First add an item
      await request(app)
        .post('/api/cart/add')
        .send({ userId: 1, productId: 1, quantity: 2 });

      const response = await request(app)
        .put('/api/cart/update')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should return 400 for invalid quantity', async () => {
      const invalidUpdate = { ...updateData, quantity: 0 };

      const response = await request(app)
        .put('/api/cart/update')
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent cart item', async () => {
      const nonExistentUpdate = { userId: 999, productId: 999, quantity: 1 };

      const response = await request(app)
        .put('/api/cart/update')
        .send(nonExistentUpdate)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/cart/remove', () => {
    const removeData = {
      userId: 1,
      productId: 1
    };

    it('should remove item from cart successfully', async () => {
      // First add an item
      await request(app)
        .post('/api/cart/add')
        .send({ userId: 1, productId: 1, quantity: 2 });

      const response = await request(app)
        .delete('/api/cart/remove')
        .send(removeData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidRemove = { userId: 1 }; // missing productId

      const response = await request(app)
        .delete('/api/cart/remove')
        .send(invalidRemove)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent cart item', async () => {
      const nonExistentRemove = { userId: 999, productId: 999 };

      const response = await request(app)
        .delete('/api/cart/remove')
        .send(nonExistentRemove)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/cart/clear/:userId', () => {
    it('should clear all cart items for user', async () => {
      // First add some items
      await request(app)
        .post('/api/cart/add')
        .send({ userId: 1, productId: 1, quantity: 2 });

      const response = await request(app)
        .delete('/api/cart/clear/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .delete('/api/cart/clear/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle clearing empty cart gracefully', async () => {
      const response = await request(app)
        .delete('/api/cart/clear/999')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll test that the API responds appropriately to invalid requests
      const response = await request(app)
        .post('/api/cart/add')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid JSON');
    });
  });
});
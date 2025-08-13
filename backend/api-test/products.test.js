const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const productsRouter = require('../routes/products');

const app = express();
app.use(express.json());
app.use('/api/products', productsRouter);

const prisma = new PrismaClient();

describe('Products API', () => {
  let seller, category, product;

  beforeAll(async () => {
    // Create a seller and a category for testing purposes
    seller = await prisma.user.create({
      data: {
        username: 'test-seller',
        email: 'test-seller@example.com',
        password: 'password123',
        role: 'seller',
      },
    });

    category = await prisma.category.create({
      data: {
        name: 'Test Category',
      },
    });
  });

  afterAll(async () => {
    // Clean up the database after all tests are done
    if (product) {
      await prisma.product.deleteMany({ where: { id: product.id } });
    }
    await prisma.user.deleteMany({ where: { id: seller.id } });
    await prisma.category.deleteMany({ where: { id: category.id } });
    await prisma.$disconnect();
  });

  // Test for POST /api/products
  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const newProductData = {
        sellerId: seller.id,
        categoryId: category.id,
        name: 'Test Product',
        description: 'This is a test product.',
        price: 99.99,
        quantity: 10,
      };

      const response = await request(app)
        .post('/api/products')
        .send(newProductData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newProductData.name);
      product = response.body.data; // Save for later tests
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          sellerId: seller.id,
          // Missing other required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields: sellerId, categoryId, name, price, quantity.');
    });
  });

  // Test for GET /api/products
  describe('GET /api/products', () => {
    it('should return a list of products', async () => {
      const response = await request(app).get('/api/products').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // Test for GET /api/products/:id
  describe('GET /api/products/:id', () => {
    it('should return a single product', async () => {
      const response = await request(app)
        .get(`/api/products/${product.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(product.id);
    });

    it('should return 404 for a non-existent product', async () => {
      const response = await request(app).get('/api/products/999999').expect(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found.');
    });
  });

  // Test for PUT /api/products/:id
  describe('PUT /api/products/:id', () => {
    it('should update a product', async () => {
      const updatedData = {
        name: 'Updated Test Product',
        price: 129.99,
      };

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updatedData.name);
      expect(response.body.data.price).toBe(updatedData.price);
    });

    it('should return 404 for trying to update a non-existent product', async () => {
      const response = await request(app)
        .put('/api/products/999999')
        .send({ name: 'Won\'t work' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found.');
    });
  });

  // Test for DELETE /api/products/:id
  describe('DELETE /api/products/:id', () => {
    it('should delete a product', async () => {
      await request(app).delete(`/api/products/${product.id}`).expect(204);
    });

    it('should return 404 for trying to delete a non-existent product', async () => {
      const response = await request(app).delete('/api/products/999999').expect(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found.');
    });
  });
});
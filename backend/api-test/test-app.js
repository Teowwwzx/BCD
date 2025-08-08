const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const productsRoutes = require('../routes/products');
const cartRoutes = require('../routes/cart');

// Mock the database modules to force mock usage
jest.mock('../services/mockDatabase', () => {
  const originalMockDb = jest.requireActual('../services/mockDatabase');
  return originalMockDb;
});

// Create test app with mocked database
const createTestApp = () => {
  // Set environment to test
  process.env.NODE_ENV = 'test';
  
  const app = express();
  
  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  
  // Error handling middleware for malformed JSON
  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    next();
  });
  
  // Routes
  app.use('/api/products', productsRoutes);
  app.use('/api/cart', cartRoutes);
  
  // Global error handler
  app.use((error, req, res, next) => {
    console.error('Test app error:', error);
    res.status(500).json({ error: 'Internal server error' });
  });
  
  return app;
};

module.exports = { createTestApp };
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Test routes one by one
console.log('Loading routes one by one...');

try {
  console.log('1. Loading users routes...');
  const usersRoutes = require('./routes/users');
  app.use('/api/users', usersRoutes);
  console.log('✓ Users routes loaded successfully');
} catch (error) {
  console.log('✗ Users routes failed:', error.message);
  process.exit(1);
}

try {
  console.log('2. Loading products routes...');
  const productsRoutes = require('./routes/products');
  app.use('/api/products', productsRoutes);
  console.log('✓ Products routes loaded successfully');
} catch (error) {
  console.log('✗ Products routes failed:', error.message);
  process.exit(1);
}

try {
  console.log('3. Loading orders routes...');
  const ordersRoutes = require('./routes/orders');
  app.use('/api/orders', ordersRoutes);
  console.log('✓ Orders routes loaded successfully');
} catch (error) {
  console.log('✗ Orders routes failed:', error.message);
  process.exit(1);
}

try {
  console.log('4. Loading shipments routes...');
  const shipmentsRoutes = require('./routes/shipments');
  app.use('/api/shipments', shipmentsRoutes);
  console.log('✓ Shipments routes loaded successfully');
} catch (error) {
  console.log('✗ Shipments routes failed:', error.message);
  process.exit(1);
}

try {
  console.log('5. Loading reviews routes...');
  const reviewsRoutes = require('./routes/reviews');
  app.use('/api/reviews', reviewsRoutes);
  console.log('✓ Reviews routes loaded successfully');
} catch (error) {
  console.log('✗ Reviews routes failed:', error.message);
  process.exit(1);
}

console.log('All routes loaded successfully!');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
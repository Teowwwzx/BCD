const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`REQUEST LOG: ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint hit!');
  res.json({ message: 'Test endpoint working' });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Import and test routes one by one
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const shipmentsRoutes = require('./routes/shipments');
const reviewsRoutes = require('./routes/reviews');
const cartRoutes = require('./routes/cart');
const categoriesRoutes = require('./routes/categories');
const notificationRoutes = require('./routes/notifications');
const statsRoutes = require('./routes/stats');
const addressesRoutes = require('./routes/addresses');

console.log('Loading users routes...');
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
console.log('✓ Users routes loaded');

console.log('Loading products routes...');
try {
  app.use('/api/products', productsRoutes);
  console.log('✓ Products routes loaded');
} catch (error) {
  console.error('Error loading products routes:', error);
}

console.log('Loading categories routes...');
try {
  app.use('/api/categories', categoriesRoutes);
  console.log('✓ Categories routes loaded');
} catch (error) {
  console.error('Error loading categories routes:', error);
}

console.log('Loading orders routes...');
app.use('/api/orders', ordersRoutes);
console.log('✓ Orders routes loaded');

console.log('Loading shipments routes...');
app.use('/api/shipments', shipmentsRoutes);
console.log('✓ Shipments routes loaded');

console.log('Loading reviews routes...');
app.use('/api/reviews', reviewsRoutes);
console.log('✓ Reviews routes loaded');

console.log('Loading cart routes...');
app.use('/api/cart', cartRoutes);
console.log('✓ Cart routes loaded');

console.log('Loading notifications routes...');
app.use('/api/notifications', notificationRoutes);
console.log('✓ Notification routes loaded');

console.log('Loading stats routes...');
app.use('/api/stats', statsRoutes);
console.log('✓ Stats routes loaded');

console.log('Loading addresses routes...');
app.use('/api/addresses', addressesRoutes);
console.log('✓ Addresses routes loaded');


// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BCD Marketplace API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      shipments: '/api/shipments',
      reviews: '/api/reviews',
      cart: '/api/cart',
      categories: '/api/categories',
      notifications: '/api/notifications',
      stats: '/api/stats',
      addresses: '/api/addresses'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.set('json replacer', (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
);

// 404 handler will be handled by Express default

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT. Graceful shutdown...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM. Graceful shutdown...');
  await prisma.$disconnect();
  process.exit(0);
});

console.log('BCD Marketplace API configured successfully');

module.exports = app;
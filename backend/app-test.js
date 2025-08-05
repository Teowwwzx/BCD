const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import simple routes for testing
const usersRoutes = require('./routes/users-simple');

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// API routes - testing simple users
app.use('/api/users', usersRoutes);
console.log('Simple users routes loaded successfully');

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BCD Marketplace API - Testing Simple Users',
    version: '1.0.0'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
const express = require('express');
const mockDb = require('./services/mockDatabase');

const app = express();

app.get('/test-products', async (req, res) => {
  console.log('Test products route called');
  try {
    const products = await mockDb.getProducts();
    console.log('Products retrieved:', products.length);
    res.json({ success: true, count: products.length, products: products.slice(0, 2) });
  } catch (error) {
    console.error('Error in test route:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(5001, () => {
  console.log('Test server running on port 5001');
});
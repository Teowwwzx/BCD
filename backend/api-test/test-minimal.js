const express = require('express');
const router = express.Router();

// Test each route pattern individually
console.log('Testing route patterns...');

try {
  // Test 1: Basic route
  const router1 = express.Router();
  router1.get('/', (req, res) => res.json({ test: 'basic' }));
  console.log('✓ Basic route works');
} catch (error) {
  console.log('✗ Basic route failed:', error.message);
}

try {
  // Test 2: Wallet route
  const router2 = express.Router();
  router2.get('/wallet/:address', (req, res) => res.json({ test: 'wallet' }));
  console.log('✓ Wallet route works');
} catch (error) {
  console.log('✗ Wallet route failed:', error.message);
}

try {
  // Test 3: ID route
  const router3 = express.Router();
  router3.get('/:id', (req, res) => res.json({ test: 'id' }));
  console.log('✓ ID route works');
} catch (error) {
  console.log('✗ ID route failed:', error.message);
}

try {
  // Test 4: Combined routes in correct order
  const router4 = express.Router();
  router4.post('/', (req, res) => res.json({ test: 'post' }));
  router4.get('/wallet/:address', (req, res) => res.json({ test: 'wallet' }));
  router4.get('/:id', (req, res) => res.json({ test: 'id' }));
  router4.put('/:id', (req, res) => res.json({ test: 'put' }));
  router4.get('/', (req, res) => res.json({ test: 'get all' }));
  console.log('✓ Combined routes work');
} catch (error) {
  console.log('✗ Combined routes failed:', error.message);
}

console.log('Route pattern testing complete.');
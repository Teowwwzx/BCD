const express = require('express');
const router = express.Router();

// Simple test routes
router.post('/', (req, res) => {
  res.json({ message: 'POST users endpoint' });
});

router.get('/wallet/:address', (req, res) => {
  res.json({ message: 'GET wallet endpoint', address: req.params.address });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'GET user by ID endpoint', id: req.params.id });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'PUT user endpoint', id: req.params.id });
});

router.get('/', (req, res) => {
  res.json({ message: 'GET all users endpoint' });
});

module.exports = router;
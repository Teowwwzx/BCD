require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const request = require('supertest');
const app = require('../app');

// Create a separate Prisma client for testing
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL
    }
  }
});

// Test user credentials for different roles
const TEST_USERS = {
  buyer: {
    username: 'test_buyer',
    email: 'buyer@test.com',
    password: 'testpassword123',
    f_name: 'Test',
    l_name: 'Buyer',
    phone: '+1234567890',
    user_role: 'buyer'
  },
  seller: {
    username: 'test_seller',
    email: 'seller@test.com',
    password: 'testpassword123',
    f_name: 'Test',
    l_name: 'Seller',
    phone: '+1234567891',
    user_role: 'seller'
  },
  admin: {
    username: 'test_admin',
    email: 'admin@test.com',
    password: 'testpassword123',
    f_name: 'Test',
    l_name: 'Admin',
    phone: '+1234567892',
    user_role: 'admin'
  }
};

// Helper function to register and login a user
async function createAndLoginUser(role = 'buyer') {
  const userData = TEST_USERS[role];
  
  // Register user
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send(userData)
    .expect(201);

  // Activate user account directly in database (bypass email verification for tests)
  await prisma.user.update({
    where: { id: registerResponse.body.data.user.id },
    data: { status: 'active' }
  });

  // Login user
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: userData.email,
      password: userData.password
    })
    .expect(200);

  return {
    user: registerResponse.body.data.user,
    token: loginResponse.body.data.token,
    userData
  };
}

// Helper function to make authenticated requests
function authenticatedRequest(app, token) {
  return {
    get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url) => request(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url) => request(app).put(url).set('Authorization', `Bearer ${token}`),
    delete: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`)
  };
}

// Helper function to clean up test data
async function cleanupTestData() {
  try {
    // Delete in reverse order of dependencies
    await prisma.paymentTransaction.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.productAttribute.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.user_addresses.deleteMany({});
    await prisma.user_wallets.deleteMany({});
    await prisma.wishlist.deleteMany({});
    await prisma.product_reviews.deleteMany({});
    await prisma.coupon_usage.deleteMany({});
    await prisma.coupon.deleteMany({});
    await prisma.shipment.deleteMany({});
    await prisma.shippingMethod.deleteMany({});
    await prisma.audit_log.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

// Setup before all tests
beforeAll(async () => {
  // Clean up any existing test data
  await cleanupTestData();
});

// Cleanup after all tests
afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

// Cleanup after each test
afterEach(async () => {
  // Clean up test data after each test to ensure isolation
  await cleanupTestData();
});

module.exports = {
  prisma,
  app,
  request,
  TEST_USERS,
  createAndLoginUser,
  authenticatedRequest,
  cleanupTestData
};
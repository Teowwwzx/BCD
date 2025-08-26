const { app, request, TEST_USERS, createAndLoginUser, authenticatedRequest } = require('./setup');

describe('Authentication API Tests', () => {
  describe('POST /api/auth/register', () => {
    test('should register a new buyer user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USERS.buyer)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(TEST_USERS.buyer.email);
      expect(response.body.data.user.user_role).toBe('buyer');
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    test('should register a new seller user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USERS.seller)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(TEST_USERS.seller.email);
      expect(response.body.data.user.user_role).toBe('seller');
    });

    test('should register a new admin user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USERS.admin)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(TEST_USERS.admin.email);
      expect(response.body.data.user.user_role).toBe('admin');
    });

    test('should reject registration with duplicate email', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(TEST_USERS.buyer)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USERS.buyer)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email');
    });

    test('should reject registration with invalid email format', async () => {
      const invalidUser = { ...TEST_USERS.buyer, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject registration with missing required fields', async () => {
      const incompleteUser = { email: 'test@test.com' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register test users before each login test
      await request(app)
        .post('/api/auth/register')
        .send(TEST_USERS.buyer);
      
      await request(app)
        .post('/api/auth/register')
        .send(TEST_USERS.seller);
      
      await request(app)
        .post('/api/auth/register')
        .send(TEST_USERS.admin);
    });

    test('should login buyer user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USERS.buyer.email,
          password: TEST_USERS.buyer.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.user_role).toBe('buyer');
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    test('should login seller user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USERS.seller.email,
          password: TEST_USERS.seller.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.user_role).toBe('seller');
    });

    test('should login admin user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USERS.admin.email,
          password: TEST_USERS.admin.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.user_role).toBe('admin');
    });

    test('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: TEST_USERS.buyer.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid');
    });

    test('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USERS.buyer.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid');
    });

    test('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    test('should get buyer profile with valid token', async () => {
      const { token, user } = await createAndLoginUser('buyer');
      const authReq = authenticatedRequest(app, token);

      const response = await authReq.get('/api/auth/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user.user_role).toBe('buyer');
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    test('should get seller profile with valid token', async () => {
      const { token, user } = await createAndLoginUser('seller');
      const authReq = authenticatedRequest(app, token);

      const response = await authReq.get('/api/auth/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user.user_role).toBe('seller');
    });

    test('should get admin profile with valid token', async () => {
      const { token, user } = await createAndLoginUser('admin');
      const authReq = authenticatedRequest(app, token);

      const response = await authReq.get('/api/auth/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user.user_role).toBe('admin');
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    test('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
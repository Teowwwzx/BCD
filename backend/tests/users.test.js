const { app, request, TEST_USERS, createAndLoginUser, authenticatedRequest } = require('./setup');

describe('Users API - Role-based Access Tests', () => {
  let buyerAuth, sellerAuth, adminAuth;
  let buyerUser, sellerUser, adminUser;

  beforeEach(async () => {
    // Create and login users for each role
    const buyerData = await createAndLoginUser('buyer');
    const sellerData = await createAndLoginUser('seller');
    const adminData = await createAndLoginUser('admin');

    buyerAuth = authenticatedRequest(app, buyerData.token);
    sellerAuth = authenticatedRequest(app, sellerData.token);
    adminAuth = authenticatedRequest(app, adminData.token);

    buyerUser = buyerData.user;
    sellerUser = sellerData.user;
    adminUser = adminData.user;
  });

  describe('POST /api/users - Create User', () => {
    const newUserData = {
      username: 'newuser',
      email: 'newuser@test.com',
      password: 'password123',
      user_role: 'buyer'
    };

    test('admin should be able to create new users', async () => {
      const response = await adminAuth.post('/api/users')
        .send(newUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(newUserData.email);
      expect(response.body.data.user.user_role).toBe(newUserData.user_role);
    });

    test('buyer should not be able to create new users', async () => {
      const response = await buyerAuth.post('/api/users')
        .send(newUserData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });

    test('seller should not be able to create new users', async () => {
      const response = await sellerAuth.post('/api/users')
        .send(newUserData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });

    test('unauthenticated request should be rejected', async () => {
      const response = await request(app)
        .post('/api/users')
        .send(newUserData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users - Get All Users', () => {
    test('admin should be able to get all users', async () => {
      const response = await adminAuth.get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThanOrEqual(3);
    });

    test('admin should be able to filter users by role', async () => {
      const response = await adminAuth.get('/api/users?user_role=buyer')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
      response.body.data.users.forEach(user => {
        expect(user.user_role).toBe('buyer');
      });
    });

    test('buyer should not be able to get all users', async () => {
      const response = await buyerAuth.get('/api/users')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });

    test('seller should not be able to get all users', async () => {
      const response = await sellerAuth.get('/api/users')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });

    test('unauthenticated request should be rejected', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id - Get User by ID', () => {
    test('admin should be able to get any user by ID', async () => {
      const response = await adminAuth.get(`/api/users/${buyerUser.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(buyerUser.id);
      expect(response.body.data.user.email).toBe(buyerUser.email);
    });

    test('user should be able to get their own profile', async () => {
      const response = await buyerAuth.get(`/api/users/${buyerUser.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(buyerUser.id);
    });

    test('user should not be able to get other users profile', async () => {
      const response = await buyerAuth.get(`/api/users/${sellerUser.id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await adminAuth.get('/api/users/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('unauthenticated request should be rejected', async () => {
      const response = await request(app)
        .get(`/api/users/${buyerUser.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id - Update User', () => {
    const updateData = {
      email: 'updated@test.com',
      status: 'active'
    };

    test('admin should be able to update any user', async () => {
      const response = await adminAuth.put(`/api/users/${buyerUser.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(updateData.email);
    });

    test('user should be able to update their own profile', async () => {
      const response = await buyerAuth.put(`/api/users/${buyerUser.id}`)
        .send({ email: 'buyer-updated@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('buyer-updated@test.com');
    });

    test('user should not be able to update other users', async () => {
      const response = await buyerAuth.put(`/api/users/${sellerUser.id}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await adminAuth.put('/api/users/99999')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('unauthenticated request should be rejected', async () => {
      const response = await request(app)
        .put(`/api/users/${buyerUser.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id - Delete User', () => {
    test('admin should be able to delete any user', async () => {
      const response = await adminAuth.delete(`/api/users/${buyerUser.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('deleted');
    });

    test('user should not be able to delete other users', async () => {
      const response = await buyerAuth.delete(`/api/users/${sellerUser.id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });

    test('user should not be able to delete themselves', async () => {
      const response = await buyerAuth.delete(`/api/users/${buyerUser.id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await adminAuth.delete('/api/users/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('unauthenticated request should be rejected', async () => {
      const response = await request(app)
        .delete(`/api/users/${buyerUser.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
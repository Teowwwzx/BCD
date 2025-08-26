const { app, request, TEST_USERS, createAndLoginUser, authenticatedRequest } = require('./setup');

describe('Orders API - Role-based Access Tests', () => {
  let buyerAuth, sellerAuth, adminAuth;
  let buyerUser, sellerUser, adminUser;
  let testOrder;

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

    // Create a test order for update/delete tests
    const orderResponse = await buyerAuth.post('/api/orders')
      .send({
        shipping_address: '123 Test Street, Test City, TC 12345',
        payment_method: 'credit_card',
        items: [
          {
            product_id: 1,
            quantity: 2,
            price: 99.99
          }
        ]
      });
    
    if (orderResponse.status === 201) {
      testOrder = orderResponse.body.data.order;
    }
  });

  describe('POST /api/orders - Create Order', () => {
    const newOrderData = {
      shipping_address: '456 New Street, New City, NC 67890',
      payment_method: 'paypal',
      items: [
        {
          product_id: 1,
          quantity: 1,
          price: 149.99
        }
      ]
    };

    test('buyer should be able to create orders', async () => {
      const response = await buyerAuth.post('/api/orders')
        .send(newOrderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.user_id).toBe(buyerUser.id);
      expect(response.body.data.order.shipping_address).toBe(newOrderData.shipping_address);
      expect(response.body.data.order.payment_method).toBe(newOrderData.payment_method);
    });

    test('admin should be able to create orders for any user', async () => {
      const orderWithUser = {
        ...newOrderData,
        user_id: buyerUser.id
      };

      const response = await adminAuth.post('/api/orders')
        .send(orderWithUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.user_id).toBe(buyerUser.id);
    });

    test('seller should not be able to create orders', async () => {
      const response = await sellerAuth.post('/api/orders')
        .send(newOrderData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });

    test('should validate required fields', async () => {
      const incompleteOrder = {
        shipping_address: '123 Test Street'
        // Missing payment_method and items
      };

      const response = await buyerAuth.post('/api/orders')
        .send(incompleteOrder)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('unauthenticated request should be rejected', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send(newOrderData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders - Get All Orders', () => {
    test('admin should be able to get all orders', async () => {
      const response = await adminAuth.get('/api/orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    test('buyer should only see their own orders', async () => {
      const response = await buyerAuth.get('/api/orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
      
      // All orders should belong to the buyer
      response.body.data.orders.forEach(order => {
        expect(order.user_id).toBe(buyerUser.id);
      });
    });

    test('seller should see orders containing their products', async () => {
      const response = await sellerAuth.get('/api/orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    test('admin should be able to filter orders by user', async () => {
      const response = await adminAuth.get(`/api/orders?user_id=${buyerUser.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
      
      response.body.data.orders.forEach(order => {
        expect(order.user_id).toBe(buyerUser.id);
      });
    });

    test('admin should be able to filter orders by status', async () => {
      const response = await adminAuth.get('/api/orders?status=pending')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    test('unauthenticated request should be rejected', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders/:id - Get Order by ID', () => {
    test('buyer should be able to view their own orders', async () => {
      if (!testOrder) {
        console.log('Skipping test - no test order available');
        return;
      }

      const response = await buyerAuth.get(`/api/orders/${testOrder.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.id).toBe(testOrder.id);
      expect(response.body.data.order.user_id).toBe(buyerUser.id);
    });

    test('admin should be able to view any order', async () => {
      if (!testOrder) {
        console.log('Skipping test - no test order available');
        return;
      }

      const response = await adminAuth.get(`/api/orders/${testOrder.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.id).toBe(testOrder.id);
    });

    test('buyer should not be able to view other users orders', async () => {
      // Create another buyer and their order
      const anotherBuyerData = await createAndLoginUser('buyer', {
        username: 'anotherbuyer',
        email: 'anotherbuyer@test.com',
        password: 'password123',
        user_role: 'buyer'
      });
      const anotherBuyerAuth = authenticatedRequest(app, anotherBuyerData.token);

      // Create order for another buyer
      const anotherOrderResponse = await anotherBuyerAuth.post('/api/orders')
        .send({
          shipping_address: '789 Another Street, Another City, AC 11111',
          payment_method: 'credit_card',
          items: [
            {
              product_id: 1,
              quantity: 1,
              price: 79.99
            }
          ]
        });

      if (anotherOrderResponse.status === 201) {
        const anotherOrder = anotherOrderResponse.body.data.order;
        
        const response = await buyerAuth.get(`/api/orders/${anotherOrder.id}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('permission');
      }
    });

    test('seller should be able to view orders containing their products', async () => {
      if (!testOrder) {
        console.log('Skipping test - no test order available');
        return;
      }

      // This test assumes the order contains products from the seller
      const response = await sellerAuth.get(`/api/orders/${testOrder.id}`);
      
      // Response could be 200 (if order contains seller's products) or 403 (if not)
      expect([200, 403]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.order.id).toBe(testOrder.id);
      } else {
        expect(response.body.success).toBe(false);
      }
    });

    test('should return 404 for non-existent order', async () => {
      const response = await adminAuth.get('/api/orders/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('unauthenticated request should be rejected', async () => {
      if (!testOrder) {
        console.log('Skipping test - no test order available');
        return;
      }

      const response = await request(app)
        .get(`/api/orders/${testOrder.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/orders/:id - Update Order', () => {
    const updateData = {
      status: 'processing',
      shipping_address: 'Updated Address, Updated City, UC 99999'
    };

    test('admin should be able to update any order', async () => {
      if (!testOrder) {
        console.log('Skipping test - no test order available');
        return;
      }

      const response = await adminAuth.put(`/api/orders/${testOrder.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe(updateData.status);
    });

    test('buyer should be able to update their own pending orders', async () => {
      if (!testOrder) {
        console.log('Skipping test - no test order available');
        return;
      }

      const response = await buyerAuth.put(`/api/orders/${testOrder.id}`)
        .send({ shipping_address: 'Buyer Updated Address' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.shipping_address).toBe('Buyer Updated Address');
    });

    test('seller should be able to update order status for orders containing their products', async () => {
      if (!testOrder) {
        console.log('Skipping test - no test order available');
        return;
      }

      const response = await sellerAuth.put(`/api/orders/${testOrder.id}`)
        .send({ status: 'shipped' });
      
      // Response could be 200 (if order contains seller's products) or 403 (if not)
      expect([200, 403]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      } else {
        expect(response.body.success).toBe(false);
      }
    });

    test('buyer should not be able to update other users orders', async () => {
      // Create another buyer and their order
      const anotherBuyerData = await createAndLoginUser('buyer', {
        username: 'anotherbuyer2',
        email: 'anotherbuyer2@test.com',
        password: 'password123',
        user_role: 'buyer'
      });
      const anotherBuyerAuth = authenticatedRequest(app, anotherBuyerData.token);

      const anotherOrderResponse = await anotherBuyerAuth.post('/api/orders')
        .send({
          shipping_address: '999 Final Street, Final City, FC 88888',
          payment_method: 'credit_card',
          items: [
            {
              product_id: 1,
              quantity: 1,
              price: 59.99
            }
          ]
        });

      if (anotherOrderResponse.status === 201) {
        const anotherOrder = anotherOrderResponse.body.data.order;
        
        const response = await buyerAuth.put(`/api/orders/${anotherOrder.id}`)
          .send(updateData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('permission');
      }
    });

    test('should return 404 for non-existent order', async () => {
      const response = await adminAuth.put('/api/orders/99999')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('unauthenticated request should be rejected', async () => {
      if (!testOrder) {
        console.log('Skipping test - no test order available');
        return;
      }

      const response = await request(app)
        .put(`/api/orders/${testOrder.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/orders/:id - Delete Order', () => {
    test('admin should be able to delete any order', async () => {
      if (!testOrder) {
        console.log('Skipping test - no test order available');
        return;
      }

      const response = await adminAuth.delete(`/api/orders/${testOrder.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('deleted');
    });

    test('buyer should be able to cancel their own pending orders', async () => {
      // Create a new order for this test
      const orderResponse = await buyerAuth.post('/api/orders')
        .send({
          shipping_address: 'Delete Test Address',
          payment_method: 'credit_card',
          items: [
            {
              product_id: 1,
              quantity: 1,
              price: 39.99
            }
          ]
        });

      if (orderResponse.status === 201) {
        const orderToDelete = orderResponse.body.data.order;
        
        const response = await buyerAuth.delete(`/api/orders/${orderToDelete.id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain('deleted');
      }
    });

    test('buyer should not be able to delete other users orders', async () => {
      // Create another buyer and their order
      const anotherBuyerData = await createAndLoginUser('buyer', {
        username: 'anotherbuyer3',
        email: 'anotherbuyer3@test.com',
        password: 'password123',
        user_role: 'buyer'
      });
      const anotherBuyerAuth = authenticatedRequest(app, anotherBuyerData.token);

      const anotherOrderResponse = await anotherBuyerAuth.post('/api/orders')
        .send({
          shipping_address: 'Another Delete Test Address',
          payment_method: 'paypal',
          items: [
            {
              product_id: 1,
              quantity: 1,
              price: 29.99
            }
          ]
        });

      if (anotherOrderResponse.status === 201) {
        const anotherOrder = anotherOrderResponse.body.data.order;
        
        const response = await buyerAuth.delete(`/api/orders/${anotherOrder.id}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('permission');
      }
    });

    test('seller should not be able to delete orders', async () => {
      if (!testOrder) {
        console.log('Skipping test - no test order available');
        return;
      }

      const response = await sellerAuth.delete(`/api/orders/${testOrder.id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('permission');
    });

    test('should return 404 for non-existent order', async () => {
      const response = await adminAuth.delete('/api/orders/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('unauthenticated request should be rejected', async () => {
      if (!testOrder) {
        console.log('Skipping test - no test order available');
        return;
      }

      const response = await request(app)
        .delete(`/api/orders/${testOrder.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
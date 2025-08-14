// backend/prisma/seed.js

const { PrismaClient, Prisma } = require('@prisma/client');
const bcrypt = require('bcrypt');
const axios = require('axios');
const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;
  const password = '123123';
  const passwordHash = await bcrypt.hash(password, saltRounds);
  console.log('🌱 Starting database seeding...');

  console.log('🗑️ Clearing database and resetting sequences...');
  try {
    // Use `model.dbName` to get the actual table name from the database
    const tableNames = Prisma.dmmf.datamodel.models.map((model) => model.dbName || model.name);

    // Build the TRUNCATE command with the correct table names
    const truncateQuery = `TRUNCATE TABLE ${tableNames.map(name => `"${name}"`).join(', ')} RESTART IDENTITY CASCADE;`;

    // Execute the raw query
    await prisma.$executeRawUnsafe(truncateQuery);

    console.log('🗑️ Database cleared successfully.');
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }

  // Create Admin Users
  const adminUsers = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@gmail.com',
        passwordHash,
        f_name: 'Super',
        l_name: 'Admin',
        phone: '111-222-3333',
        dob: new Date('1980-01-01'),
        profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        user_role: 'admin',
        status: 'active',
        user_wallets: {
          create: {
            wallet_addr: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            is_verified: true,
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        username: 'admin2',
        email: 'admin2@gmail.com',
        passwordHash,
        f_name: 'Secondary',
        l_name: 'Admin',
        phone: '111-222-3334',
        dob: new Date('1982-02-02'),
        profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        user_role: 'admin',
        status: 'active',
        user_wallets: {
          create: {
            wallet_addr: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
            is_verified: true,
          }
        }
      }
    })
  ]);

  // Create Regular Users
  const regularUsers = await Promise.all([
    prisma.user.create({
      data: {
        username: 'seller',
        email: 'seller@gmail.com',
        passwordHash,
        f_name: 'John',
        l_name: 'Seller',
        phone: '123-456-7890',
        dob: new Date('1985-03-15'),
        profileImageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
        user_role: 'seller',
        status: 'active',
        user_wallets: {
          create: {
            wallet_addr: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', // Vitalik Buterin's address for example
            is_verified: true,
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        username: 'seller2',
        email: 'seller2@gmail.com',
        passwordHash,
        f_name: 'Jane',
        l_name: 'Seller',
        phone: '234-567-8901',
        dob: new Date('1988-06-20'),
        profileImageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        user_role: 'seller',
        status: 'active',
      }
    }),
    prisma.user.create({
      data: {
        username: 'buyer',
        email: 'buyer@gmail.com',
        passwordHash,
        f_name: 'Peter',
        l_name: 'Buyer',
        phone: '345-678-9012',
        dob: new Date('1990-09-25'),
        profileImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        user_role: 'buyer',
        status: 'active',
        user_wallets: {
          create: {
            wallet_addr: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
            is_verified: true,
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        username: 'buyer2',
        email: 'buyer2@gmail.com',
        passwordHash,
        f_name: 'Mary',
        l_name: 'Buyer',
        phone: '456-789-0123',
        dob: new Date('1992-12-30'),
        profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        user_role: 'buyer',
        status: 'active',
      }
    })
  ]);

  console.log('👥 Created users:', adminUsers.length + regularUsers.length);

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Electronics',
        description: 'Electronic devices and components'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Raw Materials',
        description: 'Raw materials for manufacturing'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Textiles',
        description: 'Textile and fabric products'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Tools',
        description: 'Professional tools and equipment'
      }
    })
  ]);

  console.log('📂 Created categories:', categories.length);

  // Fetch products from Fake Store API and add them to the database
  let createdFakeProducts = [];
  try {
    const response = await axios.get('https://fakestoreapi.com/products');
    const fakeProducts = response.data;

    createdFakeProducts = await Promise.all(
      fakeProducts.map(p => {
        const seller = regularUsers[Math.floor(Math.random() * regularUsers.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        return prisma.product.create({
          data: {
            sellerId: seller.id,
            categoryId: category.id,
            name: p.title,
            description: p.description,
            price: p.price,
            quantity: p.rating.count, // Using rating count as stock
            status: 'published',
            images: {
              create: {
                imageUrl: p.image,
                altText: p.title
              }
            }
          }
        });
      })
    );

    console.log('🛍️ Created products from Fake Store API:', createdFakeProducts.length);
  } catch (error) {
    console.error('❌ Error fetching or creating products from Fake Store API:', error);
  }

  // Create Onchain Product (NFT)
  let onchainProduct = null;
  try {
    onchainProduct = await prisma.product.create({
      data: {
        sellerId: regularUsers[0].id, // seller
        categoryId: categories[0].id, // Electronics
        name: 'Digital Art NFT - Cosmic Dreams',
        description: 'A unique digital artwork representing cosmic dreams and stellar formations. This NFT is minted on the Ethereum blockchain and represents true ownership of this digital masterpiece.',
        short_desc: 'Exclusive digital art NFT with cosmic theme',
        sku: 'NFT-COSMIC-001',
        price: '0.5', // 0.5 ETH
        quantity: 1, // NFTs are typically unique
        max_order_quant: 1,
        status: 'published',
        isDigital: true,
        images: {
          create: {
            imageUrl: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=500',
            altText: 'Cosmic Dreams Digital Art NFT'
          }
        },
        attributes: {
          create: [
            {
              attr_name: 'contract_address',
              attr_value: '0x1234567890123456789012345678901234567890'
            },
            {
              attr_name: 'token_id',
              attr_value: '42'
            },
            {
              attr_name: 'blockchain_network',
              attr_value: 'Ethereum'
            },
            {
              attr_name: 'token_standard',
              attr_value: 'ERC-721'
            },
            {
              attr_name: 'metadata_uri',
              attr_value: 'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
            },
            {
              attr_name: 'creator_royalty',
              attr_value: '5%'
            },
            {
              attr_name: 'mint_date',
              attr_value: '2024-01-15'
            },
            {
              attr_name: 'rarity',
              attr_value: 'Legendary'
            }
          ]
        }
      }
    });
    
    if (onchainProduct) {
      createdFakeProducts.push(onchainProduct);
    }
    
    console.log('🔗 Created onchain product (NFT):', onchainProduct ? 1 : 0);
  } catch (error) {
    console.error('❌ Error creating onchain product:', error);
  }

  // Create User Addresses
  const addresses = await Promise.all([
    // Buyer addresses
    prisma.user_addresses.create({
      data: {
        user_id: regularUsers[2].id, // buyer
        address_type: 'shipping',
        location_type: 'residential',
        addr_line_1: '123 Main Street',
        addr_line_2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postcode: '10001',
        country: 'USA'
      }
    }),
    prisma.user_addresses.create({
      data: {
        user_id: regularUsers[2].id, // buyer
        address_type: 'billing',
        location_type: 'residential',
        addr_line_1: '123 Main Street',
        addr_line_2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postcode: '10001',
        country: 'USA'
      }
    }),
    prisma.user_addresses.create({
      data: {
        user_id: regularUsers[3].id, // buyer2
        address_type: 'shipping',
        location_type: 'residential',
        addr_line_1: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        postcode: '90210',
        country: 'USA'
      }
    }),
    prisma.user_addresses.create({
      data: {
        user_id: regularUsers[3].id, // buyer2
        address_type: 'billing',
        location_type: 'company',
        addr_line_1: '789 Business Blvd',
        addr_line_2: 'Suite 100',
        city: 'Los Angeles',
        state: 'CA',
        postcode: '90211',
        country: 'USA'
      }
    })
  ]);

  console.log('🏠 Created addresses:', addresses.length);

  // Create Orders with Order Items
  const orders = [];
  const orderItems = [];
  
  if (createdFakeProducts.length > 0) {
    // Order 1 - Completed order with payment
    const order1 = await prisma.order.create({
      data: {
        buyer_id: regularUsers[2].id, // buyer
        order_status: 'delivered',
        payment_status: 'paid',
        shippingAddressId: addresses[0].id,
        billingAddressId: addresses[1].id,
        subtotal: '149.98',
        taxAmount: '12.00',
        shippingAmount: '9.99',
        totalAmount: '171.97'
      }
    });
    orders.push(order1);

    // Order items for order 1
    const orderItem1 = await prisma.orderItem.create({
      data: {
        orderId: order1.id,
        productId: createdFakeProducts[0].id,
        seller_id: createdFakeProducts[0].sellerId,
        quantity: 2,
        unitPrice: createdFakeProducts[0].price,
        totalPrice: createdFakeProducts[0].price * 2,
        product_name: createdFakeProducts[0].name,
        product_sku: createdFakeProducts[0].sku
      }
    });
    const orderItem2 = await prisma.orderItem.create({
      data: {
        orderId: order1.id,
        productId: createdFakeProducts[1].id,
        seller_id: createdFakeProducts[1].sellerId,
        quantity: 1,
        unitPrice: createdFakeProducts[1].price,
        totalPrice: createdFakeProducts[1].price,
        product_name: createdFakeProducts[1].name,
        product_sku: createdFakeProducts[1].sku
      }
    });
    orderItems.push(orderItem1, orderItem2);

    // Order 2 - Pending order
    const order2 = await prisma.order.create({
      data: {
        buyer_id: regularUsers[2].id, // buyer
        order_status: 'pending',
        payment_status: 'pending',
        shippingAddressId: addresses[0].id,
        billingAddressId: addresses[1].id,
        subtotal: '89.99',
        taxAmount: '7.20',
        shippingAmount: '5.99',
        totalAmount: '103.18'
      }
    });
    orders.push(order2);

    const orderItem3 = await prisma.orderItem.create({
      data: {
        orderId: order2.id,
        productId: createdFakeProducts[2].id,
        seller_id: createdFakeProducts[2].sellerId,
        quantity: 1,
        unitPrice: createdFakeProducts[2].price,
        totalPrice: createdFakeProducts[2].price,
        product_name: createdFakeProducts[2].name,
        product_sku: createdFakeProducts[2].sku
      }
    });
    orderItems.push(orderItem3);

    // Order 3 - Shipped order for buyer2
    const order3 = await prisma.order.create({
      data: {
        buyer_id: regularUsers[3].id, // buyer2
        order_status: 'shipped',
        payment_status: 'paid',
        shippingAddressId: addresses[2].id,
        billingAddressId: addresses[3].id,
        subtotal: '199.99',
        taxAmount: '16.00',
        shippingAmount: '12.99',
        totalAmount: '228.98'
      }
    });
    orders.push(order3);

    const orderItem4 = await prisma.orderItem.create({
      data: {
        orderId: order3.id,
        productId: createdFakeProducts[3].id,
        seller_id: createdFakeProducts[3].sellerId,
        quantity: 3,
        unitPrice: createdFakeProducts[3].price,
        totalPrice: createdFakeProducts[3].price * 3,
        product_name: createdFakeProducts[3].name,
        product_sku: createdFakeProducts[3].sku
      }
    });
    orderItems.push(orderItem4);

    // Order 4 - Failed payment order
    const order4 = await prisma.order.create({
      data: {
        buyer_id: regularUsers[3].id, // buyer2
        order_status: 'pending',
        payment_status: 'failed',
        shippingAddressId: addresses[2].id,
        billingAddressId: addresses[3].id,
        subtotal: '75.50',
        taxAmount: '6.04',
        shippingAmount: '4.99',
        totalAmount: '86.53'
      }
    });
    orders.push(order4);

    const orderItem5 = await prisma.orderItem.create({
      data: {
        orderId: order4.id,
        productId: createdFakeProducts[4].id,
        seller_id: createdFakeProducts[4].sellerId,
        quantity: 1,
        unitPrice: createdFakeProducts[4].price,
        totalPrice: createdFakeProducts[4].price,
        product_name: createdFakeProducts[4].name,
        product_sku: createdFakeProducts[4].sku
      }
    });
    orderItems.push(orderItem5);
  }

  console.log('📦 Created orders:', orders.length);
  console.log('📋 Created order items:', orderItems.length);

  // Create Shipments
  const shipments = [];
  if (orders.length > 0) {
    const shipment1 = await prisma.shipment.create({
      data: {
        orderId: orders[0].id, // delivered order
        carrier: 'FedEx',
        trackingNumber: 'FX123456789US',
        shipping_method: 'Express',
        shipping_cost: '9.99',
        weight_kg: '2.5',
        status: 'delivered',
        notes: 'Package delivered successfully'
      }
    });
    shipments.push(shipment1);

    const shipment2 = await prisma.shipment.create({
      data: {
        orderId: orders[2].id, // shipped order
        carrier: 'UPS',
        trackingNumber: 'UPS987654321',
        shipping_method: 'Ground',
        shipping_cost: '12.99',
        weight_kg: '3.2',
        status: 'in_transit',
        notes: 'Package is on the way'
      }
    });
    shipments.push(shipment2);
  }

  console.log('🚚 Created shipments:', shipments.length);

  // Create Payment Transactions
  const payments = [];
  if (orders.length > 0) {
    // Successful payment for order 1
    const payment1 = await prisma.paymentTransaction.create({
      data: {
        orderId: orders[0].id,
        amount: orders[0].totalAmount,
        tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
        blockNumber: 18500000,
        from_address: '0x47e179ec197488593b187f80a00eb0da91f1b9d0', // buyer wallet
        to_address: '0x5de4111afa1a4b94908f83103eb1f1706367c2e6', // seller wallet
        status: 'confirmed'
      }
    });
    payments.push(payment1);

    // Successful payment for order 3
    const payment2 = await prisma.paymentTransaction.create({
      data: {
        orderId: orders[2].id,
        amount: orders[2].totalAmount,
        tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        blockNumber: 18500100,
        from_address: '0x47e179ec197488593b187f80a00eb0da91f1b9d0', // buyer wallet
        to_address: '0x5de4111afa1a4b94908f83103eb1f1706367c2e6', // seller wallet
        status: 'confirmed'
      }
    });
    payments.push(payment2);

    // Failed payment for order 4
    const payment3 = await prisma.paymentTransaction.create({
      data: {
        orderId: orders[3].id,
        amount: orders[3].totalAmount,
        tx_hash: '0xfailed1234567890abcdef1234567890abcdef1234567890abcdef12345',
        blockNumber: 18500200,
        from_address: '0x47e179ec197488593b187f80a00eb0da91f1b9d0', // buyer wallet
        to_address: '0x5de4111afa1a4b94908f83103eb1f1706367c2e6', // seller wallet
        status: 'failed'
      }
    });
    payments.push(payment3);

    // Pending payment for order 2
    const payment4 = await prisma.paymentTransaction.create({
      data: {
        orderId: orders[1].id,
        amount: orders[1].totalAmount,
        tx_hash: '0xpending1234567890abcdef1234567890abcdef1234567890abcdef123456',
        blockNumber: 18500300,
        from_address: '0x47e179ec197488593b187f80a00eb0da91f1b9d0', // buyer wallet
        to_address: '0x5de4111afa1a4b94908f83103eb1f1706367c2e6', // seller wallet
        status: 'pending'
      }
    });
    payments.push(payment4);
  }

  console.log('💳 Created payment transactions:', payments.length);

  // Create Notifications
  const notifications = [];
  if (orders.length > 0 && adminUsers.length > 0) {
    // Order notifications
    const notification1 = await prisma.notification.create({
      data: {
        userId: regularUsers[2].id, // buyer
        type: 'order_update',
        title: 'Order Delivered',
        message: `Your order #${orders[0].id} has been delivered successfully!`,
        related_order_id: orders[0].id,
        isRead: true
      }
    });
    notifications.push(notification1);

    const notification2 = await prisma.notification.create({
      data: {
        userId: regularUsers[3].id, // buyer2
        type: 'order_update',
        title: 'Order Shipped',
        message: `Your order #${orders[2].id} has been shipped and is on its way!`,
        related_order_id: orders[2].id,
        isRead: false
      }
    });
    notifications.push(notification2);

    const notification3 = await prisma.notification.create({
      data: {
        userId: regularUsers[3].id, // buyer2
        type: 'payment_received',
        title: 'Payment Failed',
        message: `Payment for order #${orders[3].id} has failed. Please try again.`,
        related_order_id: orders[3].id,
        isRead: false
      }
    });
    notifications.push(notification3);

    // Admin notification for seller upgrade request (example)
    const notification4 = await prisma.notification.create({
      data: {
        userId: adminUsers[0].id, // admin
        type: 'system_message',
        title: 'Seller Upgrade Request',
        message: 'A user has requested to upgrade to seller role. Please review.',
        isRead: false
      }
    });
    notifications.push(notification4);
  }

  console.log('🔔 Created notifications:', notifications.length);

  // Create Product Reviews
  const reviews = [];
  if (orderItems.length > 0 && createdFakeProducts.length > 0) {
    // Review for delivered order items
    const review1 = await prisma.product_reviews.create({
      data: {
        product_id: createdFakeProducts[0].id,
        user_id: regularUsers[2].id, // buyer
        order_item_id: orderItems[0].id,
        rating: 5,
        title: 'Excellent product!',
        review_text: 'This product exceeded my expectations. Great quality and fast shipping. Highly recommended!',
        is_verified_purchase: true,
        status: 'approved'
      }
    });
    reviews.push(review1);

    const review2 = await prisma.product_reviews.create({
      data: {
        product_id: createdFakeProducts[1].id,
        user_id: regularUsers[2].id, // buyer
        order_item_id: orderItems[1].id,
        rating: 4,
        title: 'Good value for money',
        review_text: 'Solid product with good build quality. Delivery was on time. Would buy again.',
        is_verified_purchase: true,
        status: 'approved'
      }
    });
    reviews.push(review2);

    const review3 = await prisma.product_reviews.create({
      data: {
        product_id: createdFakeProducts[3].id,
        user_id: regularUsers[3].id, // buyer2
        order_item_id: orderItems[3].id,
        rating: 3,
        title: 'Average product',
        review_text: 'The product is okay but not outstanding. It does what it\'s supposed to do.',
        is_verified_purchase: true,
        status: 'approved'
      }
    });
    reviews.push(review3);

    // Non-verified review (user didn\'t purchase)
    const review4 = await prisma.product_reviews.create({
      data: {
        product_id: createdFakeProducts[5].id,
        user_id: regularUsers[3].id, // buyer2
        rating: 2,
        title: 'Not as described',
        review_text: 'Product quality is below expectations. Would not recommend.',
        is_verified_purchase: false,
        status: 'pending'
      }
    });
    reviews.push(review4);
  }

  console.log('⭐ Created product reviews:', reviews.length);

  // Create Wishlist Items
  const wishlistItems = [];
  if (createdFakeProducts.length > 0) {
    // Buyer wishlist items
    const wishlist1 = await prisma.wishlist.create({
      data: {
        user_id: regularUsers[2].id, // buyer
        product_id: createdFakeProducts[5].id
      }
    });
    wishlistItems.push(wishlist1);

    const wishlist2 = await prisma.wishlist.create({
      data: {
        user_id: regularUsers[2].id, // buyer
        product_id: createdFakeProducts[6].id
      }
    });
    wishlistItems.push(wishlist2);

    const wishlist3 = await prisma.wishlist.create({
      data: {
        user_id: regularUsers[2].id, // buyer
        product_id: createdFakeProducts[7].id
      }
    });
    wishlistItems.push(wishlist3);

    // Buyer2 wishlist items
    const wishlist4 = await prisma.wishlist.create({
      data: {
        user_id: regularUsers[3].id, // buyer2
        product_id: createdFakeProducts[8].id
      }
    });
    wishlistItems.push(wishlist4);

    const wishlist5 = await prisma.wishlist.create({
      data: {
        user_id: regularUsers[3].id, // buyer2
        product_id: createdFakeProducts[9].id
      }
    });
    wishlistItems.push(wishlist5);

    // Add NFT to buyer's wishlist
    if (onchainProduct) {
      const wishlist6 = await prisma.wishlist.create({
        data: {
          user_id: regularUsers[2].id, // buyer
          product_id: onchainProduct.id
        }
      });
      wishlistItems.push(wishlist6);
    }
  }

  console.log('💝 Created wishlist items:', wishlistItems.length);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   👥 Users: ${adminUsers.length + regularUsers.length} (${adminUsers.length} admins, ${regularUsers.length} regular)`);
  console.log(`   📂 Categories: ${categories.length}`);
  console.log(`   📦 Products: ${createdFakeProducts.length}`);
  console.log(`   🏠 Addresses: ${addresses.length}`);
  console.log(`   📋 Orders: ${orders.length}`);
  console.log(`   📦 Order Items: ${orderItems.length}`);
  console.log(`   🚚 Shipments: ${shipments.length}`);
  console.log(`   💳 Payment Transactions: ${payments.length}`);
  console.log(`   🔔 Notifications: ${notifications.length}`);
  console.log(`   ⭐ Product Reviews: ${reviews.length}`);
  console.log(`   💝 Wishlist Items: ${wishlistItems.length}`);
  console.log('\n🔑 Admin Credentials:');
  console.log('   Username: admin | Wallet: 0x1234567890123456789012345678901234567890');
  console.log('   Username: admin2 | Wallet: 0x2345678901234567890123456789012345678901');
  console.log('   Username: seller | Wallet: 0x3456789012345678901234567890123456789012');
  console.log('   Username: buyer | Wallet: 0x4567890123456789012345678901234567890123');
  console.log('   Username: buyer2 | Wallet: 0x5678901234567890123456789012345678901234');
  console.log('   Password: 123123123');

}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
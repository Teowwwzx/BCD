const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create Admin Users
  const adminUsers = await Promise.all([
    prisma.user.create({
      data: {
        walletAddress: '0x1234567890123456789012345678901234567890',
        username: 'admin',
        email: 'admin@bcdmarketplace.com',
        profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        bio: 'System Administrator - Managing the BCD Marketplace platform',
        userRole: 'Admin',
        reputationScore: 1000
      }
    }),
    prisma.user.create({
      data: {
        walletAddress: '0x2345678901234567890123456789012345678901',
        username: 'superadmin',
        email: 'superadmin@bcdmarketplace.com',
        profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        bio: 'Super Administrator with full system access',
        userRole: 'Admin',
        reputationScore: 1000
      }
    })
  ]);

  // Create Regular Users
  const regularUsers = await Promise.all([
    prisma.user.create({
      data: {
        walletAddress: '0x3456789012345678901234567890123456789012',
        username: 'manufacturer_tech',
        email: 'tech@manufacturer.com',
        profileImageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
        bio: 'Leading technology manufacturer specializing in electronics',
        userRole: 'Manufacturer',
        reputationScore: 850
      }
    }),
    prisma.user.create({
      data: {
        walletAddress: '0x4567890123456789012345678901234567890123',
        username: 'supplier_global',
        email: 'contact@globalsupplier.com',
        profileImageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        bio: 'Global supplier of raw materials and components',
        userRole: 'Supplier',
        reputationScore: 720
      }
    }),
    prisma.user.create({
      data: {
        walletAddress: '0x5678901234567890123456789012345678901234',
        username: 'distributor_east',
        email: 'sales@eastdistributor.com',
        profileImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        bio: 'Regional distributor covering eastern markets',
        userRole: 'Distributor',
        reputationScore: 680
      }
    }),
    prisma.user.create({
      data: {
        walletAddress: '0x6789012345678901234567890123456789012345',
        username: 'retailer_store',
        email: 'info@retailstore.com',
        profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        bio: 'Multi-location retail chain serving consumers',
        userRole: 'Retailer',
        reputationScore: 590
      }
    }),
    prisma.user.create({
      data: {
        walletAddress: '0x7890123456789012345678901234567890123456',
        username: 'logistics_express',
        email: 'dispatch@logisticsexpress.com',
        profileImageUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=150',
        bio: 'Express logistics and shipping services',
        userRole: 'Logistics',
        reputationScore: 750
      }
    })
  ]);

  console.log('👥 Created users:', adminUsers.length + regularUsers.length);

  // Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sellerId: regularUsers[0].id, // manufacturer_tech
        name: 'Industrial IoT Sensor Module',
        description: 'High-precision temperature and humidity sensor for industrial applications. Features wireless connectivity and long battery life.',
        category: 'Electronics',
        price: 299.99,
        quantity: 150,
        location: 'Shenzhen, China',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        status: 'Available'
      }
    }),
    prisma.product.create({
      data: {
        sellerId: regularUsers[1].id, // supplier_global
        name: 'Premium Steel Alloy Sheets',
        description: 'High-grade steel alloy sheets suitable for automotive and aerospace applications. Certified quality standards.',
        category: 'Raw Materials',
        price: 1250.00,
        quantity: 500,
        location: 'Pittsburgh, USA',
        imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400',
        status: 'Available'
      }
    }),
    prisma.product.create({
      data: {
        sellerId: regularUsers[0].id, // manufacturer_tech
        name: 'Smart LED Display Panel',
        description: 'Energy-efficient LED display panel with smart controls and customizable brightness settings.',
        category: 'Electronics',
        price: 899.99,
        quantity: 75,
        location: 'Seoul, South Korea',
        imageUrl: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400',
        status: 'Available'
      }
    }),
    prisma.product.create({
      data: {
        sellerId: regularUsers[1].id, // supplier_global
        name: 'Organic Cotton Fabric Rolls',
        description: 'Certified organic cotton fabric rolls perfect for sustainable textile manufacturing.',
        category: 'Textiles',
        price: 45.50,
        quantity: 200,
        location: 'Mumbai, India',
        imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400',
        status: 'Available'
      }
    }),
    prisma.product.create({
      data: {
        sellerId: regularUsers[2].id, // distributor_east
        name: 'Professional Power Tools Set',
        description: 'Complete set of professional-grade power tools including drill, saw, and grinder with carrying case.',
        category: 'Tools',
        price: 650.00,
        quantity: 30,
        location: 'Boston, USA',
        imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400',
        status: 'Available'
      }
    })
  ]);

  console.log('📦 Created products:', products.length);

  // Create Orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        productId: products[0].id,
        buyerId: regularUsers[2].id, // distributor_east
        sellerId: regularUsers[0].id, // manufacturer_tech
        transporterId: regularUsers[4].id, // logistics_express
        onChainTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        finalPrice: 2999.90, // 10 units
        quantityPurchased: 10,
        status: 'Completed'
      }
    }),
    prisma.order.create({
      data: {
        productId: products[1].id,
        buyerId: regularUsers[0].id, // manufacturer_tech
        sellerId: regularUsers[1].id, // supplier_global
        transporterId: regularUsers[4].id, // logistics_express
        onChainTxHash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        finalPrice: 6250.00, // 5 units
        quantityPurchased: 5,
        status: 'InTransit'
      }
    }),
    prisma.order.create({
      data: {
        productId: products[2].id,
        buyerId: regularUsers[3].id, // retailer_store
        sellerId: regularUsers[0].id, // manufacturer_tech
        onChainTxHash: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
        finalPrice: 1799.98, // 2 units
        quantityPurchased: 2,
        status: 'AwaitingShipment'
      }
    })
  ]);

  console.log('🛒 Created orders:', orders.length);

  // Create Shipments
  const shipments = await Promise.all([
    prisma.shipment.create({
      data: {
        orderId: orders[0].id,
        transporterId: regularUsers[4].id, // logistics_express
        trackingNumber: 'TRK001234567890',
        shippedAt: new Date('2024-01-15'),
        estimatedDelivery: new Date('2024-01-20'),
        deliveredAt: new Date('2024-01-19'),
        proofOfDeliveryHash: '0xdelivery1234567890abcdef1234567890abcdef1234567890abcdef123456'
      }
    }),
    prisma.shipment.create({
      data: {
        orderId: orders[1].id,
        transporterId: regularUsers[4].id, // logistics_express
        trackingNumber: 'TRK987654321098',
        shippedAt: new Date('2024-01-18'),
        estimatedDelivery: new Date('2024-01-25')
      }
    })
  ]);

  console.log('🚚 Created shipments:', shipments.length);

  // Create Reviews
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        orderId: orders[0].id,
        reviewerId: regularUsers[2].id, // distributor_east (buyer)
        revieweeId: regularUsers[0].id, // manufacturer_tech (seller)
        rating: 5,
        comment: 'Excellent product quality and fast delivery. Highly recommended!',
        onChainReviewHash: '0xreview1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      }
    }),
    prisma.review.create({
      data: {
        orderId: orders[0].id,
        reviewerId: regularUsers[2].id, // distributor_east (buyer)
        revieweeId: regularUsers[4].id, // logistics_express (transporter)
        rating: 4,
        comment: 'Good shipping service, delivered on time.',
        onChainReviewHash: '0xreview0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
      }
    })
  ]);

  console.log('⭐ Created reviews:', reviews.length);

  // Create Attachments
  const attachments = await Promise.all([
    prisma.attachment.create({
      data: {
        productId: products[0].id,
        fileName: 'sensor_datasheet.pdf',
        fileUrl: 'https://example.com/files/sensor_datasheet.pdf',
        description: 'Technical specifications and installation guide'
      }
    }),
    prisma.attachment.create({
      data: {
        productId: products[1].id,
        fileName: 'steel_certificate.pdf',
        fileUrl: 'https://example.com/files/steel_certificate.pdf',
        description: 'Quality certification and material composition'
      }
    })
  ]);

  console.log('📎 Created attachments:', attachments.length);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   👥 Users: ${adminUsers.length + regularUsers.length} (${adminUsers.length} admins, ${regularUsers.length} regular)`);
  console.log(`   📦 Products: ${products.length}`);
  console.log(`   🛒 Orders: ${orders.length}`);
  console.log(`   🚚 Shipments: ${shipments.length}`);
  console.log(`   ⭐ Reviews: ${reviews.length}`);
  console.log(`   📎 Attachments: ${attachments.length}`);
  console.log('\n🔑 Admin Credentials:');
  console.log('   Username: admin | Wallet: 0x1234567890123456789012345678901234567890');
  console.log('   Username: superadmin | Wallet: 0x2345678901234567890123456789012345678901');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
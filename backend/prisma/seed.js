const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, saltRounds);
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  // The order of deletion is important to avoid foreign key constraint errors.
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create Admin Users
  const adminUsers = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@bcdmarketplace.com',
        passwordHash,
        profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        bio: 'System Administrator - Managing the BCD Marketplace platform',
        role: 'Admin',
        wallets: {
          create: {
            walletAddress: '0x1234567890123456789012345678901234567890',
            walletType: 'MetaMask'
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        username: 'superadmin',
        email: 'superadmin@bcdmarketplace.com',
        passwordHash,
        profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        bio: 'Super Administrator with full system access',
        role: 'Admin',
        wallets: {
          create: {
            walletAddress: '0x2345678901234567890123456789012345678901',
            walletType: 'MetaMask'
          }
        }
      }
    })
  ]);

  // Create Regular Users
  const regularUsers = await Promise.all([
    prisma.user.create({
      data: {
        username: 'manufacturer_tech',
        email: 'tech@manufacturer.com',
        passwordHash,
        profileImageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
        bio: 'Leading technology manufacturer specializing in electronics',
        role: 'Seller',
        wallets: {
          create: {
            walletAddress: '0x3456789012345678901234567890123456789012',
            walletType: 'MetaMask'
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        username: 'supplier_global',
        email: 'contact@globalsupplier.com',
        passwordHash,
        profileImageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        bio: 'Global supplier of raw materials and components',
        role: 'Seller',
        wallets: {
          create: {
            walletAddress: '0x4567890123456789012345678901234567890123',
            walletType: 'MetaMask'
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        username: 'distributor_east',
        email: 'sales@eastdistributor.com',
        passwordHash,
        profileImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        bio: 'Regional distributor covering eastern markets',
        role: 'Buyer',
        wallets: {
          create: {
            walletAddress: '0x5678901234567890123456789012345678901234',
            walletType: 'MetaMask'
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        username: 'retailer_store',
        email: 'info@retailstore.com',
        passwordHash,
        profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        bio: 'Multi-location retail chain serving consumers',
        role: 'Buyer',
        wallets: {
          create: {
            walletAddress: '0x6789012345678901234567890123456789012345',
            walletType: 'MetaMask'
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        username: 'logistics_express',
        email: 'dispatch@logisticsexpress.com',
        passwordHash,
        profileImageUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=150',
        bio: 'Express logistics and shipping services',
        role: 'Buyer',
        wallets: {
          create: {
            walletAddress: '0x7890123456789012345678901234567890123456',
            walletType: 'MetaMask'
          }
        }
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

  // Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sellerId: regularUsers[0].id, // manufacturer_tech
        categoryId: categories[0].id, // Electronics
        name: 'Industrial IoT Sensor Module',
        description: 'High-precision temperature and humidity sensor for industrial applications. Features wireless connectivity and long battery life.',
        priceEth: 0.15,
        priceUsd: 299.99,
        stockQuantity: 150,
        status: 'active'
      }
    }),
    prisma.product.create({
      data: {
        sellerId: regularUsers[1].id, // supplier_global
        categoryId: categories[1].id, // Raw Materials
        name: 'Premium Steel Alloy Sheets',
        description: 'High-grade steel alloy sheets suitable for automotive and aerospace applications. Certified quality standards.',
        priceEth: 0.625,
        priceUsd: 1250.00,
        stockQuantity: 500,
        status: 'active'
      }
    }),
    prisma.product.create({
      data: {
        sellerId: regularUsers[0].id, // manufacturer_tech
        categoryId: categories[0].id, // Electronics
        name: 'Smart LED Display Panel',
        description: 'Energy-efficient LED display panel with smart controls and customizable brightness settings.',
        priceEth: 0.45,
        priceUsd: 899.99,
        stockQuantity: 75,
        status: 'active'
      }
    }),
    prisma.product.create({
      data: {
        sellerId: regularUsers[1].id, // supplier_global
        categoryId: categories[2].id, // Textiles
        name: 'Organic Cotton Fabric Rolls',
        description: 'Certified organic cotton fabric rolls perfect for sustainable textile manufacturing.',
        priceEth: 0.02275,
        priceUsd: 45.50,
        stockQuantity: 200,
        status: 'active'
      }
    }),
    prisma.product.create({
      data: {
        sellerId: regularUsers[2].id, // distributor_east
        categoryId: categories[3].id, // Tools
        name: 'Professional Power Tools Set',
        description: 'Complete set of professional-grade power tools including drill, saw, and grinder with carrying case.',
        priceEth: 0.325,
        priceUsd: 650.00,
        stockQuantity: 30,
        status: 'active'
      }
    })
  ]);

  console.log('📦 Created products:', products.length);

  // Create Orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        orderNumber: 'ORD-001-2024',
        userId: regularUsers[2].id, // distributor_east
        subtotal: 2999.90,
        totalAmount: 2999.90,
        orderItems: {
          create: [
            {
              productId: products[0].id,
              quantity: 10,
              unitPrice: 299.99,
              totalPrice: 2999.90
            }
          ]
        }
      }
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-002-2024',
        userId: regularUsers[0].id, // manufacturer_tech
        subtotal: 6250.00,
        totalAmount: 6250.00,
        orderItems: {
          create: [
            {
              productId: products[1].id,
              quantity: 5,
              unitPrice: 1250.00,
              totalPrice: 6250.00
            }
          ]
        }
      }
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-003-2024',
        userId: regularUsers[3].id, // retailer_store
        subtotal: 1799.98,
        totalAmount: 1799.98,
        orderItems: {
          create: [
            {
              productId: products[2].id,
              quantity: 2,
              unitPrice: 899.99,
              totalPrice: 1799.98
            }
          ]
        }
      }
    })
  ]);

  console.log('🛒 Created orders:', orders.length);

  // Create Reviews
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        productId: products[0].id,
        userId: regularUsers[2].id, // distributor_east (buyer)
        rating: 5,
        comment: 'Excellent product quality and fast delivery. Highly recommended!'
      }
    }),
    prisma.review.create({
      data: {
        productId: products[1].id,
        userId: regularUsers[0].id, // manufacturer_tech
        rating: 4,
        comment: 'Good quality steel, meets specifications.'
      }
    })
  ]);

  console.log('⭐ Created reviews:', reviews.length);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   👥 Users: ${adminUsers.length + regularUsers.length} (${adminUsers.length} admins, ${regularUsers.length} regular)`);
  console.log(`   📂 Categories: ${categories.length}`);
  console.log(`   📦 Products: ${products.length}`);
  console.log(`   🛒 Orders: ${orders.length}`);
  console.log(`   ⭐ Reviews: ${reviews.length}`);
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
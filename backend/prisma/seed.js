const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const axios = require('axios');
const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;
  const password = '123123123';
  const passwordHash = await bcrypt.hash(password, saltRounds);
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  // The order of deletion is important to avoid foreign key constraint errors.
  console.log('🗑️  Clearing existing data...');
  await prisma.coupon_usage.deleteMany();
  await prisma.product_reviews.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.CartItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.ProductImage.deleteMany();
  await prisma.ProductAttribute.deleteMany();
  await prisma.Product.deleteMany();
  await prisma.Category.deleteMany();
  await prisma.user_addresses.deleteMany();
  await prisma.user_wallets.deleteMany();
  await prisma.Notification.deleteMany();
  await prisma.User.deleteMany();
  await prisma.Coupon.deleteMany();
  await prisma.SystemSetting.deleteMany();
  await prisma.audit_log.deleteMany();
  console.log('🗑️  Cleared existing data');

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
            wallet_addr: '0x1234567890123456789012345678901234567890',
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
            wallet_addr: '0x2345678901234567890123456789012345678901',
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
            wallet_addr: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', // Vitalik Buterin's address for example
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
        user_wallets: {
          create: {
            wallet_addr: '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e',
            is_verified: true,
          }
        }
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
            wallet_addr: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
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
        user_wallets: {
          create: {
            wallet_addr: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
            is_verified: true,
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

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   👥 Users: ${adminUsers.length + regularUsers.length} (${adminUsers.length} admins, ${regularUsers.length} regular)`);
  console.log(`   📂 Categories: ${categories.length}`);
  console.log(`   📦 Products: ${createdFakeProducts.length}`);
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
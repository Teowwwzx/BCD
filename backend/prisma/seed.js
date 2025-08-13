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
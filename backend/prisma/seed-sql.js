const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const axios = require('axios');
const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;
  const password = '123123123';
  const passwordHash = await bcrypt.hash(password, saltRounds);
  console.log('🌱 Starting database seeding with raw SQL...');

  // Clear existing data using raw SQL
  console.log('🗑️  Clearing existing data...');
  await prisma.$executeRawUnsafe('DELETE FROM coupon_usage;');
  await prisma.$executeRawUnsafe('DELETE FROM product_reviews;');
  await prisma.$executeRawUnsafe('DELETE FROM "OrderItem";');
  await prisma.$executeRawUnsafe('DELETE FROM shipment;');
  await prisma.$executeRawUnsafe('DELETE FROM "PaymentTransaction";');
  await prisma.$executeRawUnsafe('DELETE FROM "Order";');
  await prisma.$executeRawUnsafe('DELETE FROM "CartItem";');
  await prisma.$executeRawUnsafe('DELETE FROM wishlist;');
  await prisma.$executeRawUnsafe('DELETE FROM "ProductImage";');
  await prisma.$executeRawUnsafe('DELETE FROM "ProductAttribute";');
  await prisma.$executeRawUnsafe('DELETE FROM "Product";');
  await prisma.$executeRawUnsafe('DELETE FROM "Category";');
  await prisma.$executeRawUnsafe('DELETE FROM user_addresses;');
  await prisma.$executeRawUnsafe('DELETE FROM user_wallets;');
  await prisma.$executeRawUnsafe('DELETE FROM "Notification";');
  await prisma.$executeRawUnsafe('DELETE FROM "User";');
  await prisma.$executeRawUnsafe('DELETE FROM "Coupon";');
  await prisma.$executeRawUnsafe('DELETE FROM "SystemSetting";');
  await prisma.$executeRawUnsafe('DELETE FROM audit_log;');
  console.log('🗑️  Cleared existing data');

  // Create Admin Users
  const adminUsers = [
    {
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
    },
    {
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
    }
  ];

  for (const user of adminUsers) {
    await prisma.$executeRawUnsafe(`INSERT INTO "User" (username, email, "passwordHash", f_name, l_name, phone, dob, "profileImageUrl", user_role, status) VALUES ('${user.username}', '${user.email}', '${user.passwordHash}', '${user.f_name}', '${user.l_name}', '${user.phone}', '${user.dob.toISOString()}', '${user.profileImageUrl}', '${user.user_role}', '${user.status}');`);
  }

  // Create Regular Users
  const regularUsers = [
        {
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
        },
        {
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
        }
  ];

  for (const user of regularUsers) {
    await prisma.$executeRawUnsafe(`INSERT INTO "User" (username, email, "passwordHash", f_name, l_name, phone, dob, "profileImageUrl", user_role, status) VALUES ('${user.username}', '${user.email}', '${user.passwordHash}', '${user.f_name}', '${user.l_name}', '${user.phone}', '${user.dob.toISOString()}', '${user.profileImageUrl}', '${user.user_role}', '${user.status}');`);
  }

  console.log(`👥 Created users: ${adminUsers.length + regularUsers.length}`);

  // Create Categories
  const categories = [
    { name: 'Electronics', description: 'Electronic devices and components' },
    { name: 'Raw Materials', description: 'Raw materials for manufacturing' },
    { name: 'Textiles', description: 'Textile and fabric products' },
    { name: 'Tools', description: 'Professional tools and equipment' }
  ];

  for (const category of categories) {
    await prisma.$executeRawUnsafe(`INSERT INTO "Category" (name, description) VALUES ('${category.name}', '${category.description}');`);
  }

  console.log(`📂 Created categories: ${categories.length}`);

  // Fetch products from Fake Store API and add them to the database
  try {
    const response = await axios.get('https://fakestoreapi.com/products');
    const fakeProducts = response.data;

    const allUsers = await prisma.user.findMany();
    const allCategories = await prisma.category.findMany();

    for (const p of fakeProducts) {
        const seller = allUsers[Math.floor(Math.random() * allUsers.length)];
        const category = allCategories[Math.floor(Math.random() * allCategories.length)];
        const productName = p.title.replace(/'/g, "''");
        const productDescription = p.description.replace(/'/g, "''");

        await prisma.$executeRawUnsafe(`INSERT INTO "Product" ("sellerId", "categoryId", name, description, price, quantity, status) VALUES ('${seller.id}', '${category.id}', '${productName}', '${productDescription}', ${p.price}, ${p.rating.count}, 'active');`);
        const newProduct = await prisma.product.findFirst({ where: { name: productName } });

        if (newProduct) {
            const imageUrl = p.image.replace(/'/g, "''");
            const altText = p.title.replace(/'/g, "''");
            await prisma.$executeRawUnsafe(`INSERT INTO "ProductImage" ("productId", "imageUrl", "altText") VALUES ('${newProduct.id}', '${imageUrl}', '${altText}');`);
        }
    }

    console.log(`🛍️ Created products from Fake Store API: ${fakeProducts.length}`);
  } catch (error) {
    console.error('❌ Error fetching or creating products from Fake Store API:', error);
  }

  console.log('\n🎉 Database seeding with raw SQL completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
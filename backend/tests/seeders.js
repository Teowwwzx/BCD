require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

/**
 * Test Data Seeding Utilities for BCD Marketplace
 * 
 * This module provides utilities to seed the database with consistent test data
 * for categories, products, users, and other entities needed for comprehensive testing.
 */

class TestDataSeeder {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  /**
   * Seed categories for product testing
   */
  async seedCategories() {
    const categories = [
      {
        id: 1,
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
        status: 'active'
      },
      {
        id: 2,
        name: 'Clothing',
        description: 'Fashion and apparel',
        status: 'active'
      },
      {
        id: 3,
        name: 'Books',
        description: 'Books and educational materials',
        status: 'active'
      },
      {
        id: 4,
        name: 'Home & Garden',
        description: 'Home improvement and gardening supplies',
        status: 'active'
      },
      {
        id: 5,
        name: 'Sports',
        description: 'Sports equipment and accessories',
        status: 'inactive'
      }
    ];

    for (const category of categories) {
      await this.prisma.category.upsert({
        where: { id: category.id },
        update: category,
        create: category
      });
    }

    console.log(`✅ Seeded ${categories.length} categories`);
    return categories;
  }

  /**
   * Seed test users for different roles
   */
  async seedUsers() {
    const users = [
      {
        id: 1,
        username: 'testbuyer',
        email: 'testbuyer@test.com',
        passwordHash: await bcrypt.hash('password123', 10),
        user_role: 'buyer',
        status: 'active'
      },
      {
        id: 2,
        username: 'testseller',
        email: 'testseller@test.com',
        passwordHash: await bcrypt.hash('password123', 10),
        user_role: 'seller',
        status: 'active'
      },
      {
        id: 3,
        username: 'testadmin',
        email: 'testadmin@test.com',
        passwordHash: await bcrypt.hash('password123', 10),
        user_role: 'admin',
        status: 'active'
      },
      {
        id: 4,
        username: 'testseller2',
        email: 'testseller2@test.com',
        passwordHash: await bcrypt.hash('password123', 10),
        user_role: 'seller',
        status: 'active'
      },
      {
        id: 5,
        username: 'testbuyer2',
        email: 'testbuyer2@test.com',
        passwordHash: await bcrypt.hash('password123', 10),
        user_role: 'buyer',
        status: 'inactive'
      }
    ];

    for (const user of users) {
      await this.prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      });
    }

    console.log(`✅ Seeded ${users.length} test users`);
    return users;
  }

  /**
   * Seed products for testing
   */
  async seedProducts() {
    const products = [
      {
        id: 1,
        name: 'Test Smartphone',
        description: 'A high-quality smartphone for testing',
        price: 599.99,
        stock_quantity: 50,
        category_id: 1,
        seller_id: 2,
        status: 'active'
      },
      {
        id: 2,
        name: 'Test Laptop',
        description: 'A powerful laptop for development',
        price: 1299.99,
        stock_quantity: 25,
        category_id: 1,
        seller_id: 2,
        status: 'active'
      },
      {
        id: 3,
        name: 'Test T-Shirt',
        description: 'Comfortable cotton t-shirt',
        price: 29.99,
        stock_quantity: 100,
        category_id: 2,
        seller_id: 4,
        status: 'active'
      },
      {
        id: 4,
        name: 'Test Programming Book',
        description: 'Learn programming with this comprehensive guide',
        price: 49.99,
        stock_quantity: 75,
        category_id: 3,
        seller_id: 2,
        status: 'active'
      },
      {
        id: 5,
        name: 'Test Garden Tool',
        description: 'Essential tool for gardening',
        price: 19.99,
        stock_quantity: 30,
        category_id: 4,
        seller_id: 4,
        status: 'active'
      },
      {
        id: 6,
        name: 'Out of Stock Item',
        description: 'This item is currently out of stock',
        price: 99.99,
        stock_quantity: 0,
        category_id: 1,
        seller_id: 2,
        status: 'active'
      },
      {
        id: 7,
        name: 'Inactive Product',
        description: 'This product is inactive',
        price: 79.99,
        stock_quantity: 10,
        category_id: 2,
        seller_id: 4,
        status: 'inactive'
      }
    ];

    for (const product of products) {
      await this.prisma.product.upsert({
        where: { id: product.id },
        update: product,
        create: product
      });
    }

    console.log(`✅ Seeded ${products.length} test products`);
    return products;
  }

  /**
   * Seed shipping methods
   */
  async seedShippingMethods() {
    const shippingMethods = [
      {
        id: 1,
        name: 'Standard Shipping',
        description: '5-7 business days',
        price: 5.99,
        estimated_days: 7
      },
      {
        id: 2,
        name: 'Express Shipping',
        description: '2-3 business days',
        price: 12.99,
        estimated_days: 3
      },
      {
        id: 3,
        name: 'Overnight Shipping',
        description: 'Next business day',
        price: 24.99,
        estimated_days: 1
      },
      {
        id: 4,
        name: 'Free Shipping',
        description: 'Free shipping for orders over $50',
        price: 0.00,
        estimated_days: 10
      }
    ];

    for (const method of shippingMethods) {
      await this.prisma.shippingMethod.upsert({
        where: { id: method.id },
        update: method,
        create: method
      });
    }

    console.log(`✅ Seeded ${shippingMethods.length} shipping methods`);
    return shippingMethods;
  }

  /**
   * Seed system settings
   */
  async seedSystemSettings() {
    const settings = [
      {
        setting_key: 'site_name',
        setting_value: 'BCD Marketplace Test',
        description: 'Name of the marketplace'
      },
      {
        setting_key: 'currency',
        setting_value: 'USD',
        description: 'Default currency'
      },
      {
        setting_key: 'tax_rate',
        setting_value: '0.08',
        description: 'Default tax rate (8%)'
      },
      {
        setting_key: 'min_order_amount',
        setting_value: '10.00',
        description: 'Minimum order amount'
      },
      {
        setting_key: 'free_shipping_threshold',
        setting_value: '50.00',
        description: 'Free shipping threshold'
      }
    ];

    for (const setting of settings) {
      await this.prisma.systemSetting.upsert({
        where: { setting_key: setting.setting_key },
        update: setting,
        create: setting
      });
    }

    console.log(`✅ Seeded ${settings.length} system settings`);
    return settings;
  }

  /**
   * Seed sample orders for testing
   */
  async seedOrders() {
    const orders = [
      {
        id: 1,
        user_id: 1,
        total_amount: 629.98,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'credit_card',
        shipping_address: '123 Test Street, Test City, TC 12345',
        shipping_method_id: 1
      },
      {
        id: 2,
        user_id: 1,
        total_amount: 1329.98,
        status: 'processing',
        payment_status: 'completed',
        payment_method: 'paypal',
        shipping_address: '123 Test Street, Test City, TC 12345',
        shipping_method_id: 2
      },
      {
        id: 3,
        user_id: 5,
        total_amount: 79.98,
        status: 'shipped',
        payment_status: 'completed',
        payment_method: 'credit_card',
        shipping_address: '456 Another Street, Another City, AC 67890',
        shipping_method_id: 1
      }
    ];

    for (const order of orders) {
      await this.prisma.order.upsert({
        where: { id: order.id },
        update: order,
        create: order
      });
    }

    console.log(`✅ Seeded ${orders.length} test orders`);
    return orders;
  }

  /**
   * Seed order items
   */
  async seedOrderItems() {
    const orderItems = [
      {
        id: 1,
        order_id: 1,
        product_id: 1,
        quantity: 1,
        price: 599.99
      },
      {
        id: 2,
        order_id: 1,
        product_id: 3,
        quantity: 1,
        price: 29.99
      },
      {
        id: 3,
        order_id: 2,
        product_id: 2,
        quantity: 1,
        price: 1299.99
      },
      {
        id: 4,
        order_id: 2,
        product_id: 3,
        quantity: 1,
        price: 29.99
      },
      {
        id: 5,
        order_id: 3,
        product_id: 4,
        quantity: 1,
        price: 49.99
      },
      {
        id: 6,
        order_id: 3,
        product_id: 3,
        quantity: 1,
        price: 29.99
      }
    ];

    for (const item of orderItems) {
      await this.prisma.orderItem.upsert({
        where: { id: item.id },
        update: item,
        create: item
      });
    }

    console.log(`✅ Seeded ${orderItems.length} order items`);
    return orderItems;
  }

  /**
   * Seed all test data
   */
  async seedAll() {
    console.log('🌱 Starting test data seeding...');
    
    try {
      await this.seedCategories();
      await this.seedUsers();
      await this.seedProducts();
      await this.seedShippingMethods();
      await this.seedSystemSettings();
      await this.seedOrders();
      await this.seedOrderItems();
      
      console.log('🎉 All test data seeded successfully!');
      
    } catch (error) {
      console.error('❌ Error seeding test data:', error);
      throw error;
    }
  }

  /**
   * Clean all test data
   */
  async cleanAll() {
    console.log('🧹 Cleaning all test data...');
    
    try {
      // Delete in reverse order of dependencies
      await this.prisma.orderItem.deleteMany({});
      await this.prisma.order.deleteMany({});
      await this.prisma.product.deleteMany({});
      await this.prisma.category.deleteMany({});
      await this.prisma.user.deleteMany({});
      await this.prisma.shippingMethod.deleteMany({});
      await this.prisma.systemSetting.deleteMany({});
      
      console.log('✅ All test data cleaned successfully!');
      
    } catch (error) {
      console.error('❌ Error cleaning test data:', error);
      throw error;
    }
  }

  /**
   * Reset and reseed all test data
   */
  async resetAndSeed() {
    await this.cleanAll();
    await this.seedAll();
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const seeder = new TestDataSeeder();
  
  async function runCommand() {
    try {
      switch (command) {
        case 'seed':
          await seeder.seedAll();
          break;
        case 'clean':
          await seeder.cleanAll();
          break;
        case 'reset':
          await seeder.resetAndSeed();
          break;
        case 'categories':
          await seeder.seedCategories();
          break;
        case 'users':
          await seeder.seedUsers();
          break;
        case 'products':
          await seeder.seedProducts();
          break;
        case 'orders':
          await seeder.seedOrders();
          await seeder.seedOrderItems();
          break;
        default:
          console.log(`
BCD Marketplace Test Data Seeder

Usage: node seeders.js <command>

Commands:
  seed       Seed all test data
  clean      Clean all test data
  reset      Clean and reseed all test data
  categories Seed only categories
  users      Seed only users
  products   Seed only products
  orders     Seed only orders and order items

Examples:
  node seeders.js seed
  node seeders.js reset
  node seeders.js clean
`);
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Seeder failed:', error.message);
      process.exit(1);
    } finally {
      await seeder.disconnect();
    }
  }
  
  runCommand();
}

module.exports = TestDataSeeder;
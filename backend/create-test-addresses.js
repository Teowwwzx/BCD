const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestAddresses() {
  try {
    // First check if addresses already exist
    const existing = await prisma.user_addresses.findMany({
      where: { user_id: 7 }
    });
    
    if (existing.length > 0) {
      console.log('User 7 already has addresses:', existing);
      return existing;
    }

    // Create test addresses for user 7
    const addresses = await prisma.user_addresses.createMany({
      data: [
        {
          user_id: 7,
          address_type: 'shipping',
          location_type: 'residential',
          is_default: true,
          addr_line_1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postcode: '10001',
          country: 'USA'
        },
        {
          user_id: 7,
          address_type: 'billing',
          location_type: 'residential',
          is_default: true,
          addr_line_1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postcode: '10001',
          country: 'USA'
        }
      ]
    });
    
    console.log('Created addresses:', addresses);
    
    // Fetch and return the created addresses
    const created = await prisma.user_addresses.findMany({
      where: { user_id: 7 }
    });
    
    console.log('User 7 addresses:', created);
    return created;
  } catch (error) {
    console.error('Error creating addresses:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestAddresses();
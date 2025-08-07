const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQuery() {
  try {
    console.log('Testing database query...');
    const products = await prisma.product.findMany({
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            user_role: true
          }
        },
        images: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    });
    
    console.log('Direct DB query successful:');
    console.log(JSON.stringify(products, null, 2));
  } catch (err) {
    console.error('Direct DB query failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();
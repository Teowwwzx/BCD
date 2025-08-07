const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: true,
        seller: true
      }
    });
    
    console.log('Products in database:');
    products.forEach(p => {
      console.log(`- ID: ${p.id}, Name: ${p.name}, Price: ${p.price}, Images: ${p.images.length}`);
    });
    
    console.log(`\nTotal products: ${products.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
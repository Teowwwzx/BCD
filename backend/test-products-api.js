async function testProductsAPI() {
  try {
    const response = await fetch('http://localhost:5000/api/products');
    const data = await response.json();
    
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\nProducts summary:');
    data.data.forEach(product => {
      console.log(`- ID: ${product.id}, Name: ${product.name}, Price: ${product.price}, Images: ${product.images ? product.images.length : 'N/A'}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

testProductsAPI();
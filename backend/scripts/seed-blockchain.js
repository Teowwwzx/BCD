const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Seeding blockchain with sample listings...');

  // Load deployment info
  const deploymentPath = path.join(__dirname, '../../frontend/src/lib/deployment-info.json');
  let deploymentInfo;
  
  try {
    deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  } catch (error) {
    console.error('Could not load deployment info:', error.message);
    return;
  }

  // Get signer (first account from hardhat node)
  const [signer] = await ethers.getSigners();
  console.log('Using account:', signer.address);

  // Get contract instance
  const marketplace = await ethers.getContractAt('DSCMMarketplace', deploymentInfo.contractAddress, signer);

  // Sample blockchain products to create
  const sampleProducts = [
    {
      name: "Premium Laptop",
      description: "High-performance laptop with 16GB RAM and 512GB SSD",
      category: "Electronics",
      price: "0.5", // ETH
      quantity: 5,
      location: "Digital Marketplace",
      imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500"
    },
    {
      name: "Wireless Headphones",
      description: "Noise-cancelling wireless headphones with premium sound quality",
      category: "Electronics", 
      price: "0.1", // ETH
      quantity: 10,
      location: "Digital Marketplace",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
    },
    {
      name: "Smart Watch",
      description: "Advanced fitness tracking smartwatch with heart rate monitor",
      category: "Electronics",
      price: "0.2", // ETH
      quantity: 8,
      location: "Digital Marketplace", 
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
    }
  ];

  try {
    for (let i = 0; i < sampleProducts.length; i++) {
      const product = sampleProducts[i];
      console.log(`\nCreating listing ${i + 1}: ${product.name}`);
      
      const priceInWei = ethers.parseEther(product.price);
      
      const tx = await marketplace.createListing(
        product.name,
        product.description,
        product.category,
        priceInWei,
        product.quantity,
        product.location,
        product.imageUrl
      );
      
      const receipt = await tx.wait();
      console.log(`✓ Created listing with transaction: ${receipt.hash}`);
      
      // Wait a bit between transactions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✓ All blockchain listings created successfully!');
    
    // Verify listings were created
    const totalListings = await marketplace.getTotalListings();
    console.log(`Total listings now: ${totalListings}`);

  } catch (error) {
    console.error('Error creating listings:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
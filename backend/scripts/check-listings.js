const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Checking blockchain listings...');

  // Load deployment info
  const deploymentPath = path.join(__dirname, '../../frontend/src/lib/deployment-info.json');
  let deploymentInfo;
  
  try {
    deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  } catch (error) {
    console.error('Could not load deployment info:', error.message);
    return;
  }

  // Get contract instance
  const marketplace = await ethers.getContractAt('DSCMMarketplace', deploymentInfo.contractAddress);

  try {
    // Get total listings
    const totalListings = await marketplace.getTotalListings();
    console.log(`Total listings in contract: ${totalListings}`);

    if (totalListings > 0) {
      console.log('\nExisting listings:');
      for (let i = 1; i <= totalListings; i++) {
        try {
          const listing = await marketplace.getListing(i);
          console.log(`Listing ID ${i}:`);
          console.log(`  Name: ${listing.name}`);
          console.log(`  Price: ${ethers.formatEther(listing.price)} ETH`);
          console.log(`  Quantity: ${listing.quantity}`);
          console.log(`  Status: ${listing.status} (0=Active, 1=Sold, 2=Cancelled)`);
          console.log(`  Seller: ${listing.seller}`);
          console.log('---');
        } catch (err) {
          console.log(`  Error getting listing ${i}: ${err.message}`);
        }
      }
    } else {
      console.log('No listings found in the contract.');
    }

  } catch (error) {
    console.error('Error checking listings:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
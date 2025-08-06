const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying DSCMMarketplace contract...");

  // Get the contract factory
  const DSCMMarketplace = await ethers.getContractFactory("DSCMMarketplace");

  // Deploy the contract
  const marketplace = await DSCMMarketplace.deploy();

  // Wait for deployment to finish
  await marketplace.waitForDeployment();

  const contractAddress = await marketplace.getAddress();
  console.log("DSCMMarketplace deployed to:", contractAddress);

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    contractAddress: contractAddress,
    deploymentTime: new Date().toISOString(),
    network: "localhost"
  };

  fs.writeFileSync(
    './deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployment-info.json");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
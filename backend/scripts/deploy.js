const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying DSCMMarketplace contract...");

  // Get the contract factory
// Get a signer to use as the fee recipient
  const [deployer] = await ethers.getSigners();
  const feeRecipient = deployer.address;
  console.log(`Deployer and fee recipient address: ${feeRecipient}`);


  // Deploy the contract
  const marketplace = await ethers.deployContract("DSCMMarketplace", [
    feeRecipient,
  ]);


  // Wait for deployment to finish
  await marketplace.waitForDeployment();

  const contractAddress = await marketplace.getAddress();
  console.log("DSCMMarketplace deployed to:", contractAddress);

  const contractArtifact = await hre.artifacts.readArtifact("DSCMMarketplace");
  const deploymentInfo = {
    contractAddress: contractAddress,
    abi: contractArtifact.abi,
  };

  // 3. Define the correct path to the frontend's 'lib' directory
  const frontendLibPath = path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "src",
    "lib"
  );

  // 4. Ensure the directory exists
  if (!fs.existsSync(frontendLibPath)) {
    fs.mkdirSync(frontendLibPath, { recursive: true });
  }

  // 5. Write the deployment info file directly into the frontend directory
  fs.writeFileSync(
    path.join(frontendLibPath, "deployment-info.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // --- End: New and Improved Section ---

  console.log("✅ Deployment info saved to frontend/src/lib/deployment-info.json");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
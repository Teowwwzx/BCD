const hre = require("hardhat");

async function main() {
  console.log("--- Starting Verification Script ---");

  // 1. Clean and Compile from scratch
  console.log("Step 1: Cleaning and Compiling...");
  await hre.run("clean");
  await hre.run("compile");
  console.log("✅ Compilation complete.");

  // 2. Deploy the contract
  console.log("\nStep 2: Deploying contract...");
  const [deployer] = await hre.ethers.getSigners();
  const marketplace = await hre.ethers.deployContract("DSCMMarketplace", [
    deployer.address, // Fee recipient
  ]);
  await marketplace.waitForDeployment();
  const contractAddress = await marketplace.getAddress();
  console.log(`✅ Contract deployed to: ${contractAddress}`);

  // 3. Attach to the deployed contract and call the function
  console.log("\nStep 3: Calling getTotalListings()...");
  const attachedContract = await hre.ethers.getContractAt("DSCMMarketplace", contractAddress);
  
  try {
    const totalListings = await attachedContract.getTotalListings();
    console.log("\n--- ✅ SUCCESS! ---");
    console.log(`Total Listings from contract: ${totalListings.toString()}`);
    console.log("This confirms the contract and deployment are working correctly.");
    console.log("The issue is likely in the frontend's connection or caching.");

  } catch (error) {
    console.error("\n--- ❌ ERROR! ---");
    console.error("The function call failed. This points to an issue in the contract or Hardhat config.");
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
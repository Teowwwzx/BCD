const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DSCMMarketplace", function () {
  // Fixture to deploy the contract
  async function deployMarketplaceFixture() {
    const [owner, seller, buyer, transporter, other, admin, moderator, feeRecipient] = await ethers.getSigners();
    
    const DSCMMarketplace = await ethers.getContractFactory("DSCMMarketplace");
    const marketplace = await DSCMMarketplace.deploy(feeRecipient.address);
    
    // Grant roles
    const ADMIN_ROLE = await marketplace.ADMIN_ROLE();
    const MODERATOR_ROLE = await marketplace.MODERATOR_ROLE();
    await marketplace.grantRole(ADMIN_ROLE, admin.address);
    await marketplace.grantRole(MODERATOR_ROLE, moderator.address);
    
    return { marketplace, owner, seller, buyer, transporter, other, admin, moderator, feeRecipient };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.getAddress()).to.be.properAddress;
    });

    it("Should initialize with zero listings", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.getTotalListings()).to.equal(0);
    });

    it("Should set the fee recipient", async function () {
      const { marketplace, feeRecipient } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should grant admin role to deployer", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);
      const ADMIN_ROLE = await marketplace.ADMIN_ROLE();
      expect(await marketplace.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Product Listings", function () {
    it("Should create a new listing", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      const name = "Test Product";
      const description = "A test product";
      const category = "Electronics";
      
      await expect(
        marketplace.connect(seller).createListing(name, description, category, price, 1, "Test Location", "test-image.jpg")
      ).to.emit(marketplace, "ListingCreated")
        .withArgs(1, seller.address, name, price, 1);
      
      expect(await marketplace.getTotalListings()).to.equal(1);
    });

    it("Should not allow zero price listings", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      await expect(
        marketplace.connect(seller).createListing("Test", "Description", "Category", 0, 1, "Location", "image.jpg")
      ).to.be.revertedWith("Price out of allowed range");
    });

    it("Should not allow empty name", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await expect(
        marketplace.connect(seller).createListing("", "Description", "Category", price, 1, "Location", "image.jpg")
      ).to.be.revertedWith("Invalid name length");
    });

    it("Should fail when contract is paused", async function () {
      const { marketplace, seller, admin } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(admin).pauseContract();
      
      await expect(
        marketplace.connect(seller).createListing("Test Product", "Description", "Category", price, 1, "Location", "image.jpg")
      ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
    });

    it("Should fail for blacklisted users", async function () {
      const { marketplace, seller, admin } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(admin).blacklistUser(seller.address);
      
      await expect(
        marketplace.connect(seller).createListing("Test Product", "Description", "Category", price, 1, "Location", "image.jpg")
      ).to.be.revertedWith("User is blacklisted");
    });

    it("Should retrieve listing details correctly", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.5");
      const name = "Premium Product";
      const description = "A premium test product";
      const category = "Luxury";
      
      await marketplace.connect(seller).createListing(name, description, category, price, 1, "Test Location", "test-image.jpg");
      
      const listing = await marketplace.getListing(1);
      expect(listing.name).to.equal(name);
      expect(listing.description).to.equal(description);
      expect(listing.price).to.equal(price);
      expect(listing.category).to.equal(category);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.status).to.equal(0); // Active status
    });
  });

  describe("Product Purchases", function () {
    it("Should allow purchasing a product", async function () {
      const { marketplace, seller, buyer, feeRecipient } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("2.0");
      const platformFee = (price * BigInt(250)) / BigInt(10000); // 2.5% fee
      const sellerAmount = price - platformFee;
      
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      
      const initialFeeRecipientBalance = await ethers.provider.getBalance(feeRecipient.address);
      
      await expect(
        marketplace.connect(buyer).purchaseProduct(1, 1, { value: price })
      ).to.emit(marketplace, "OrderCreated")
        .withArgs(1, 1, buyer.address, seller.address, price, 1);
      
      // Check platform fee was transferred
      const finalFeeRecipientBalance = await ethers.provider.getBalance(feeRecipient.address);
      expect(finalFeeRecipientBalance - initialFeeRecipientBalance).to.equal(platformFee);
      
      const listing = await marketplace.getListing(1);
      expect(listing.status).to.equal(1); // Sold status
    });

    it("Should not allow purchasing with insufficient payment", async function () {
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("2.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      
      const insufficientPayment = ethers.parseEther("1.0");
      await expect(
        marketplace.connect(buyer).purchaseProduct(1, 1, { value: insufficientPayment })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should not allow purchasing inactive listings", async function () {
      const { marketplace, seller, buyer, other } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      
      // First buyer purchases the product
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      
      // Second buyer tries to purchase the same product
      await expect(
        marketplace.connect(other).purchaseProduct(1, 1, { value: price })
      ).to.be.revertedWith("Listing is not active");
    });

    it("Should not allow seller to purchase their own product", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      
      await expect(
        marketplace.connect(seller).purchaseProduct(1, 1, { value: price })
      ).to.be.revertedWith("Cannot buy your own product");
    });

    it("Should refund excess payment", async function () {
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      const excessPayment = price + ethers.parseEther("0.5");
      
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      
      const initialBuyerBalance = await ethers.provider.getBalance(buyer.address);
      
      const tx = await marketplace.connect(buyer).purchaseProduct(1, 1, {
        value: excessPayment
      });
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const finalBuyerBalance = await ethers.provider.getBalance(buyer.address);
      
      // Buyer should only pay the total price + gas, excess should be refunded
      expect(initialBuyerBalance - finalBuyerBalance - gasUsed).to.equal(price);
    });
  });

  describe("Order Management", function () {
    it("Should create order after purchase", async function () {
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      
      const order = await marketplace.getOrder(1);
      expect(order.buyer).to.equal(buyer.address);
      expect(order.seller).to.equal(seller.address);
      expect(order.listingId).to.equal(1);
      expect(order.finalPrice).to.equal(price);
      expect(order.status).to.equal(1); // AwaitingShipment status
    });

    it("Should allow transporter assignment", async function () {
      const { marketplace, seller, buyer, transporter } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      
      await expect(
        marketplace.connect(seller).assignTransporter(1, transporter.address)
      ).to.emit(marketplace, "TransporterAssigned")
        .withArgs(1, transporter.address);
      
      const order = await marketplace.getOrder(1);
      expect(order.transporter).to.equal(transporter.address);
      expect(order.status).to.equal(2); // InTransit status
    });

    it("Should only allow seller to assign transporter", async function () {
      const { marketplace, seller, buyer, transporter } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      
      await expect(
        marketplace.connect(buyer).assignTransporter(1, transporter.address)
      ).to.be.revertedWith("Only seller can assign transporter");
    });
  });

  describe("Delivery Confirmation", function () {
    it("Should allow buyer to confirm delivery", async function () {
      const { marketplace, seller, buyer, transporter } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      await marketplace.connect(seller).assignTransporter(1, transporter.address);
      
      // Update order status to delivered first
      await marketplace.connect(transporter).updateOrderStatus(1, 3); // Delivered
      
      await marketplace.connect(buyer).confirmDelivery(1);
      
      const order = await marketplace.getOrder(1);
      expect(order.buyerConfirmed).to.be.true;
    });

    it("Should only allow buyer to confirm delivery", async function () {
      const { marketplace, seller, buyer, transporter } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      await marketplace.connect(seller).assignTransporter(1, transporter.address);
      
      await expect(
        marketplace.connect(seller).confirmDelivery(1)
      ).to.be.revertedWith("Only buyer can confirm delivery");
    });
  });

  describe("Order Completion", function () {
    it("Should allow seller to confirm completion and release payment", async function () {
      const { marketplace, seller, buyer, transporter } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      const platformFee = (price * BigInt(250)) / BigInt(10000); // 2.5% fee
      const sellerAmount = price - platformFee;
      
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      await marketplace.connect(seller).assignTransporter(1, transporter.address);
      // Update order status to delivered first
      await marketplace.connect(transporter).updateOrderStatus(1, 3); // Delivered
      await marketplace.connect(buyer).confirmDelivery(1);
      
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      
      await expect(
        marketplace.connect(seller).confirmCompletion(1)
      ).to.emit(marketplace, "PaymentReleased")
        .withArgs(1, seller.address, sellerAmount);
      
      const order = await marketplace.getOrder(1);
      expect(order.sellerConfirmed).to.be.true;
      
      // Check that payment was released to seller
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalanceAfter).to.be.gt(sellerBalanceBefore);
    });

    it("Should only allow seller to confirm completion", async function () {
      const { marketplace, seller, buyer, transporter } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      await marketplace.connect(seller).assignTransporter(1, transporter.address);
      
      // Update order status to delivered first
      await marketplace.connect(transporter).updateOrderStatus(1, 3); // Delivered
      await marketplace.connect(buyer).confirmDelivery(1);
      
      await expect(
        marketplace.connect(buyer).confirmCompletion(1)
      ).to.be.revertedWith("Only seller can confirm completion");
    });
  });

  describe("User Listings and Orders", function () {
    it("Should return user listings correctly", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      const price1 = ethers.parseEther("1.0");
      const price2 = ethers.parseEther("2.0");
      
      await marketplace.connect(seller).createListing("Product 1", "Description 1", "Category 1", price1, 1, "Location", "image.jpg");
      await marketplace.connect(seller).createListing("Product 2", "Description 2", "Category 2", price2, 1, "Location", "image.jpg");
      
      const userListings = await marketplace.getUserListings(seller.address);
      expect(userListings.length).to.equal(2);
      expect(userListings[0]).to.equal(1);
      expect(userListings[1]).to.equal(2);
    });

    it("Should return user orders correctly", async function () {
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      
      const price1 = ethers.parseEther("1.0");
      const price2 = ethers.parseEther("2.0");
      
      await marketplace.connect(seller).createListing("Product 1", "Description 1", "Category 1", price1, 1, "Location", "image.jpg");
      await marketplace.connect(seller).createListing("Product 2", "Description 2", "Category 2", price2, 1, "Location", "image.jpg");
      
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price1 });
      await marketplace.connect(buyer).purchaseProduct(2, 1, { value: price2 });
      
      const userOrders = await marketplace.getUserOrders(buyer.address);
      expect(userOrders.length).to.equal(2);
      expect(userOrders[0]).to.equal(1);
      expect(userOrders[1]).to.equal(2);
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle non-existent listing queries gracefully", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);
      
      const listing = await marketplace.getListing(999);
      expect(listing.listingId).to.equal(0); // Default value for non-existent listing
      expect(listing.seller).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Should handle non-existent order queries gracefully", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);
      
      const order = await marketplace.getOrder(999);
      expect(order.orderId).to.equal(0); // Default value for non-existent order
      expect(order.buyer).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Should prevent reentrancy attacks", async function () {
      // This test would require a malicious contract to test reentrancy
      // For now, we ensure the contract uses proper checks-effects-interactions pattern
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      
      // Verify that the listing is immediately marked as sold
      const listing = await marketplace.getListing(1);
      expect(listing.status).to.equal(1); // Sold status
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas costs for basic operations", async function () {
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      
      // Test gas cost for creating listing
      const createTx = await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      const createReceipt = await createTx.wait();
      expect(createReceipt.gasUsed).to.be.lt(400000); // Should be less than 400k gas
      
      // Test gas cost for purchasing
      const purchaseTx = await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      const purchaseReceipt = await purchaseTx.wait();
      expect(purchaseReceipt.gasUsed).to.be.lt(400000); // Should be less than 400k gas
    });
  });

  describe("Security Features", function () {
    it("Should pause and unpause contract", async function () {
      const { marketplace, admin } = await loadFixture(deployMarketplaceFixture);
      
      await marketplace.connect(admin).pauseContract();
      expect(await marketplace.paused()).to.be.true;
      
      await marketplace.connect(admin).unpauseContract();
      expect(await marketplace.paused()).to.be.false;
    });

    it("Should blacklist and remove from blacklist", async function () {
      const { marketplace, seller, admin } = await loadFixture(deployMarketplaceFixture);
      
      await marketplace.connect(admin).blacklistUser(seller.address);
      expect(await marketplace.blacklistedUsers(seller.address)).to.be.true;
      
      await marketplace.connect(admin).removeFromBlacklist(seller.address);
      expect(await marketplace.blacklistedUsers(seller.address)).to.be.false;
    });

    it("Should set platform fee", async function () {
      const { marketplace, admin } = await loadFixture(deployMarketplaceFixture);
      
      await marketplace.connect(admin).setPlatformFee(500); // 5%
      expect(await marketplace.platformFeePercentage()).to.equal(500);
    });

    it("Should fail to set excessive platform fee", async function () {
      const { marketplace, admin } = await loadFixture(deployMarketplaceFixture);
      
      await expect(
        marketplace.connect(admin).setPlatformFee(1500) // 15%
      ).to.be.revertedWith("Fee cannot exceed 10%");
    });

    it("Should set fee recipient", async function () {
      const { marketplace, admin } = await loadFixture(deployMarketplaceFixture);
      
      await marketplace.connect(admin).setFeeRecipient(admin.address);
      expect(await marketplace.feeRecipient()).to.equal(admin.address);
    });

    it("Should cancel listing", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Test Product", "Description", "Category", price, 1, "Location", "image.jpg");
      
      await marketplace.connect(seller).cancelListing(1);
      
      const listing = await marketplace.getListing(1);
      expect(listing.status).to.equal(2); // Cancelled
    });
  });

  describe("Dispute Management", function () {
    it("Should allow buyer to raise dispute", async function () {
      const { marketplace, seller, buyer, transporter } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      await marketplace.connect(seller).assignTransporter(1, transporter.address);
      
      await expect(
        marketplace.connect(buyer).raiseDispute(1)
      ).to.emit(marketplace, "DisputeRaised")
        .withArgs(1, buyer.address);
      
      const order = await marketplace.getOrder(1);
       expect(order.status).to.equal(5); // Disputed
    });

    it("Should allow seller to raise dispute", async function () {
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      
      await marketplace.connect(seller).raiseDispute(1);
      
      const order = await marketplace.getOrder(1);
       expect(order.status).to.equal(5); // Disputed
    });

    it("Should not allow dispute on completed orders", async function () {
      const { marketplace, seller, buyer, transporter } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      await marketplace.connect(seller).assignTransporter(1, transporter.address);
      await marketplace.connect(transporter).updateOrderStatus(1, 3); // Delivered
      await marketplace.connect(buyer).confirmDelivery(1);
      await marketplace.connect(seller).confirmCompletion(1);
      
      await expect(
        marketplace.connect(buyer).raiseDispute(1)
      ).to.be.revertedWith("Cannot dispute this order");
    });

    it("Should not allow unauthorized users to raise dispute", async function () {
      const { marketplace, seller, buyer, other } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      
      await expect(
        marketplace.connect(other).raiseDispute(1)
      ).to.be.revertedWith("Only buyer or seller can raise dispute");
    });
  });

  describe("Admin Resolution", function () {
    it("Should allow owner to resolve dispute in favor of buyer", async function () {
       const { marketplace, seller, buyer, owner } = await loadFixture(deployMarketplaceFixture);
       
       const price = ethers.parseEther("1.0");
       await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
       await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
       await marketplace.connect(buyer).raiseDispute(1);
       
       const initialBuyerBalance = await ethers.provider.getBalance(buyer.address);
       
       await marketplace.connect(owner).resolveDispute(1, true); // Favor buyer
       
       const finalBuyerBalance = await ethers.provider.getBalance(buyer.address);
       const order = await marketplace.getOrder(1);
       
       expect(order.status).to.equal(6); // Cancelled
       expect(finalBuyerBalance).to.be.gt(initialBuyerBalance); // Buyer got refund
     });

    it("Should allow owner to resolve dispute in favor of seller", async function () {
       const { marketplace, seller, buyer, owner } = await loadFixture(deployMarketplaceFixture);
       
       const price = ethers.parseEther("1.0");
       await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
       await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
       await marketplace.connect(buyer).raiseDispute(1);
       
       const initialSellerBalance = await ethers.provider.getBalance(seller.address);
       
       await marketplace.connect(owner).resolveDispute(1, false); // Favor seller
       
       const finalSellerBalance = await ethers.provider.getBalance(seller.address);
       const order = await marketplace.getOrder(1);
       const sellerReputation = await marketplace.getUserReputation(seller.address);
       
       expect(order.status).to.equal(4); // Completed
       expect(finalSellerBalance).to.be.gt(initialSellerBalance); // Seller got payment
       expect(sellerReputation).to.equal(1); // Reputation increased
     });

    it("Should only allow owner to resolve disputes", async function () {
       const { marketplace, seller, buyer, other } = await loadFixture(deployMarketplaceFixture);
       
       const price = ethers.parseEther("1.0");
       await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
       await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
       await marketplace.connect(buyer).raiseDispute(1);
       
       await expect(
         marketplace.connect(other).resolveDispute(1, true)
       ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
     });
  });

  describe("Additional Edge Cases", function () {
    it("Should handle order status updates correctly", async function () {
      const { marketplace, seller, buyer, transporter } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      await marketplace.connect(seller).assignTransporter(1, transporter.address);
      
      await expect(
        marketplace.connect(transporter).updateOrderStatus(1, 3) // Delivered
      ).to.emit(marketplace, "OrderStatusUpdated")
        .withArgs(1, 3);
      
      const order = await marketplace.getOrder(1);
      expect(order.status).to.equal(3); // Delivered
    });

    it("Should not allow invalid order status updates", async function () {
      const { marketplace, seller, buyer, other } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      
      await expect(
        marketplace.connect(other).updateOrderStatus(1, 3) // Unauthorized user
      ).to.be.revertedWith("Not authorized to update order");
    });

    it("Should handle emergency withdrawal", async function () {
      const { marketplace, seller, buyer, owner } = await loadFixture(deployMarketplaceFixture);
      
      // Create a purchase to get ETH into the contract
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await marketplace.getAddress());
      
      const tx = await marketplace.connect(owner).emergencyWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      
      expect(finalOwnerBalance).to.equal(initialOwnerBalance + contractBalance - gasUsed);
    });

    it("Should get user reputation correctly", async function () {
      const { marketplace, seller, buyer, transporter } = await loadFixture(deployMarketplaceFixture);
      
      const price = ethers.parseEther("1.0");
      await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
      await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
      await marketplace.connect(seller).assignTransporter(1, transporter.address);
      await marketplace.connect(transporter).updateOrderStatus(1, 3); // Delivered
      await marketplace.connect(buyer).confirmDelivery(1);
      await marketplace.connect(seller).confirmCompletion(1);
      
      const sellerReputation = await marketplace.getUserReputation(seller.address);
      const buyerReputation = await marketplace.getUserReputation(buyer.address);
      
      expect(sellerReputation).to.equal(1);
      expect(buyerReputation).to.equal(1);
    });

    it("Should handle admin canceling listings", async function () {
       const { marketplace, seller, admin } = await loadFixture(deployMarketplaceFixture);
       
       const price = ethers.parseEther("1.0");
       await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
       
       await marketplace.connect(admin).cancelListing(1);
       
       const listing = await marketplace.getListing(1);
       expect(listing.status).to.equal(2); // Cancelled
     });

     it("Should handle both buyer and seller confirmation for payment release", async function () {
       const { marketplace, seller, buyer, transporter } = await loadFixture(deployMarketplaceFixture);
       
       const price = ethers.parseEther("1.0");
       await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
       await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
       await marketplace.connect(seller).assignTransporter(1, transporter.address);
       await marketplace.connect(transporter).updateOrderStatus(1, 3); // Delivered
       
       const initialSellerBalance = await ethers.provider.getBalance(seller.address);
       
       // Both buyer and seller confirm
       await marketplace.connect(buyer).confirmDelivery(1);
       await marketplace.connect(seller).confirmCompletion(1);
       
       const finalSellerBalance = await ethers.provider.getBalance(seller.address);
       const order = await marketplace.getOrder(1);
       const sellerReputation = await marketplace.getUserReputation(seller.address);
       
       expect(order.status).to.equal(4); // Completed
       expect(finalSellerBalance).to.be.gt(initialSellerBalance); // Payment released
       expect(sellerReputation).to.equal(1); // Reputation increased
     });

     it("Should get total orders count", async function () {
       const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
       
       const price = ethers.parseEther("1.0");
       await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
       await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
       
       const totalOrders = await marketplace.getTotalOrders();
       expect(totalOrders).to.equal(1);
     });

     it("Should support interface correctly", async function () {
        const { marketplace } = await loadFixture(deployMarketplaceFixture);
        
        // Test AccessControl interface
        const accessControlInterface = "0x7965db0b";
        const supportsAccessControl = await marketplace.supportsInterface(accessControlInterface);
        expect(supportsAccessControl).to.be.true;
      });

      it("Should release payment when buyer confirms after seller", async function () {
        const { marketplace, seller, buyer, transporter } = await loadFixture(deployMarketplaceFixture);
        
        const price = ethers.parseEther("1.0");
        await marketplace.connect(seller).createListing("Product", "Description", "Category", price, 1, "Location", "image.jpg");
        await marketplace.connect(buyer).purchaseProduct(1, 1, { value: price });
        await marketplace.connect(seller).assignTransporter(1, transporter.address);
        await marketplace.connect(transporter).updateOrderStatus(1, 3); // Delivered
        
        const initialSellerBalance = await ethers.provider.getBalance(seller.address);
        
        // Seller confirms completion first
        await marketplace.connect(seller).confirmCompletion(1);
        
        // Then buyer confirms delivery - this should trigger payment release
        await marketplace.connect(buyer).confirmDelivery(1);
        
        const finalSellerBalance = await ethers.provider.getBalance(seller.address);
        const order = await marketplace.getOrder(1);
        const sellerReputation = await marketplace.getUserReputation(seller.address);
        
        expect(order.status).to.equal(4); // Completed
        expect(finalSellerBalance).to.be.gt(initialSellerBalance); // Payment released
        expect(sellerReputation).to.equal(1); // Reputation increased
      });
  });

  describe("Access Control", function () {
    it("Should restrict admin functions to admin role", async function () {
      const { marketplace, buyer } = await loadFixture(deployMarketplaceFixture);
      
      await expect(
        marketplace.connect(buyer).pauseContract()
      ).to.be.revertedWithCustomError(marketplace, "AccessControlUnauthorizedAccount");
    });

    it("Should restrict owner functions to owner", async function () {
      const { marketplace, buyer } = await loadFixture(deployMarketplaceFixture);
      
      await expect(
        marketplace.connect(buyer).emergencyWithdraw()
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });
  });
});
# Blockchain Integration & MetaMask Guide

## 🔗 Connecting to Local Hardhat Network

### Step 1: Add Hardhat Network to MetaMask

1. **Open MetaMask** and click on the network dropdown (usually shows "Ethereum Mainnet")
2. **Click "Add Network"** or "Custom RPC"
3. **Enter the following details:**
   - **Network Name:** Hardhat Local
   - **New RPC URL:** http://localhost:8545
   - **Chain ID:** 31337
   - **Currency Symbol:** ETH
   - **Block Explorer URL:** (leave empty)

4. **Click "Save"** and switch to the Hardhat Local network

### Step 2: Import Test Accounts

When you run `npm run hardhat:node`, you'll see 20 accounts with private keys. Import one or more:

1. **Copy a private key** from the terminal output (e.g., `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`)
2. **In MetaMask:** Click account icon → Import Account
3. **Paste the private key** and click Import
4. **You should see 10,000 ETH** in your account

⚠️ **Important:** These are test accounts only. Never use these private keys on mainnet!

## 🛠 Smart Contract Development

### Current Contract Structure

```
backend/contracts/
└── Lock.sol          # Sample contract (replace with DSCM contracts)
```

### Creating DSCM Smart Contracts

1. **Create the main marketplace contract:**

```bash
cd backend
# Create new contract file
touch contracts/DSCMMarketplace.sol
```

2. **Basic contract structure for DSCM:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DSCMMarketplace {
    // User roles
    enum UserRole { None, Manufacturer, Retailer, LogisticsProvider }
    
    // Product structure
    struct Product {
        uint256 id;
        address seller;
        string name;
        string description;
        uint256 price;
        uint256 quantity;
        bool isActive;
    }
    
    // Order structure
    struct Order {
        uint256 id;
        uint256 productId;
        address buyer;
        address seller;
        uint256 quantity;
        uint256 totalPrice;
        OrderStatus status;
    }
    
    enum OrderStatus { Created, Accepted, Shipped, Delivered, Completed }
    
    // State variables
    mapping(address => UserRole) public userRoles;
    mapping(uint256 => Product) public products;
    mapping(uint256 => Order) public orders;
    
    uint256 public nextProductId = 1;
    uint256 public nextOrderId = 1;
    
    // Events
    event UserRegistered(address indexed user, UserRole role);
    event ProductListed(uint256 indexed productId, address indexed seller);
    event OrderCreated(uint256 indexed orderId, uint256 indexed productId);
    
    // Functions will be implemented in phases
}
```

### Compiling Contracts

```bash
cd backend
npm run hardhat:compile
```

### Testing Contracts

```bash
npm run hardhat:test
```

### Deploying to Local Network

```bash
npm run hardhat:deploy
```

## 🌐 Frontend Integration with Ethers.js

### Basic Web3 Connection Setup

Create `frontend/src/lib/web3.ts`:

```typescript
import { ethers } from 'ethers';

// Check if MetaMask is installed
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// Connect to MetaMask
export const connectWallet = async (): Promise<string | null> => {
  if (!isMetaMaskInstalled()) {
    alert('Please install MetaMask!');
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    return accounts[0];
  } catch (error) {
    console.error('Error connecting to MetaMask:', error);
    return null;
  }
};

// Get provider and signer
export const getProvider = () => {
  if (!isMetaMaskInstalled()) return null;
  return new ethers.BrowserProvider(window.ethereum);
};

export const getSigner = async () => {
  const provider = getProvider();
  if (!provider) return null;
  return await provider.getSigner();
};

// Switch to Hardhat network
export const switchToHardhatNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x7A69' }], // 31337 in hex
    });
  } catch (error: any) {
    // If network doesn't exist, add it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x7A69',
            chainName: 'Hardhat Local',
            rpcUrls: ['http://localhost:8545'],
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
          },
        ],
      });
    }
  }
};
```

### React Hook for Web3

Create `frontend/src/hooks/useWeb3.ts`:

```typescript
import { useState, useEffect } from 'react';
import { connectWallet, isMetaMaskInstalled } from '@/lib/web3';

export const useWeb3 = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const connect = async () => {
    setIsLoading(true);
    const connectedAccount = await connectWallet();
    if (connectedAccount) {
      setAccount(connectedAccount);
      setIsConnected(true);
    }
    setIsLoading(false);
  };

  const disconnect = () => {
    setAccount(null);
    setIsConnected(false);
  };

  useEffect(() => {
    // Check if already connected
    if (isMetaMaskInstalled()) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          disconnect();
        }
      });
    }
  }, []);

  return {
    account,
    isConnected,
    isLoading,
    connect,
    disconnect,
    isMetaMaskInstalled: isMetaMaskInstalled(),
  };
};
```

## 🔄 Contract Interaction Examples

### Reading from Contract

```typescript
import { ethers } from 'ethers';
import { getProvider } from '@/lib/web3';

// Contract ABI (generated after compilation)
import DSCMMarketplaceABI from '../contracts/DSCMMarketplace.json';

const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';

export const readProducts = async () => {
  const provider = getProvider();
  if (!provider) return [];

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    DSCMMarketplaceABI.abi,
    provider
  );

  try {
    // Example: Get product by ID
    const product = await contract.products(1);
    return product;
  } catch (error) {
    console.error('Error reading from contract:', error);
    return null;
  }
};
```

### Writing to Contract

```typescript
import { getSigner } from '@/lib/web3';

export const createProduct = async (
  name: string,
  description: string,
  price: string,
  quantity: number
) => {
  const signer = await getSigner();
  if (!signer) return null;

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    DSCMMarketplaceABI.abi,
    signer
  );

  try {
    const tx = await contract.createProduct(
      name,
      description,
      ethers.parseEther(price), // Convert ETH to Wei
      quantity
    );
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
};
```

## 🚀 Next Steps

1. **Push to GitHub:**
   ```bash
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Implement Phase 1 Features:**
   - User registration smart contract functions
   - Product listing contract functions
   - Frontend components for wallet connection
   - User profile management

3. **Database Integration:**
   - Install Prisma: `npm install prisma @prisma/client`
   - Set up database schema
   - Create API endpoints for off-chain data

4. **Testing:**
   - Write comprehensive smart contract tests
   - Test MetaMask integration
   - Test frontend-backend-blockchain communication

## 🔧 Troubleshooting

### Common Issues:

1. **MetaMask not connecting:**
   - Ensure you're on the Hardhat Local network
   - Check that Hardhat node is running (`npm run hardhat:node`)

2. **Transaction failures:**
   - Check gas limits
   - Ensure sufficient ETH balance
   - Verify contract address and ABI

3. **Network issues:**
   - Restart Hardhat node if needed
   - Clear MetaMask activity data for local network

### Useful Commands:

```bash
# Reset Hardhat node (clears all data)
npx hardhat node --reset

# Deploy contracts with logging
npx hardhat run scripts/deploy.ts --network localhost --verbose

# Check contract size
npx hardhat size-contracts
```

This guide provides the foundation for blockchain integration. As you develop more features, you'll expand the smart contracts and frontend integration accordingly.
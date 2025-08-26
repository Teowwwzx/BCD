import { ethers, Contract } from 'ethers';

// 1. Import from the new, automatically generated file
import deploymentInfo from './deployment-info.json';

// 2. Get the Address and ABI directly from the imported file
const contractAddress = deploymentInfo.contractAddress;
const contractABI = deploymentInfo.abi;

// This variable will hold singleton instances of our contract connections
let contractInstance: Contract | null = null;
let contractInstanceWithSigner: Contract | null = null;

/**
 * Creates and returns a read-only contract instance connected to the user's wallet provider.
 * Uses a singleton pattern to avoid re-creating it on every call.
 */
export const getMarketplaceContract = (): Contract => {
  if (contractInstance) {
    return contractInstance;
  }
  
  if (typeof window === 'undefined' || !window.ethereum) {
    console.warn("No wallet detected. Using read-only fallback provider for local node.");
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    contractInstance = new ethers.Contract(contractAddress, contractABI, provider);
    return contractInstance;
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  contractInstance = new ethers.Contract(contractAddress, contractABI, provider);
  return contractInstance;
};

/**
 * Creates and returns a contract instance with a signer for writing transactions.
 * Requires the user to be connected with a wallet like MetaMask.
 */
export const getMarketplaceContractWithSigner = async (): Promise<Contract> => {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error("No wallet detected. Please install MetaMask to perform this action.");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    contractInstanceWithSigner = new ethers.Contract(contractAddress, contractABI, signer);
    return contractInstanceWithSigner;
};


/**
 * Helper function to connect to MetaMask, request account access,
 * and attempt to switch to the local Hardhat network.
 */
export const connectWallet = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found. Please install the browser extension.');
  }
  
  try {
    // Force MetaMask to show account selection by requesting permissions first
    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
    } catch (permError: unknown) {
      // If wallet_requestPermissions is not supported, fall back to eth_requestAccounts
      console.log('wallet_requestPermissions not supported, using eth_requestAccounts', permError);
    }
    
    // Request account access - this will trigger MetaMask popup for account selection
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    // Attempt to switch to the Hardhat network (Chain ID 31337)
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7A69' }], // 31337 in hex
      });
    } catch (switchError: any) {
      // If the network doesn't exist in MetaMask, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x7A69',
            chainName: 'Hardhat Local',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['http://127.0.0.1:8545'],
          }]
        });
      } else {
        throw switchError;
      }
    }
    
    return { address, signer };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};


/**
 * Gets the ETH balance for a given wallet address with circuit breaker error handling
 */
export const getWalletBalance = async (address: string, retryCount = 0): Promise<string> => {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second
  
  if (typeof window === 'undefined' || !window.ethereum) {
    // Fallback to local provider for server-side or no wallet scenarios
    try {
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error: any) {
      console.warn('Local provider failed, returning 0 balance:', error.message);
      return '0.0';
    }
  }
  
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error: any) {
    // Handle MetaMask circuit breaker errors
    if (error.message?.includes('circuit breaker is open') || 
        error.message?.includes('Execution prevented') ||
        error.code === 'UNKNOWN_ERROR') {
      
      if (retryCount < maxRetries) {
        console.warn(`MetaMask circuit breaker detected, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return getWalletBalance(address, retryCount + 1);
      } else {
        console.error('MetaMask circuit breaker: Max retries exceeded, returning cached or default balance');
        // Try to get cached balance from localStorage or return 0
        const cachedBalance = localStorage.getItem(`wallet_balance_${address}`);
        return cachedBalance || '0.0';
      }
    }
    
    // Handle other errors
    console.error('Error getting wallet balance:', error);
    throw new Error(`Failed to get wallet balance: ${error.message}`);
  }
};

// =================================================================
// HELPER FUNCTIONS
// =================================================================
export const formatEther = (value: bigint): string => ethers.formatEther(value);
export const parseEther = (value: string): bigint => ethers.parseEther(value);


// =================================================================
// CONTRACT INTERACTION FUNCTIONS (READ-ONLY)
// =================================================================
export const getTotalListings = async () => {
  const contract = getMarketplaceContract();
  return await contract.getTotalListings();
};

export const getListing = async (listingId: number) => {
  const contract = getMarketplaceContract();
  return await contract.getListing(listingId);
};

export const getUserListings = async (userAddress: string) => {
  const contract = getMarketplaceContract();
  return await contract.getUserListings(userAddress);
};

export const getUserOrders = async (userAddress: string) => {
  const contract = getMarketplaceContract();
  return await contract.getUserOrders(userAddress);
};

export const getOrder = async (orderId: number) => {
  const contract = getMarketplaceContract();
  return await contract.getOrder(orderId);
};


// =================================================================
// CONTRACT INTERACTION FUNCTIONS (REQUIRE SIGNER / TRANSACTION)
// =================================================================
export const createListing = async (name: string, description: string, category: string, price: string, quantity: number, location: string, imageUrl: string) => {
  const contract = await getMarketplaceContractWithSigner();
  const priceInWei = parseEther(price);
  const tx = await contract.createListing(name, description, category, priceInWei, quantity, location, imageUrl);
  return await tx.wait();
};

export const purchaseProduct = async (listingId: number, quantity: number, options: { value: bigint }) => {
  const contract = await getMarketplaceContractWithSigner();
  const tx = await contract.purchaseProduct(listingId, quantity, options);
  return await tx.wait();
};

export const confirmDelivery = async (orderId: number) => {
  const contract = await getMarketplaceContractWithSigner();
  const tx = await contract.confirmDelivery(orderId);
  return await tx.wait();
};

export const confirmCompletion = async (orderId: number) => {
  const contract = await getMarketplaceContractWithSigner();
  const tx = await contract.confirmCompletion(orderId);
  return await tx.wait();
};
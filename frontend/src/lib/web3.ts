import { ethers } from 'ethers';

// Contract ABI - This would normally be imported from compiled contract artifacts
const DSCM_MARKETPLACE_ABI = [
  "function createListing(string memory _name, string memory _description, string memory _category, uint256 _price, uint256 _quantity, string memory _location, string memory _imageUrl) external",
  "function purchaseProduct(uint256 _listingId, uint256 _quantity) external payable",
  "function getListing(uint256 _listingId) external view returns (tuple(uint256 listingId, address seller, string name, string description, string category, uint256 price, uint256 quantity, string location, string imageUrl, uint8 status, uint256 createdAt))",
  "function getUserListings(address _user) external view returns (uint256[])",
  "function getUserOrders(address _user) external view returns (uint256[])",
  "function getTotalListings() external view returns (uint256)",
  "function assignTransporter(uint256 _orderId, address _transporter) external",
  "function updateOrderStatus(uint256 _orderId, uint8 _newStatus) external",
  "function confirmDelivery(uint256 _orderId) external",
  "function confirmCompletion(uint256 _orderId) external",
  "function getOrder(uint256 _orderId) external view returns (tuple(uint256 orderId, uint256 listingId, address buyer, address seller, address transporter, uint256 finalPrice, uint256 quantityPurchased, uint8 status, uint256 createdAt, uint256 escrowAmount, bool buyerConfirmed, bool sellerConfirmed))",
  "event ListingCreated(uint256 indexed listingId, address indexed seller, string name, uint256 price, uint256 quantity)",
  "event OrderCreated(uint256 indexed orderId, uint256 indexed listingId, address indexed buyer, address seller, uint256 finalPrice, uint256 quantity)",
  "event OrderStatusUpdated(uint256 indexed orderId, uint8 newStatus)"
];

// Contract address from deployment
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Local Hardhat network configuration
const HARDHAT_NETWORK = {
  chainId: 31337,
  name: 'Hardhat Local',
  rpcUrl: 'http://127.0.0.1:8545'
};

// Get provider (read-only)
export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  // Fallback to local Hardhat node
  return new ethers.JsonRpcProvider(HARDHAT_NETWORK.rpcUrl);
};

// Get signer (for transactions)
export const getSigner = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  }
  return null;
};

// Get contract instance for reading
export const getMarketplaceContract = () => {
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, DSCM_MARKETPLACE_ABI, provider);
};

// Get contract instance for writing (requires signer)
export const getMarketplaceContractWithSigner = async () => {
  const signer = await getSigner();
  if (!signer) return null;
  return new ethers.Contract(CONTRACT_ADDRESS, DSCM_MARKETPLACE_ABI, signer);
};

// Helper function to connect to MetaMask
export const connectWallet = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Switch to Hardhat network if not already connected
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7A69' }], // 31337 in hex
        });
      } catch (switchError: any) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7A69',
              chainName: 'Hardhat Local',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['http://127.0.0.1:8545'],
              blockExplorerUrls: null
            }]
          });
        }
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      return { address, signer };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  } else {
    throw new Error('MetaMask not found');
  }
};

// Helper function to format ETH values
export const formatEther = (value: bigint) => {
  return ethers.formatEther(value);
};

// Helper function to parse ETH values
export const parseEther = (value: string) => {
  return ethers.parseEther(value);
};

// Contract interaction functions
export const createListing = async (
  name: string,
  description: string,
  category: string,
  price: string,
  quantity: number,
  location: string,
  imageUrl: string
) => {
  const contract = await getMarketplaceContractWithSigner();
  if (!contract) throw new Error('No signer available');
  
  const priceInWei = parseEther(price);
  const tx = await contract.createListing(
    name,
    description,
    category,
    priceInWei,
    quantity,
    location,
    imageUrl
  );
  
  return await tx.wait();
};

export const purchaseProduct = async (listingId: number, quantity: number, totalPrice: string) => {
  const contract = await getMarketplaceContractWithSigner();
  if (!contract) throw new Error('No signer available');
  
  const priceInWei = parseEther(totalPrice);
  const tx = await contract.purchaseProduct(listingId, quantity, {
    value: priceInWei
  });
  
  return await tx.wait();
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

export const getTotalListings = async () => {
  const contract = getMarketplaceContract();
  return await contract.getTotalListings();
};

// Order management functions
export const confirmDelivery = async (orderId: number) => {
  const contract = await getMarketplaceContractWithSigner();
  if (!contract) throw new Error('No signer available');
  
  const tx = await contract.confirmDelivery(orderId);
  return await tx.wait();
};

export const confirmCompletion = async (orderId: number) => {
  const contract = await getMarketplaceContractWithSigner();
  if (!contract) throw new Error('No signer available');
  
  const tx = await contract.confirmCompletion(orderId);
  return await tx.wait();
};

export const getOrder = async (orderId: number) => {
  const contract = getMarketplaceContract();
  return await contract.getOrder(orderId);
};

// Export contract address and ABI for external use
export { CONTRACT_ADDRESS, DSCM_MARKETPLACE_ABI, HARDHAT_NETWORK };
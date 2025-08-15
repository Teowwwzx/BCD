// src/components/WalletInfo.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface WalletInfoProps {
  className?: string;
}

export const WalletInfo: React.FC<WalletInfoProps> = ({ className = '' }) => {
  const { 
    walletAddress, 
    walletBalance, 
    isWalletLoading, 
    connectWallet, 
    updateWallet,
    disconnectWallet 
  } = useAuth();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      // You could add toast notification here
    }
  };

  const handleUpdateWallet = async () => {
    setIsUpdating(true);
    setUpdateMessage(null);
    
    try {
      const result = await updateWallet();
      if (result.success) {
        setUpdateMessage({ type: 'success', text: 'Wallet updated successfully!' });
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateMessage(null), 3000);
      } else {
        setUpdateMessage({ type: 'error', text: result.error || 'Failed to update wallet' });
      }
    } catch (error) {
      console.error('Failed to update wallet:', error);
      setUpdateMessage({ type: 'error', text: 'Failed to update wallet' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      // You could add toast notification here
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isWalletLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00f5c3]"></div>
          <span className="text-gray-300 font-pixel">LOADING_WALLET...</span>
        </div>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-pixel text-white mb-2">WALLET_NOT_CONNECTED</h3>
          <p className="text-gray-400 mb-4">Connect your wallet to view balance and make transactions.</p>
          <button
            onClick={handleConnectWallet}
            className="font-pixel text-sm text-black bg-[#00f5c3] px-4 py-2 hover:bg-white transition-colors"
          >
            [ CONNECT_WALLET ]
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-pixel text-white">WALLET_STATUS</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[#00f5c3] rounded-full animate-pulse"></div>
          <span className="text-sm text-[#00f5c3] font-pixel">CONNECTED</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            WALLET_ADDRESS
          </label>
          <div className="flex items-center space-x-2">
            <code className="bg-black border border-[#30214f] px-2 py-1 text-sm font-mono text-white">
              {formatAddress(walletAddress)}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(walletAddress)}
              className="text-[#00f5c3] hover:text-white text-sm font-pixel"
              title="Copy full address"
            >
              [ COPY ]
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            BALANCE
          </label>
          <div className="text-lg font-pixel text-[#00f5c3]">
            {walletBalance ? `${parseFloat(walletBalance).toFixed(4)} ETH` : 'LOADING...'}
          </div>
        </div>
        
        {/* Update/Error Message */}
        {updateMessage && (
          <div className={`p-2 text-sm font-pixel text-center ${
            updateMessage.type === 'success' 
              ? 'text-[#00f5c3] bg-green-900/20 border border-green-600' 
              : 'text-red-400 bg-red-900/20 border border-red-600'
          }`}>
            {updateMessage.text}
          </div>
        )}
        
        <div className="pt-2 border-t border-[#30214f] space-y-2">
          <button
            onClick={handleUpdateWallet}
            disabled={isUpdating || isWalletLoading}
            className="w-full font-pixel text-sm text-black bg-[#00f5c3] px-4 py-2 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? '[ UPDATING... ]' : '[ UPDATE_WALLET ]'}
          </button>
          
          <button
            onClick={handleDisconnectWallet}
            disabled={isWalletLoading}
            className="w-full font-pixel text-sm text-white bg-red-600 px-4 py-2 hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            [ DISCONNECT_WALLET ]
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletInfo;
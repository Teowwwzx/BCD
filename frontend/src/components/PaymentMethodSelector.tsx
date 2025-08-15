'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PaymentMethod } from '../types';
import { useAuth } from '../hooks/useAuth';
import { usePayments } from '../hooks/usePayments';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onMethodSelect: (method: PaymentMethod) => void;
  disabled?: boolean;
  className?: string;
}

interface PaymentOption {
  method: PaymentMethod;
  title: string;
  description: string;
  icon: string;
  fees: string;
  processingTime: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodSelect,
  disabled = false,
  className = '',
}) => {
  // 1. State Hooks
  const [hoveredMethod, setHoveredMethod] = useState<PaymentMethod | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { walletAddress, isWalletConnected, connectWallet } = useAuth();
  const { getWalletBalance } = usePayments();

  // Fetch wallet balance when wallet is connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (isWalletConnected && walletAddress) {
        const balance = await getWalletBalance();
        setWalletBalance(balance);
      } else {
        setWalletBalance(null);
      }
    };
    
    fetchBalance();
  }, [isWalletConnected, walletAddress, getWalletBalance]);

  const handleWalletConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // 3. Effect Hooks - None needed for this component

  // 4. Performance Hooks
  const paymentOptions = useMemo<PaymentOption[]>(() => [
    {
      method: PaymentMethod.Gateway,
      title: 'Credit/Debit Card',
      description: 'Pay securely with your credit or debit card via Stripe/PayPal',
      icon: '💳',
      fees: '2.9% + $0.30',
      processingTime: 'Instant',
    },
    {
      method: PaymentMethod.Wallet,
      title: 'Crypto Wallet',
      description: 'Pay with cryptocurrency from your Web3 wallet',
      icon: '🔗',
      fees: 'Gas fees only',
      processingTime: '1-5 minutes',
    },
  ], []);

  const handleMethodSelect = useCallback((method: PaymentMethod) => {
    if (!disabled) {
      onMethodSelect(method);
    }
  }, [disabled, onMethodSelect]);

  const handleMouseEnter = useCallback((method: PaymentMethod) => {
    setHoveredMethod(method);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredMethod(null);
  }, []);

  return (
    <div className={`payment-method-selector ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Choose Payment Method
      </h3>
      
      <div className="space-y-3">
        {paymentOptions.map((option) => {
          const isSelected = selectedMethod === option.method;
          const isHovered = hoveredMethod === option.method;
          
          return (
            <div
              key={option.method}
              className={`
                payment-option relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : isHovered
                    ? 'border-gray-300 bg-gray-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${
                  disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:shadow-sm'
                }
              `}
              onClick={() => handleMethodSelect(option.method)}
              onMouseEnter={() => handleMouseEnter(option.method)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Selection indicator */}
              <div className="absolute top-4 right-4">
                <div
                  className={`
                    h-5 w-5 rounded-full border-2 transition-all duration-200
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 bg-white'
                    }
                  `}
                >
                  {isSelected && (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment method content */}
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{option.icon}</div>
                
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">
                    {option.title}
                  </h4>
                  
                  <p className="mt-1 text-sm text-gray-600">
                    {option.description}
                  </p>
                  
                  {option.method === PaymentMethod.Wallet && isWalletConnected && walletAddress && (
                    <div className="mt-2">
                      <p className="text-xs text-green-600">Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                      {walletBalance && (
                        <p className="text-xs text-gray-600">Balance: {parseFloat(walletBalance).toFixed(4)} ETH</p>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Fees:</span>
                      <span>{option.fees}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Processing:</span>
                      <span>{option.processingTime}</span>
                    </div>
                  </div>
                  
                  {option.method === PaymentMethod.Wallet && !isWalletConnected && (
                    <div className="mt-3">
                      <button
                        onClick={handleWalletConnect}
                        disabled={isConnecting || disabled}
                        className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional info for selected method */}
              {isSelected && (
                <div className="mt-4 rounded-md bg-blue-100 p-3">
                  <div className="text-sm text-blue-800">
                    {option.method === PaymentMethod.Gateway ? (
                      <div>
                        <p className="font-medium mb-1">Secure Payment Processing</p>
                        <p>Your payment will be processed securely through our payment gateway. We accept all major credit and debit cards.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium mb-1">Web3 Wallet Required</p>
                        <p>Make sure you have a Web3 wallet (like MetaMask) connected and sufficient funds for the transaction and gas fees.</p>
                        {isWalletConnected && walletBalance && parseFloat(walletBalance) < 0.01 && (
                          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                            <p className="text-xs text-yellow-800">⚠️ Low wallet balance. Make sure you have enough ETH for the transaction and gas fees.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment method benefits */}
      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Why choose {selectedMethod === PaymentMethod.Gateway ? 'Card Payment' : selectedMethod === PaymentMethod.Wallet ? 'Crypto Payment' : 'our payment methods'}?
        </h4>
        
        {selectedMethod === PaymentMethod.Gateway && (
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Instant payment confirmation</li>
            <li>• Buyer protection and dispute resolution</li>
            <li>• No need for cryptocurrency knowledge</li>
            <li>• Widely accepted and familiar</li>
          </ul>
        )}
        
        {selectedMethod === PaymentMethod.Wallet && (
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Lower transaction fees (gas only)</li>
            <li>• Decentralized and trustless payments</li>
            <li>• Direct wallet-to-wallet transfers</li>
            <li>• Enhanced privacy and security</li>
          </ul>
        )}
        
        {!selectedMethod && (
          <p className="text-sm text-gray-600">
            Select a payment method above to see its benefits and features.
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
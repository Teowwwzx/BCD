import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { parseEther, formatEther } from '../lib/web3';
import { useAuth } from './useAuth';
import { PaymentTransaction, PaymentMethod, TransactionStatus, CheckoutData } from '../types';

interface PaymentState {
  payments: PaymentTransaction[];
  paymentsIsLoading: boolean;
  paymentsError: string | null;
}

interface PaymentGatewayData {
  amount: string;
  currency: string;
  checkoutData: CheckoutData;
}

interface WalletPaymentData {
  amount: string;
  recipientAddress: string;
  checkoutData: CheckoutData;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  transactionHash?: string;
  gasUsed?: string;
  gasPrice?: string;
  error?: string;
}

export const usePayments = () => {
  // 1. State Hooks
  const [state, setState] = useState<PaymentState>({
    payments: [],
    paymentsIsLoading: false,
    paymentsError: null,
  });

  // 2. Context Hooks
  const { token, user, walletAddress, connectWallet } = useAuth();

  // Helper function to make API calls
  const makeApiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    console.log('DEBUG: Making API call to:', url, 'with options:', options);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    console.log('DEBUG: API response status:', response.status, 'for URL:', url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      console.error('DEBUG: API error response:', errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('DEBUG: API success response:', result);
    return result;
  }, [token]);

  // Fetch payments for a specific order or all payments
  const fetchPayments = useCallback(async (orderId?: number) => {
    setState(prev => ({ ...prev, paymentsIsLoading: true, paymentsError: null }));
    
    try {
      const url = orderId ? `/payments?order_id=${orderId}` : '/payments';
      const data = await makeApiCall(url);
      
      setState(prev => ({
        ...prev,
        payments: data.payments || [],
        paymentsIsLoading: false,
      }));
      
      return data.payments || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch payments';
      setState(prev => ({
        ...prev,
        paymentsError: errorMessage,
        paymentsIsLoading: false,
      }));
      throw error;
    }
  }, [makeApiCall]);

  // Get payment by ID
  const getPaymentById = useCallback(async (paymentId: number): Promise<PaymentTransaction> => {
    try {
      const data = await makeApiCall(`/payments/${paymentId}`);
      return data.payment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch payment';
      setState(prev => ({ ...prev, paymentsError: errorMessage }));
      throw error;
    }
  }, [makeApiCall]);

  // Process payment via gateway (Stripe/PayPal simulation)
  const processGatewayPayment = useCallback(async (paymentData: PaymentGatewayData): Promise<PaymentResult> => {
    setState(prev => ({ ...prev, paymentsIsLoading: true, paymentsError: null }));
    
    try {
      // First, create the order via checkout endpoint
      const checkoutResponse = await makeApiCall('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          buyerId: user?.id,
          shippingAddressId: paymentData.checkoutData.shippingAddressId,
          billingAddressId: paymentData.checkoutData.billingAddressId,
          shippingMethodId: paymentData.checkoutData.shippingMethodId,
          paymentMethod: 'gateway',
          paymentToken: 'temp_token', // Will be replaced with actual token
          customerEmail: user?.email,
          couponCode: paymentData.checkoutData.couponCode,
        }),
      });

      // Then process the payment with the created order ID
      const paymentResponse = await makeApiCall('/payments/gateway', {
        method: 'POST',
        body: JSON.stringify({
          orderId: checkoutResponse.data.order.id,
          amount: paymentData.amount,
          paymentMethod: 'gateway',
          paymentToken: 'stripe_token_simulation',
          customerEmail: user?.email,
        }),
      });
      
      setState(prev => ({
        ...prev,
        payments: [paymentResponse.payment, ...prev.payments],
        paymentsIsLoading: false,
      }));
      
      return {
        success: true,
        paymentId: paymentResponse.payment.id.toString(),
        orderId: checkoutResponse.data.order.id.toString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gateway payment failed';
      setState(prev => ({
        ...prev,
        paymentsError: errorMessage,
        paymentsIsLoading: false,
      }));
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [makeApiCall]);

  // Process wallet-to-wallet payment
  const processWalletPayment = useCallback(async (paymentData: WalletPaymentData): Promise<PaymentResult> => {
    setState(prev => ({ ...prev, paymentsIsLoading: true, paymentsError: null }));
    
    try {
      // Ensure wallet is connected and request accounts
      if (!walletAddress) {
        const result = await connectWallet();
        if (!result || !result.address) {
          throw new Error('Please connect your wallet to continue');
        }
      }
      
      // Check if we have ethereum provider
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask or compatible wallet not found');
      }

      // Type assertion for window.ethereum
      const ethereum = window.ethereum as any;

      // Ensure we have access to accounts with error handling
      try {
        await ethereum.request({ method: 'eth_requestAccounts' });
      } catch (accountError) {
        console.error('Failed to request accounts:', accountError);
        throw new Error('Failed to connect to wallet. Please try again.');
      }

      let provider, signer, userAddress;
      try {
        provider = new ethers.BrowserProvider(ethereum);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
      } catch (providerError) {
        console.error('Failed to initialize provider:', providerError);
        throw new Error('Failed to initialize wallet connection. Please refresh and try again.');
      }

      // Validate and use the recipient address directly (no ENS resolution needed on local network)
      if (!ethers.isAddress(paymentData.recipientAddress)) {
        throw new Error('Invalid recipient address format');
      }
      const resolvedRecipientAddress = paymentData.recipientAddress;

      // Check wallet balance with error handling
      let balance;
      try {
        balance = await provider.getBalance(userAddress);
      } catch (balanceError) {
        console.error('Failed to get wallet balance:', balanceError);
        throw new Error('Unable to check wallet balance. Please try again.');
      }
      
      // Convert USD amount to ETH (using a simple conversion for demo purposes)
      // In production, you would fetch real-time exchange rates
      const usdToEthRate = 0.0004; // Approximate: 1 USD = 0.0004 ETH (when ETH = $2500)
      const ethAmount = parseFloat(paymentData.amount) * usdToEthRate;
      const amountInWei = parseEther(ethAmount.toString());
      
      if (balance < amountInWei) {
        throw new Error(`Insufficient balance. Required: ${ethAmount.toFixed(6)} ETH (~$${paymentData.amount}), Available: ${formatEther(balance)} ETH`);
      }

      // Estimate gas for the transaction with error handling
      let gasEstimate;
      try {
        gasEstimate = await provider.estimateGas({
          to: resolvedRecipientAddress,
          value: amountInWei,
        });
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        // Use a default gas limit if estimation fails
        gasEstimate = BigInt(21000); // Standard ETH transfer gas limit
      }

      // Get current gas price (use legacy gas pricing for local network)
      let gasPrice;
      try {
        const feeData = await provider.getFeeData();
        gasPrice = feeData.gasPrice || parseEther('0.00000002'); // Fallback gas price
      } catch (feeError) {
        console.error('Fee data fetch failed:', feeError);
        gasPrice = parseEther('0.00000002'); // Use fallback gas price
      }
      
      const estimatedGasCost = gasEstimate * gasPrice;
      const totalCost = amountInWei + estimatedGasCost;

      if (balance < totalCost) {
        throw new Error(`Insufficient balance for transaction and gas fees. Required: ${formatEther(totalCost)} ETH (~$${paymentData.amount} + gas), Available: ${formatEther(balance)} ETH`);
      }

      // FIRST, validate and create the order via checkout endpoint (before sending money!)
      console.log('DEBUG: About to create order with data:', {
        buyerId: user?.id,
        shippingAddressId: paymentData.checkoutData.shippingAddressId,
        billingAddressId: paymentData.checkoutData.billingAddressId,
        shippingMethodId: paymentData.checkoutData.shippingMethodId,
        paymentMethod: 'wallet',
        fromUserId: user?.id,
        toUserId: paymentData.checkoutData.sellerId || 1,
        couponCode: paymentData.checkoutData.couponCode,
      });
      
      const checkoutResponse = await makeApiCall('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          buyerId: user?.id,
          shippingAddressId: paymentData.checkoutData.shippingAddressId,
          billingAddressId: paymentData.checkoutData.billingAddressId,
          shippingMethodId: paymentData.checkoutData.shippingMethodId,
          paymentMethod: 'wallet',
          fromUserId: user?.id,
          toUserId: paymentData.checkoutData.sellerId || 1, // Default to seller ID 1 if not provided
          couponCode: paymentData.checkoutData.couponCode,
        }),
      });
      
      console.log('DEBUG: Checkout response:', checkoutResponse);

      // Validate checkout response
      console.log('DEBUG: Validating checkout response...');
      if (!checkoutResponse || !checkoutResponse.data || !checkoutResponse.data.order || !checkoutResponse.data.order.id) {
        console.error('DEBUG: Invalid checkout response:', checkoutResponse);
        throw new Error('Failed to create order. Please try again.');
      }
      console.log('DEBUG: Order created successfully with ID:', checkoutResponse.data.order.id);

      // Now that order is created, proceed with blockchain transaction
      // Create and send the transaction (use legacy gas pricing for local network)
      const transaction = {
        to: resolvedRecipientAddress,
        value: amountInWei,
        gasLimit: gasEstimate,
        gasPrice: gasPrice,
        type: 0, // Use legacy transaction type to avoid EIP-1559 issues on local network
      };

      let txResponse;
      try {
        txResponse = await signer.sendTransaction(transaction);
      } catch (txError) {
        // Handle specific transaction errors
        if (txError && typeof txError === 'object' && 'code' in txError) {
          if (txError.code === 'ACTION_REJECTED') {
            throw new Error('Transaction was rejected by user');
          } else if (txError.code === 'INSUFFICIENT_FUNDS') {
            throw new Error('Insufficient funds for transaction');
          }
        }
        // throw new Error('Failed to send transaction. Please try again.');
      }
      
      // Wait for transaction confirmation with timeout
      let receipt;
      try {
        receipt = await Promise.race([
          txResponse.wait(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000)
          )
        ]);
      } catch (receiptError) {
        throw new Error('Transaction confirmation failed. Please check your transaction hash manually.');
      }

      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed or was reverted');
      }

      // Calculate actual gas used
      const actualGasUsed = receipt.gasUsed;
      const actualGasCost = actualGasUsed * (receipt.gasPrice || gasPrice);

      // Then create payment record via API
      const apiData = await makeApiCall('/payments/wallet-transfer', {
        method: 'POST',
        body: JSON.stringify({
          orderId: checkoutResponse.data.order.id,
          amount: ethAmount.toFixed(6), // Store ETH amount, not USD
          usdAmount: paymentData.amount, // Store original USD amount for reference
          fromUserId: user?.id,
          toUserId: paymentData.checkoutData.sellerId || 1,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          fromAddress: userAddress,
          toAddress: resolvedRecipientAddress,
          gasUsed: Number(actualGasUsed),
          gasPriceGwei: formatEther(receipt.gasPrice || gasPrice),
        }),
      });
      
      setState(prev => ({
        ...prev,
        payments: [apiData.payment, ...prev.payments],
        paymentsIsLoading: false,
      }));
      
      return {
        success: true,
        paymentId: apiData.payment.id.toString(),
        orderId: checkoutResponse.data.order.id.toString(),
        transactionHash: receipt.hash,
        ethAmount: ethAmount.toFixed(6),
        usdAmount: paymentData.amount,
        gasUsed: formatEther(actualGasUsed),
        gasPrice: formatEther(receipt.gasPrice || gasPrice),
      };
    } catch (error) {
      console.error('Wallet payment error:', error);
      
      let errorMessage = 'Wallet payment failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle ethers.js and JSON-RPC specific errors
        if ('code' in error) {
          switch (error.code) {
            case 'ACTION_REJECTED':
            case 4001:
              errorMessage = 'Transaction was rejected by user';
              break;
            case 'INSUFFICIENT_FUNDS':
            case -32603:
              errorMessage = 'Insufficient funds for transaction';
              break;
            case 'NETWORK_ERROR':
            case -32002:
              errorMessage = 'Network error. Please check your connection';
              break;
            case -32000:
              errorMessage = 'Transaction failed. Please try again.';
              break;
            case 'UNPREDICTABLE_GAS_LIMIT':
              errorMessage = 'Unable to estimate gas. Transaction may fail.';
              break;
            default:
              errorMessage = ('message' in error && typeof error.message === 'string') ? error.message : 'Transaction failed';
          }
        } else if ('reason' in error && typeof error.reason === 'string') {
          errorMessage = error.reason;
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
      }
      
      setState(prev => ({
        ...prev,
        paymentsError: errorMessage,
        paymentsIsLoading: false,
      }));
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [makeApiCall, walletAddress]);

  // Update payment status
  const updatePaymentStatus = useCallback(async (paymentId: number, status: TransactionStatus): Promise<PaymentTransaction> => {
    try {
      const data = await makeApiCall(`/payments/${paymentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      
      setState(prev => ({
        ...prev,
        payments: prev.payments.map(payment => 
          payment.id === paymentId ? data.payment : payment
        ),
      }));
      
      return data.payment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment status';
      setState(prev => ({ ...prev, paymentsError: errorMessage }));
      throw error;
    }
  }, [makeApiCall]);

  // Clear payments error
  const clearPaymentsError = useCallback(() => {
    setState(prev => ({ ...prev, paymentsError: null }));
  }, []);

  // Helper function to check wallet connection
  const checkWalletConnection = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        return false;
      }
      
      // Type assertion for window.ethereum
      const ethereum = window.ethereum as any;
      const provider = new ethers.BrowserProvider(ethereum);
      const accounts = await provider.listAccounts();
      return accounts.length > 0;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }, []);

  // Helper function to get wallet balance
  const getWalletBalance = useCallback(async (): Promise<string | null> => {
    try {
      if (!walletAddress || typeof window === 'undefined' || !window.ethereum) {
        return null;
      }
      
      // Type assertion for window.ethereum
      const ethereum = window.ethereum as any;
      const provider = new ethers.BrowserProvider(ethereum);
      const balance = await provider.getBalance(walletAddress);
      return formatEther(balance);
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return null;
    }
  }, [walletAddress]);

  return {
    // State
    payments: state.payments,
    paymentsIsLoading: state.paymentsIsLoading,
    paymentsError: state.paymentsError,
    
    // Actions
    fetchPayments,
    getPaymentById,
    processGatewayPayment,
    processWalletPayment,
    updatePaymentStatus,
    clearPaymentsError,
    checkWalletConnection,
    getWalletBalance,
    walletAddress,
  };
};
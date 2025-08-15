import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { connectWallet, parseEther, formatEther } from '../lib/web3';
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
  const { token, user, walletAddress } = useAuth();

  // Helper function to make API calls
  const makeApiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }, [token]);

  // Fetch payments for a specific order or all payments
  const fetchPayments = useCallback(async (orderId?: number) => {
    setState(prev => ({ ...prev, paymentsIsLoading: true, paymentsError: null }));
    
    try {
      const url = orderId ? `/api/payments?order_id=${orderId}` : '/api/payments';
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
      const data = await makeApiCall(`/api/payments/${paymentId}`);
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
      const checkoutResponse = await makeApiCall('/api/orders/checkout', {
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
      const paymentResponse = await makeApiCall('/api/payments/gateway', {
        method: 'POST',
        body: JSON.stringify({
          orderId: checkoutResponse.order.id,
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
        orderId: checkoutResponse.order.id.toString(),
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
      // Ensure wallet is connected
      if (!walletAddress) {
        const walletConnection = await connectWallet();
        if (!walletConnection) {
          throw new Error('Please connect your wallet to continue');
        }
      }

      // Check if we have ethereum provider
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask or compatible wallet not found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Check wallet balance
      const balance = await provider.getBalance(userAddress);
      const amountInWei = parseEther(paymentData.amount.toString());
      
      if (balance < amountInWei) {
        throw new Error(`Insufficient balance. Required: ${paymentData.amount} ETH, Available: ${formatEther(balance)} ETH`);
      }

      // Estimate gas for the transaction
      const gasEstimate = await provider.estimateGas({
        to: paymentData.recipientAddress,
        value: amountInWei,
      });

      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || parseEther('0.00000002'); // Fallback gas price
      
      const estimatedGasCost = gasEstimate * gasPrice;
      const totalCost = amountInWei + estimatedGasCost;

      if (balance < totalCost) {
        throw new Error(`Insufficient balance for transaction and gas fees. Required: ${formatEther(totalCost)} ETH, Available: ${formatEther(balance)} ETH`);
      }

      // Create and send the transaction
      const transaction = {
        to: paymentData.recipientAddress,
        value: amountInWei,
        gasLimit: gasEstimate,
        gasPrice: gasPrice,
      };

      const txResponse = await signer.sendTransaction(transaction);
      
      // Wait for transaction confirmation
      const receipt = await txResponse.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed or was reverted');
      }

      // Calculate actual gas used
      const actualGasUsed = receipt.gasUsed;
      const actualGasCost = actualGasUsed * (receipt.gasPrice || gasPrice);

      // First, create the order via checkout endpoint
      const checkoutResponse = await makeApiCall('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          buyerId: user?.id,
          shippingAddressId: paymentData.checkoutData.shippingAddressId,
          billingAddressId: paymentData.checkoutData.billingAddressId,
          shippingMethodId: paymentData.checkoutData.shippingMethodId,
          paymentMethod: 'wallet',
          couponCode: paymentData.checkoutData.couponCode,
        }),
      });

      // Then create payment record via API
      const apiData = await makeApiCall('/api/payments/wallet-transfer', {
        method: 'POST',
        body: JSON.stringify({
          orderId: checkoutResponse.order.id,
          amount: paymentData.amount,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          fromAddress: userAddress,
          toAddress: paymentData.recipientAddress,
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
        orderId: checkoutResponse.order.id.toString(),
        transactionHash: receipt.hash,
        gasUsed: formatEther(actualGasUsed),
        gasPrice: formatEther(receipt.gasPrice || gasPrice),
      };
    } catch (error) {
      console.error('Wallet payment error:', error);
      let errorMessage = 'Wallet payment failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle ethers.js specific errors
        if ('code' in error) {
          switch (error.code) {
            case 'ACTION_REJECTED':
              errorMessage = 'Transaction was rejected by user';
              break;
            case 'INSUFFICIENT_FUNDS':
              errorMessage = 'Insufficient funds for transaction';
              break;
            case 'NETWORK_ERROR':
              errorMessage = 'Network error. Please check your connection';
              break;
            default:
              errorMessage = ('message' in error && typeof error.message === 'string') ? error.message : 'Transaction failed';
          }
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
      const data = await makeApiCall(`/api/payments/${paymentId}`, {
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
      
      const provider = new ethers.BrowserProvider(window.ethereum);
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
      
      const provider = new ethers.BrowserProvider(window.ethereum);
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
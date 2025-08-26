// frontend/src/hooks/useAdminPayments.ts
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth'; // Assuming you have a useAuth hook
import { getProvider, getSigner } from '../lib/web3'; // Your web3 helpers
import { ethers } from 'ethers';

// You would get this from your deployment files
const REFUND_CONTRACT_ABI = [
    "function processRefund(uint256 orderId, address buyer, uint256 amount)"
];
const REFUND_CONTRACT_ADDRESS = "YOUR_REFUND_CONTRACT_ADDRESS"; // Address of the contract holding funds

export const useAdminPayments = () => {
    const { token, user } = useAuth(); // Assuming useAuth provides the admin user and token
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    /**
     * This function orchestrates the entire refund process.
     * It tells the backend to execute an on-chain refund from the admin's wallet.
     * The backend handles the secure transaction signing and database updates.
     */
    const refundOrder = useCallback(async (orderId: number, buyerWallet: string, amount: string) => {
        if (!token || user?.user_role !== 'admin') {
            setError("Authentication required for refunds.");
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            // Get the admin's signer to authorize the transaction
            const provider = getProvider();
            if (!provider) throw new Error("Wallet provider not found.");
            
            const signer = await getSigner();
            const adminAddress = await signer.getAddress();

            // The backend will securely use its own admin wallet to send the ETH.
            // Here, we just call the backend endpoint to trigger the process.
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    // The backend can look up these values, but sending them ensures consistency
                    buyerAddress: buyerWallet,
                    refundAmount: amount 
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to process refund on the backend.');
            }

            console.log('Refund processed successfully, txHash:', result.data.txHash);
            return true;

        } catch (err: any) {
            console.error('Refund failed:', err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, [token, user, API_BASE_URL]);

    return { loading, error, refundOrder };
};
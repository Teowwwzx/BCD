// src/app/checkout/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import { useAddresses } from '../../hooks/useAddresses';
import { usePayments } from '../../hooks/usePayments';
import { useShippingMethods } from '../../hooks/useShippingMethods';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PaymentMethodSelector from '../../components/PaymentMethodSelector';
import ShippingMethodSelector from '../../components/ShippingMethodSelector';
import OrderSummary from '../../components/OrderSummary';
import { Address, AddressType, PaymentMethod, CheckoutData } from '../../types';

// Checkout steps enum
enum CheckoutStep {
  SHIPPING = 'shipping',
  PAYMENT = 'payment',
  REVIEW = 'review',
  CONFIRMATION = 'confirmation',
}

// Step indicator component
const StepIndicator = ({ currentStep }: { currentStep: CheckoutStep }) => {
  const steps = [
    { key: CheckoutStep.SHIPPING, label: 'Shipping', icon: '📦' },
    { key: CheckoutStep.PAYMENT, label: 'Payment', icon: '💳' },
    { key: CheckoutStep.REVIEW, label: 'Review', icon: '👀' },
    { key: CheckoutStep.CONFIRMATION, label: 'Confirmation', icon: '✅' },
  ];

  const currentIndex = steps.findIndex(step => step.key === currentStep);

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex h-12 w-12 items-center justify-center rounded-full border-2 text-lg
                  ${
                    isCompleted
                      ? 'border-green-500 bg-green-500 text-white'
                      : isActive
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                  }
                `}
              >
                {isCompleted ? '✓' : step.icon}
              </div>
              <span
                className={`
                  mt-2 text-sm font-medium
                  ${
                    isActive
                      ? 'text-blue-600'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }
                `}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  mx-4 h-0.5 w-16
                  ${
                    index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                  }
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Address form component
const AddressForm = ({ onSave, onCancel }: { onSave: (address: Omit<Address, 'id' | 'user_id'>) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState({
    addr_line_1: '',
    addr_line_2: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    address_type: 'shipping' as AddressType,
    location_type: 'residential' as 'residential' | 'company',
    is_default: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold">Add New Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select name="location_type" value={formData.location_type} onChange={handleChange} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value="residential">Residential</option>
          <option value="company">Company</option>
        </select>
        <input name="addr_line_1" placeholder="Address Line 1" value={formData.addr_line_1} onChange={handleChange} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        <input name="addr_line_2" placeholder="Address Line 2 (Optional)" value={formData.addr_line_2} onChange={handleChange} className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        <input name="city" placeholder="City" value={formData.city} onChange={handleChange} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        <input name="state" placeholder="State" value={formData.state} onChange={handleChange} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        <input name="postcode" placeholder="Postcode" value={formData.postcode} onChange={handleChange} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        <input name="country" placeholder="Country" value={formData.country} onChange={handleChange} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div className="flex items-center">
        <input id="is_default" name="is_default" type="checkbox" checked={formData.is_default} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">Set as default address</label>
      </div>
      <div className="flex space-x-3">
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500">Save Address</button>
        <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
      </div>
    </form>
  );
};

export default function CheckoutPage() {
  // 1. State Hooks
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.SHIPPING);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [selectedShippingMethodName, setSelectedShippingMethodName] = useState<string>('');
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();

  // 2. Context Hooks
  const { user, isLoggedIn, authIsLoading, isWalletConnected, connectWallet, walletAddress, walletBalance } = useAuth();
  const { cartItems, clearCart } = useCart();
  const { addresses, createAddress, loading: addressesLoading, error: addressesError } = useAddresses();
  const {
    processWalletPayment,
    paymentsIsLoading,
    paymentsError,
  } = usePayments();
  const { calculateAllShippingCosts } = useShippingMethods();

  // 3. Effect Hooks
  useEffect(() => {
    const defaultAddress = addresses.find(a => a.is_default);
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses]);

  // Page Guards - Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    if (!authIsLoading && !isLoggedIn) {
      router.push('/auth');
    }
  }, [authIsLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!authIsLoading && cartItems.length === 0) {
      router.push('/products');
    }
  }, [authIsLoading, cartItems.length, router]);

  // 4. Performance Hooks
  const selectedAddress = useMemo(() => {
    return addresses.find(addr => addr.id === selectedAddressId);
  }, [addresses, selectedAddressId]);

  const cartWeight = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.weight || 1) * item.quantity, 0);
  }, [cartItems]);

  const handleSaveAddress = useCallback(async (addressData: Omit<Address, 'id' | 'user_id'>) => {
    const newAddress = await createAddress(addressData);
    if (newAddress) {
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
    }
  }, [createAddress]);

  const handleShippingMethodSelect = useCallback((methodId: number, cost: number) => {
    setSelectedShippingMethodId(methodId);
    setShippingCost(cost);
    // You might want to fetch the method name here or pass it from the component
  }, []);

  const handleCouponApply = useCallback(async (code: string) => {
    // Simulate coupon validation - replace with actual API call
    try {
      // Mock coupon validation
      const mockCoupons: Record<string, number> = {
        'SAVE10': 10,
        'WELCOME20': 20,
        'DISCOUNT15': 15,
      };
      
      const discount = mockCoupons[code.toUpperCase()];
      if (discount) {
        setCouponCode(code.toUpperCase());
        setCouponDiscount(discount);
        return { discount };
      } else {
        return { discount: 0, error: 'Invalid coupon code' };
      }
    } catch (error) {
      return { discount: 0, error: 'Failed to apply coupon' };
    }
  }, []);

  const handleCouponRemove = useCallback(() => {
    setCouponCode('');
    setCouponDiscount(0);
  }, []);

  const handleNextStep = useCallback(() => {
    switch (currentStep) {
      case CheckoutStep.SHIPPING:
        if (selectedAddressId && selectedShippingMethodId) {
          setCurrentStep(CheckoutStep.PAYMENT);
        }
        break;
      case CheckoutStep.PAYMENT:
        if (selectedPaymentMethod) {
          setCurrentStep(CheckoutStep.REVIEW);
        }
        break;
      case CheckoutStep.REVIEW:
        handlePlaceOrder();
        break;
    }
  }, [currentStep, selectedAddressId, selectedShippingMethodId, selectedPaymentMethod]);

  const handlePreviousStep = useCallback(() => {
    switch (currentStep) {
      case CheckoutStep.PAYMENT:
        setCurrentStep(CheckoutStep.SHIPPING);
        break;
      case CheckoutStep.REVIEW:
        setCurrentStep(CheckoutStep.PAYMENT);
        break;
    }
  }, [currentStep]);

  const calculateTotal = useCallback(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const discountAmount = couponDiscount;
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = subtotalAfterDiscount * 0.1; // 10% tax
    return subtotalAfterDiscount + taxAmount + shippingCost;
  }, [cartItems, couponDiscount, shippingCost]);

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedAddressId || !selectedPaymentMethod || !selectedShippingMethodId) {
      alert('Please complete all required fields.');
      return;
    }

    // Additional validation for wallet payments
    if (selectedPaymentMethod === PaymentMethod.Wallet) {
      if (!isWalletConnected) {
        alert('Please connect your wallet first');
        return;
      }
      
      if (!walletBalance || parseFloat(walletBalance) < calculateTotal()) {
        alert(`Insufficient wallet balance. Required: ${calculateTotal()} ETH, Available: ${walletBalance || '0'} ETH`);
        return;
      }
    }

    // Validate required fields before processing
    if (!selectedAddressId) {
      alert('Please select a shipping address before proceeding.');
      return;
    }
    
    if (!selectedShippingMethodId) {
      alert('Please select a shipping method before proceeding.');
      return;
    }

    setIsProcessingOrder(true);
    setTransactionStatus('processing');
    setPaymentResult(null);
    
    try {
      // For marketplace payments, we need to identify the seller
      // In a multi-seller marketplace, this would need more complex logic
      // For now, we'll use the first item's seller or default to seller ID 1
      const sellerId = cartItems.length > 0 && cartItems[0].product?.sellerId ? cartItems[0].product.sellerId : 1;
      
      const checkoutData: CheckoutData = {
        shippingAddressId: selectedAddressId,
        billingAddressId: selectedAddressId, // Using same address for billing
        shippingMethodId: selectedShippingMethodId,
        paymentMethod: selectedPaymentMethod,
        sellerId: sellerId, // Required for wallet payments
        couponCode: couponCode || undefined,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        })),
      };

      // Process wallet payment (only payment method available)
      const marketplaceWallet = process.env.NEXT_PUBLIC_MARKETPLACE_WALLET || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const result = await processWalletPayment({
        amount: calculateTotal().toString(),
        recipientAddress: marketplaceWallet,
        checkoutData,
      });

      setPaymentResult(result);
      
      if (result.success) {
        setTransactionStatus('success');
        setOrderConfirmation(result);
        setCurrentStep(CheckoutStep.CONFIRMATION);
        clearCart();
        setShowSuccessModal(true);
        router.push('/order');

      } else {
        setTransactionStatus('error');
        setShowSuccessModal(true);
        router.push('/order');

        // alert('Payment failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Order placement failed:', error);
      setTransactionStatus('error');
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessingOrder(false);
    }
  }, [selectedAddressId, selectedPaymentMethod, selectedShippingMethodId, couponCode, cartItems, processWalletPayment, clearCart, isWalletConnected, walletBalance, calculateTotal]);

  const canProceedToNext = useMemo(() => {
    switch (currentStep) {
      case CheckoutStep.SHIPPING:
        return selectedAddressId && selectedShippingMethodId;
      case CheckoutStep.PAYMENT:
        return selectedPaymentMethod;
      case CheckoutStep.REVIEW:
        return true;
      default:
        return false;
    }
  }, [currentStep, selectedAddressId, selectedShippingMethodId, selectedPaymentMethod]);

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/profile');
  };

  // Early returns after all hooks are defined
  if (authIsLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isLoggedIn || (cartItems.length === 0 && !authIsLoading)) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }

  const getStepContent = () => {
    switch (currentStep) {
      case CheckoutStep.SHIPPING:
        return (
          <div className="space-y-8">
            {/* Shipping Address Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
              {addressesLoading && <p>Loading addresses...</p>}
              {addressesError && <p className='text-red-500'>{addressesError}</p>}
              
              <div className="space-y-3 mb-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    onClick={() => setSelectedAddressId(address.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedAddressId === address.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-semibold ${
                          selectedAddressId === address.id ? 'text-blue-900' : 'text-gray-900'
                        }`}>{address.addr_line_1}</p>
                        {address.addr_line_2 && <p className={`${
                          selectedAddressId === address.id ? 'text-blue-800' : 'text-gray-700'
                        }`}>{address.addr_line_2}</p>}
                        <p className={`${
                          selectedAddressId === address.id ? 'text-blue-800' : 'text-gray-700'
                        }`}>{address.city}, {address.state} {address.postcode}</p>
                        <p className={`${
                          selectedAddressId === address.id ? 'text-blue-800' : 'text-gray-700'
                        }`}>{address.country}</p>
                      </div>
                      {address.is_default && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {!showAddressForm ? (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  + Add New Address
                </button>
              ) : (
                <AddressForm
                  onSave={handleSaveAddress}
                  onCancel={() => setShowAddressForm(false)}
                />
              )}
            </div>
            
            {/* Shipping Method Section */}
            {selectedAddressId && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <ShippingMethodSelector
                  selectedMethodId={selectedShippingMethodId}
                  onMethodSelect={handleShippingMethodSelect}
                  weight={cartWeight}
                  distance={10} // You might want to calculate this based on address
                  destinationPostcode={selectedAddress?.postcode}
                />
              </div>
            )}
          </div>
        );
        
      case CheckoutStep.PAYMENT:
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <PaymentMethodSelector
              selectedMethod={selectedPaymentMethod}
              onMethodSelect={setSelectedPaymentMethod}
            />
          </div>
        );
        
      case CheckoutStep.REVIEW:
        return (
          <div className="space-y-6">
            {/* Order Review */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Review Your Order</h2>
              
              {/* Shipping Details */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Shipping Details</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="font-medium">Address:</p>
                  <p>{selectedAddress?.addr_line_1}</p>
                  {selectedAddress?.addr_line_2 && <p>{selectedAddress.addr_line_2}</p>}
                  <p>{selectedAddress?.city}, {selectedAddress?.state} {selectedAddress?.postcode}</p>
                  <p>{selectedAddress?.country}</p>
                </div>
              </div>
              
              {/* Payment Details */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Payment Method</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p>Crypto Wallet</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case CheckoutStep.CONFIRMATION:
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Order Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
            
            {orderConfirmation && (
              <div className="bg-gray-50 p-4 rounded-md mb-6 text-left">
                <h3 className="font-medium mb-2">Order Details:</h3>
                <p><strong>Order ID:</strong> {orderConfirmation.orderId}</p>
                <p><strong>Payment ID:</strong> {orderConfirmation.paymentId}</p>
                <p><strong>Total:</strong> {selectedPaymentMethod === PaymentMethod.Wallet ? `${calculateTotal().toFixed(4)} ETH` : `$${calculateTotal().toFixed(2)}`}</p>
                {orderConfirmation.transactionHash && (
                  <div className="mt-2">
                    <p><strong>Transaction Hash:</strong></p>
                    <a 
                      href={`https://etherscan.io/tx/${orderConfirmation.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all text-sm"
                    >
                      {orderConfirmation.transactionHash}
                    </a>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-x-4">
              <button
                onClick={() => router.push('/orders')}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View Orders
              </button>
              <button
                onClick={() => router.push('/products')}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
        
        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {getStepContent()}
            
            {/* Navigation Buttons */}
            {currentStep !== CheckoutStep.CONFIRMATION && (
              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePreviousStep}
                  disabled={currentStep === CheckoutStep.SHIPPING}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <button
                  onClick={handleNextStep}
                  disabled={!canProceedToNext || isProcessingOrder || paymentsIsLoading || transactionStatus === 'processing'}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {transactionStatus === 'processing' ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>
                        {selectedPaymentMethod === PaymentMethod.Wallet 
                          ? 'Processing Blockchain Transaction...' 
                          : 'Processing Payment...'
                        }
                      </span>
                    </div>
                  ) : transactionStatus === 'success' ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Payment Successful!</span>
                    </div>
                  ) : (
                    isProcessingOrder || paymentsIsLoading
                      ? 'Processing...'
                      : currentStep === CheckoutStep.REVIEW
                      ? `Place Order - ${selectedPaymentMethod === PaymentMethod.Wallet ? `${calculateTotal().toFixed(4)} ETH` : `$${calculateTotal().toFixed(2)}`}`
                      : 'Next'
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* Order Summary Sidebar */}
          {currentStep !== CheckoutStep.CONFIRMATION && (
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <OrderSummary
                  cartItems={cartItems}
                  shippingCost={shippingCost}
                  selectedShippingMethodName={selectedShippingMethodName}
                  couponCode={couponCode}
                  couponDiscount={couponDiscount}
                  onCouponApply={handleCouponApply}
                  onCouponRemove={handleCouponRemove}
                  isLoading={isProcessingOrder || paymentsIsLoading}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-4">
                Your order has been placed successfully. You can view your order details in your profile.
              </p>
              {orderConfirmation && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Order ID:</strong> {orderConfirmation.orderId}
                  </p>
                  {orderConfirmation.transactionHash && (
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Transaction:</strong> {orderConfirmation.transactionHash.slice(0, 10)}...
                    </p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleSuccessModalClose}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );

}
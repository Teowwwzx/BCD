// src/app/checkout/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import { useAddresses } from '../../hooks/useAddresses';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import type { Address, AddressType } from '../../types';

// A component for the address form
const AddressForm = ({ onSave, onCancel }: { onSave: (address: Omit<Address, 'id' | 'user_id'>) => void, onCancel: () => void }) => {
    // 1. Initialize formData with all required fields from the Address type
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
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold">Add New Address</h3>
            {/* --- FIX: Add inputs for missing fields --- */}
            <select name="location_type" value={formData.location_type} onChange={handleChange} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600">
                <option value="residential">Residential</option>
                <option value="company">Company</option>
            </select>
            <input name="addr_line_1" placeholder="Address Line 1" value={formData.addr_line_1} onChange={handleChange} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
            <input name="city" placeholder="City" value={formData.city} onChange={handleChange} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
            <input name="state" placeholder="State" value={formData.state} onChange={handleChange} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
            <input name="postcode" placeholder="Postcode" value={formData.postcode} onChange={handleChange} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
            <input name="country" placeholder="Country" value={formData.country} onChange={handleChange} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
            <div className="flex items-center">
                <input id="is_default" name="is_default" type="checkbox" checked={formData.is_default} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Set as default address</label>
            </div>
            <div className="flex space-x-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save Address</button>
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Cancel</button>
            </div>
        </form>
    );
};

export default function CheckoutPage() {
    const router = useRouter();
    const { user, isLoggedIn, authIsLoading, isWalletConnected, connectWallet } = useAuth();
    const { cartItems, cartCount } = useCart();
    const { addresses, createAddress, loading: addressesLoading, error: addressesError } = useAddresses();

    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);

    // Set default address on load
    useEffect(() => {
        const defaultAddress = addresses.find(a => a.is_default);
        if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
        }
    }, [addresses]);

    // Page Guards
    if (authIsLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!isLoggedIn) {
        router.push('/auth');
        return null;
    }
    if (cartItems.length === 0 && !authIsLoading) {
        router.push('/products');
        return null;
    }

    const handleSaveAddress = async (addressData: Omit<Address, 'id' | 'user_id'>) => {
        const newAddress = await createAddress(addressData);
        if (newAddress) {
            setSelectedAddressId(newAddress.id);
            setShowForm(false);
        }
    };

    const handlePlaceOrder = () => {
        if (!selectedAddressId) {
            alert('Please select a shipping address.');
            return;
        }
        alert(`Placing order to address ID: ${selectedAddressId}`);

        console.log({
            userId: user?.id,
            cart: cartItems,
            shippingAddressId: selectedAddressId,
            // billingAddressId: selectedAddressId, // Assuming same for now
        });

        router.push('/orders');
    };

    const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Checkout</h1>
                <div className="grid md:grid-cols-3 gap-8 items-start">
                    <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                        {addressesLoading && <p>Loading addresses...</p>}
                        {addressesError && <p className='text-red-500'>{addressesError}</p>}

                        <div className="space-y-4">
                            {addresses.map((address) => (
                                <div key={address.id} onClick={() => setSelectedAddressId(address.id)}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedAddressId === address.id ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-700'}`}>
                                    <p className="font-semibold">{address.addr_line_1}</p>
                                    <p>{address.city}, {address.state} {address.postcode}</p>
                                </div>
                            ))}
                        </div>

                        {!showForm ? (
                            <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                                + Add New Address
                            </button>
                        ) : (
                            <AddressForm onSave={handleSaveAddress} onCancel={() => setShowForm(false)} />
                        )}
                    </div>
                    <div className="md:col-span-1">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md sticky top-24">
                            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                            <div className="space-y-2 border-b pb-4 mb-4 dark:border-gray-700">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>{item.product.name} (x{item.quantity})</span>
                                        <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between font-semibold">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                            </div>
                            <button onClick={handlePlaceOrder} disabled={!selectedAddressId}
                                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold">
                                Place Order
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
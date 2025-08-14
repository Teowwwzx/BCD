// src/app/checkout/page.tsx
'use client';

import React, { useState } from 'react';
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
    const { isLoggedIn, authIsLoading } = useAuth();
    const { cartItems } = useCart();
    const { addresses, createAddress, deleteAddress, loading: addressesLoading } = useAddresses();

    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);

    if (authIsLoading) return <div>Loading...</div>;
    if (!isLoggedIn) {
        router.push('/auth');
        return null;
    }
    if (cartItems.length === 0 && !authIsLoading) { // Check cart only after auth is loaded
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
        router.push('/orders/success');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Checkout</h1>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                        {addressesLoading && <p>Loading addresses...</p>}
                        <div className="space-y-4">
                            {addresses.map((address) => (
                                <div key={address.id} onClick={() => setSelectedAddressId(address.id)}
                                    className={`p-4 border rounded-lg cursor-pointer bg-white dark:bg-gray-800 ${selectedAddressId === address.id ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-700'}`}>
                                    <p className="font-semibold">{address.addr_line_1}</p>
                                    <p>{address.city}, {address.state} {address.postcode}</p>
                                    <p>{address.country}</p>
                                </div>
                            ))}
                        </div>

                        {!showForm ? (
                            <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded">
                                Add New Address
                            </button>
                        ) : (
                            <div className="mt-4">
                                <AddressForm onSave={handleSaveAddress} onCancel={() => setShowForm(false)} />
                            </div>
                        )}
                    </div>
                    <div className="md:col-span-1">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                            {/* Summary details here */}
                            <button onClick={handlePlaceOrder} disabled={!selectedAddressId}
                                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
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
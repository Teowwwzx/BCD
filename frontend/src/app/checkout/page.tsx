// src/app/checkout/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import { useAddresses } from '../../hooks/useAddresses';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import type { Address } from '../../types';

// A component for the address form
const AddressForm = ({ onSave, onCancel }: { onSave: (address: Omit<Address, 'id' | 'user_id'>) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState({
        address_type: 'shipping' as 'shipping' | 'billing',
        addr_line_1: '',
        city: '',
        state: '',
        postcode: '',
        country: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold">Add New Address</h3>
            <input name="addr_line_1" placeholder="Address Line 1" onChange={handleChange} required className="w-full p-2 border rounded" />
            <input name="city" placeholder="City" onChange={handleChange} required className="w-full p-2 border rounded" />
            <input name="state" placeholder="State" onChange={handleChange} required className="w-full p-2 border rounded" />
            <input name="postcode" placeholder="Postcode" onChange={handleChange} required className="w-full p-2 border rounded" />
            <input name="country" placeholder="Country" onChange={handleChange} required className="w-full p-2 border rounded" />
            <div className="flex space-x-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save Address</button>
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
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

    // Guard clauses for redirection
    if (authIsLoading) return <div>Loading...</div>;
    if (!isLoggedIn) {
        router.push('/auth');
        return null;
    }
    if (cartItems.length === 0) {
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
        // TODO: Implement order creation logic
        alert(`Placing order to address ID: ${selectedAddressId}`);
        router.push('/orders/success'); // Example success page
    };

    return (
        <div className="min-h-screen bg-gray-50">
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
                                    className={`p-4 border rounded-lg cursor-pointer ${selectedAddressId === address.id ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'}`}>
                                    <p className="font-semibold">{address.addr_line_1}</p>
                                    <p>{address.city}, {address.state} {address.postcode}</p>
                                    <p>{address.country}</p>
                                </div>
                            ))}
                        </div>

                        {!showForm ? (
                            <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 bg-gray-200 rounded">
                                Add New Address
                            </button>
                        ) : (
                            <div className="mt-4">
                                <AddressForm onSave={handleSaveAddress} onCancel={() => setShowForm(false)} />
                            </div>
                        )}
                    </div>
                    <div className="md:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-md">
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
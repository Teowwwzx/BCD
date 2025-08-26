'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useAddresses } from '../../hooks/useAddresses';
import { Address, AddressType } from '../../types';
import { ConfirmationModal, SuccessModal } from '../../components/Modal';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Plus, Edit, Trash2, MapPin, Building, Home } from 'lucide-react';

type AddressFormData = Omit<Address, 'id' | 'user_id'>;

export default function AddressPage() {
    const router = useRouter();

    // 1. State Hooks
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
    const [formData, setFormData] = useState<AddressFormData>({
        address_type: AddressType.Shipping,
        location_type: 'residential',
        is_default: false,
        addr_line_1: '',
        addr_line_2: '',
        city: '',
        state: '',
        postcode: '',
        country: ''
    });
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // 2. Context Hooks
    const { user, authIsLoading } = useAuth();
    const {
        addresses,
        loading,
        error,
        createAddress,
        updateAddress,
        setDefaultAddress,
        deleteAddress
    } = useAddresses();

    // 3. Effect Hooks
    useEffect(() => {
        if (!authIsLoading && !user) {
            router.push('/auth');
        }
    }, [authIsLoading, user, router]);

    // 4. Performance Hooks
    const defaultAddress = useMemo(() => {
        return addresses.find(addr => addr.is_default);
    }, [addresses]);

    const shippingAddresses = useMemo(() => {
        return addresses.filter(addr => addr.address_type === AddressType.Shipping);
    }, [addresses]);

    const billingAddresses = useMemo(() => {
        return addresses.filter(addr => addr.address_type === AddressType.Billing);
    }, [addresses]);

    // Form validation
    const validateForm = (): boolean => {
        const errors: { [key: string]: string } = {};

        if (!formData.addr_line_1.trim()) {
            errors.addr_line_1 = 'Address line 1 is required';
        }
        if (!formData.city.trim()) {
            errors.city = 'City is required';
        }
        if (!formData.state.trim()) {
            errors.state = 'State is required';
        }
        if (!formData.postcode.trim()) {
            errors.postcode = 'Postcode is required';
        }
        if (!formData.country.trim()) {
            errors.country = 'Country is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            if (editingAddress) {
                const updated = await updateAddress(editingAddress.id, formData);
                if (updated) {
                    setSuccessMessage('Address updated successfully!');
                    setShowSuccessModal(true);
                    resetForm();
                }
            } else {
                const created = await createAddress(formData);
                if (created) {
                    setSuccessMessage('Address created successfully!');
                    setShowSuccessModal(true);
                    resetForm();
                }
            }
        } catch (err) {
            console.error('Failed to save address:', err);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            address_type: AddressType.Shipping,
            location_type: 'residential',
            is_default: false,
            addr_line_1: '',
            addr_line_2: '',
            city: '',
            state: '',
            postcode: '',
            country: ''
        });
        setFormErrors({});
        setEditingAddress(null);
        setShowAddressForm(false);
    };

    // Handle edit
    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        setFormData({
            address_type: address.address_type,
            location_type: address.location_type,
            is_default: address.is_default,
            addr_line_1: address.addr_line_1,
            addr_line_2: address.addr_line_2 || '',
            city: address.city,
            state: address.state,
            postcode: address.postcode,
            country: address.country
        });
        setShowAddressForm(true);
    };

    // Handle delete
    const handleDeleteClick = (address: Address) => {
        setAddressToDelete(address);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!addressToDelete) return;

        const success = await deleteAddress(addressToDelete.id);
        if (success) {
            setSuccessMessage('Address deleted successfully!');
            setShowSuccessModal(true);
        }
        setShowDeleteModal(false);
        setAddressToDelete(null);
    };

    // Handle set default
    const handleSetDefault = async (addressId: number) => {
        const success = await setDefaultAddress(addressId);
        if (success) {
            setSuccessMessage('Default address updated successfully!');
            setShowSuccessModal(true);
        }
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));

        // Clear error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    if (authIsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Addresses</h1>
                        <p className="text-gray-600 mt-2">Manage your shipping and billing addresses</p>
                    </div>
                    <button
                        onClick={() => setShowAddressForm(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Address
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Address Lists */}
                {!loading && (
                    <div className="space-y-8">
                        {/* Default Address */}
                        {defaultAddress && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <MapPin className="w-5 h-5 text-green-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">Default Address</h2>
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Default</span>
                                </div>
                                <AddressCard
                                    address={defaultAddress}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteClick}
                                    onSetDefault={handleSetDefault}
                                    isDefault={true}
                                />
                            </div>
                        )}

                        {/* Shipping Addresses */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Home className="w-5 h-5 text-blue-600" />
                                <h2 className="text-xl font-semibold text-gray-900">Shipping Addresses</h2>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                    {shippingAddresses.length}
                                </span>
                            </div>
                            {shippingAddresses.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No shipping addresses found</p>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {shippingAddresses.map(address => (
                                        <AddressCard
                                            key={address.id}
                                            address={address}
                                            onEdit={handleEdit}
                                            onDelete={handleDeleteClick}
                                            onSetDefault={handleSetDefault}
                                            isDefault={address.is_default}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Billing Addresses */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Building className="w-5 h-5 text-purple-600" />
                                <h2 className="text-xl font-semibold text-gray-900">Billing Addresses</h2>
                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                    {billingAddresses.length}
                                </span>
                            </div>
                            {billingAddresses.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No billing addresses found</p>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {billingAddresses.map(address => (
                                        <AddressCard
                                            key={address.id}
                                            address={address}
                                            onEdit={handleEdit}
                                            onDelete={handleDeleteClick}
                                            onSetDefault={handleSetDefault}
                                            isDefault={address.is_default}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Address Form Modal */}
                {showAddressForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-xl font-semibold mb-6">
                                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Address Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address Type *
                                        </label>
                                        <select
                                            name="address_type"
                                            value={formData.address_type}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value={AddressType.Shipping}>Shipping</option>
                                            <option value={AddressType.Billing}>Billing</option>
                                        </select>
                                    </div>

                                    {/* Location Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Location Type *
                                        </label>
                                        <select
                                            name="location_type"
                                            value={formData.location_type}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="residential">Residential</option>
                                            <option value="company">Company</option>
                                        </select>
                                    </div>

                                    {/* Address Line 1 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address Line 1 *
                                        </label>
                                        <input
                                            type="text"
                                            name="addr_line_1"
                                            value={formData.addr_line_1}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.addr_line_1 ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Street address, P.O. box, company name"
                                        />
                                        {formErrors.addr_line_1 && (
                                            <p className="text-red-500 text-sm mt-1">{formErrors.addr_line_1}</p>
                                        )}
                                    </div>

                                    {/* Address Line 2 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address Line 2
                                        </label>
                                        <input
                                            type="text"
                                            name="addr_line_2"
                                            value={formData.addr_line_2 || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Apartment, suite, unit, building, floor, etc."
                                        />
                                    </div>

                                    {/* City and State */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                City *
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.city ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            {formErrors.city && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                State *
                                            </label>
                                            <input
                                                type="text"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.state ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            {formErrors.state && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.state}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Postcode and Country */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Postcode *
                                            </label>
                                            <input
                                                type="text"
                                                name="postcode"
                                                value={formData.postcode}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.postcode ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            {formErrors.postcode && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.postcode}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Country *
                                            </label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.country ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            {formErrors.country && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.country}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Set as Default */}
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_default"
                                            checked={formData.is_default}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 block text-sm text-gray-700">
                                            Set as default address
                                        </label>
                                    </div>

                                    {/* Form Actions */}
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                        >
                                            {loading ? 'Saving...' : editingAddress ? 'Update Address' : 'Add Address'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={confirmDelete}
                    title="Delete Address"
                    message={`Are you sure you want to delete this address? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    isDestructive={true}
                />

                {/* Success Modal */}
                <SuccessModal
                    isOpen={showSuccessModal}
                    onClose={() => setShowSuccessModal(false)}
                    title="Success!"
                    message={successMessage}
                    actionText="OK"
                    onAction={() => setShowSuccessModal(false)}
                />
            </main>

            <Footer />
        </div>
    );
}

// Address Card Component
interface AddressCardProps {
    address: Address;
    onEdit: (address: Address) => void;
    onDelete: (address: Address) => void;
    onSetDefault: (addressId: number) => void;
    isDefault: boolean;
}

function AddressCard({ address, onEdit, onDelete, onSetDefault, isDefault }: AddressCardProps) {
    return (
        <div className={`border rounded-lg p-4 ${isDefault ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
            }`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${address.address_type === AddressType.Shipping
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                        }`}>
                        {address.address_type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${address.location_type === 'residential'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-orange-100 text-orange-800'
                        }`}>
                        {address.location_type}
                    </span>
                    {isDefault && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Default
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(address)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit address"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(address)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete address"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium">{address.addr_line_1}</p>
                {address.addr_line_2 && <p>{address.addr_line_2}</p>}
                <p>{address.city}, {address.state} {address.postcode}</p>
                <p>{address.country}</p>
            </div>

            {!isDefault && (
                <button
                    onClick={() => onSetDefault(address.id)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    Set as Default
                </button>
            )}
        </div>
    );
}
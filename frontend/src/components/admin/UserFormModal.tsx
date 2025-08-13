// frontend/src/components/admin/UserFormModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { User, UserRole, UserStatus } from '../../types';
import { UserMutation } from '../../hooks/useAdminUsers';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: UserMutation, userId?: string) => Promise<boolean>; // Return a boolean for success
  currentUser: User | null;
}

export default function UserFormModal({ isOpen, onClose, onSave, currentUser }: UserFormModalProps) {
  const [formData, setFormData] = useState<UserMutation>({});
  const [isSaving, setIsSaving] = useState(false); // 1. Add a loading state for the save action

  const isEditMode = !!currentUser;

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username,
        email: currentUser.email,
        f_name: currentUser.f_name,
        l_name: currentUser.l_name,
        user_role: currentUser.user_role,
        status: currentUser.status,
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        user_role: UserRole.Buyer,
        status: UserStatus.Active,
      });
    }
  }, [currentUser, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // 2. The `onSave` function (createUser/updateUser) now returns a success boolean.
    const success = await onSave(formData, currentUser?.id);

    setIsSaving(false);

    // 3. Only close the modal if the operation was successful.
    // This keeps the form open with the user's data if there was an error.
    if (success) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit User' : 'Add New User'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields */}
        <input name="username" value={formData.username || ''} onChange={handleChange} placeholder="Username" required className="w-full p-2 bg-gray-700 rounded" />
        <input name="email" type="email" value={formData.email || ''} onChange={handleChange} placeholder="Email" required className="w-full p-2 bg-gray-700 rounded" />
        {!isEditMode && <input name="password" type="password" value={formData.password || ''} onChange={handleChange} placeholder="Password" required className="w-full p-2 bg-gray-700 rounded" />}
        <input name="f_name" value={formData.f_name || ''} onChange={handleChange} placeholder="First Name" className="w-full p-2 bg-gray-700 rounded" />
        <input name="l_name" value={formData.l_name || ''} onChange={handleChange} placeholder="Last Name" className="w-full p-2 bg-gray-700 rounded" />

        <select name="user_role" value={formData.user_role} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded">
          {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
        </select>
        <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded">
          {Object.values(UserStatus).map(status => <option key={status} value={status}>{status}</option>)}
        </select>

        <div className="flex justify-end space-x-4 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500">Cancel</button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
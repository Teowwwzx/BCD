'use client';

import React, { useState } from 'react';
import { useUsers, User } from '../../../hooks/useAdminUsers';

const AdminUsersPage = () => {
  const { users, loading, error, createUser, updateUser, deleteUser } = useUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleOpenModal = (user: User | null = null) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleSaveUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (currentUser) {
      updateUser(currentUser.id, userData);
    } else {
      createUser(userData);
    }
    handleCloseModal();
  };

  const handleDeleteUser = (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-purple-400 pixel-font">User Management</h1>

        <div className="flex justify-end mb-4">
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 border-b-4 border-green-700 hover:border-green-500 rounded pixel-button"
          >
            Add New User
          </button>
        </div>

        {loading && <p className="text-center text-lg">Loading users...</p>}
        {error && <p className="text-center text-red-500 text-lg">Error: {error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto bg-gray-800 border-2 border-purple-500 rounded-lg shadow-lg">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-600">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.user_role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-800 text-green-200' : 'bg-yellow-800 text-yellow-200'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(user)} className="text-indigo-400 hover:text-indigo-300 mr-4">Edit</button>
                      <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-400">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <UserModal 
          user={currentUser} 
          onClose={handleCloseModal} 
          onSave={handleSaveUser} 
        />
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font {
          font-family: "Press Start 2P", cursive, monospace;
        }
        .pixel-button {
            box-shadow: 0 4px #0004;
            transform: translateY(0);
            transition: all 0.1s ease-in-out;
        }
        .pixel-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px #0006;
        }
        .pixel-button:active {
            transform: translateY(2px);
            box-shadow: 0 2px #0002;
        }
      `}</style>
    </div>
  );
};

const UserModal = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        password: '',
        f_name: user?.f_name || '',
        l_name: user?.l_name || '',
        user_role: user?.user_role || 'buyer',
        status: user?.status || 'pending_verification',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = { ...formData };
        if (!dataToSave.password) {
            delete dataToSave.password;
        }
        onSave(dataToSave);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 font-mono">
            <div className="bg-gray-800 rounded-lg border-2 border-purple-500 p-8 w-full max-w-md shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-purple-400 pixel-font">{user ? 'Edit User' : 'Add User'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4">
                        <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" className="bg-gray-900 border-2 border-gray-700 rounded p-2 focus:border-purple-500 focus:outline-none" required />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="bg-gray-900 border-2 border-gray-700 rounded p-2 focus:border-purple-500 focus:outline-none" required />
                        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={user ? "New Password (optional)" : "Password"} className="bg-gray-900 border-2 border-gray-700 rounded p-2 focus:border-purple-500 focus:outline-none" />
                        <input type="text" name="f_name" value={formData.f_name} onChange={handleChange} placeholder="First Name" className="bg-gray-900 border-2 border-gray-700 rounded p-2 focus:border-purple-500 focus:outline-none" />
                        <input type="text" name="l_name" value={formData.l_name} onChange={handleChange} placeholder="Last Name" className="bg-gray-900 border-2 border-gray-700 rounded p-2 focus:border-purple-500 focus:outline-none" />
                        <select name="user_role" value={formData.user_role} onChange={handleChange} className="bg-gray-900 border-2 border-gray-700 rounded p-2 focus:border-purple-500 focus:outline-none">
                            <option value="buyer">Buyer</option>
                            <option value="seller">Seller</option>
                            <option value="admin">Admin</option>
                        </select>
                        <select name="status" value={formData.status} onChange={handleChange} className="bg-gray-900 border-2 border-gray-700 rounded p-2 focus:border-purple-500 focus:outline-none">
                            <option value="pending_verification">Pending</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="deactivated">Deactivated</option>
                        </select>
                    </div>
                    <div className="flex justify-end mt-6 space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 border-b-4 border-gray-800 hover:border-gray-600 rounded pixel-button">Cancel</button>
                        <button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 border-b-4 border-purple-700 hover:border-purple-500 rounded pixel-button">{user ? 'Save Changes' : 'Create User'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminUsersPage;
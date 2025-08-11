// frontend/src/contexts/ModalContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Modal from '../components/Modal'; // We will use our existing Modal component

interface ModalOptions {
  title: string;
  message: React.ReactNode; // Can be a string or JSX
  onConfirm: () => void;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger';
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null);

  const showModal = (options: ModalOptions) => {
    setModalOptions(options);
  };

  const handleClose = () => {
    setModalOptions(null);
  };

  const handleConfirm = () => {
    if (modalOptions) {
      modalOptions.onConfirm();
      handleClose();
    }
  };
  
  const confirmButtonClass = modalOptions?.confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700';

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
      <Modal 
        isOpen={!!modalOptions} 
        onClose={handleClose} 
        title={modalOptions?.title || ''}
      >
        {modalOptions && (
          <div>
            <div className="text-gray-300 mb-6">{modalOptions.message}</div>
            <div className="flex justify-end space-x-4">
              <button onClick={handleClose} className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-500">
                Cancel
              </button>
              <button onClick={handleConfirm} className={`px-4 py-2 rounded text-white ${confirmButtonClass}`}>
                {modalOptions.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </ModalContext.Provider>
  );
};
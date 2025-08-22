// frontend/src/contexts/ToastContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // You may need to install this: npm install uuid @types/uuid

export interface Toast {
    id: string;
    title?: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, type: Toast['type'], title?: string) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToasts = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToasts must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(current => current.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: Toast['type'], title?: string) => {

        const id = uuidv4();
        setToasts(current => [...current, { id, message, type, title }]);

        setTimeout(() => removeToast(id), 3000);
    }, [removeToast]);

    const value = { toasts, addToast, removeToast };

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};
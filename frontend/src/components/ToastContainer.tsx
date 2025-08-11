// frontend/src/components/ToastContainer.tsx
'use client';

import React from 'react';
import { useToasts, Toast } from '../contexts/ToastContext';

// Icon components for visual feedback
const SuccessIcon = () => (
    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ErrorIcon = () => (
    <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const InfoIcon = () => (
    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// The Toast Card component
const ToastCard = React.forwardRef<HTMLDivElement, { toast: Toast; onRemove: (id: string) => void }>(
    ({ toast, onRemove }, ref) => {
        const icons = { success: <SuccessIcon />, error: <ErrorIcon />, info: <InfoIcon /> };
        const progressColors = { success: 'bg-green-400', error: 'bg-red-400', info: 'bg-blue-400' };

        return (
            <div
                ref={ref} // Attach the forwarded ref here
                className="toast-enter bg-[#0d0221] border border-gray-700 rounded-lg shadow-lg max-w-sm w-full overflow-hidden"
            >
                <div className="p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">{icons[toast.type]}</div>
                        <div className="ml-3 w-0 flex-1">
                            {toast.title && <p className="text-sm font-bold text-white font-pixel">{toast.title}</p>}
                            <p className="mt-1 text-sm text-gray-300 font-mono-pixel">{toast.message}</p>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                            <button
                                onClick={() => onRemove(toast.id)}
                                className="inline-flex text-gray-400 hover:text-white"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                </div>
                <div className={`h-1 ${progressColors[toast.type]} toast-progress`}></div>
            </div>
        );
    }
);
ToastCard.displayName = 'ToastCard';


// The container that manages rendering all active toasts
export default function ToastContainer() {
    const { toasts, removeToast } = useToasts();

    // --- 2. THE BUG FIX: Use `toasts.length` instead of `notifications.length` ---
    if (toasts.length === 0) {
        return null;
    }

    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 z-50"
        >
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map((toast) => (
                    <ToastCard key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </div>
    );
}
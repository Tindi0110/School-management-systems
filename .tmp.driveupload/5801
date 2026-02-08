import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';
import type { ToastType, ToastMessage } from '../types/toast';

interface ToastOptions {
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
    success: (message: string, options?: ToastOptions) => void;
    error: (message: string, options?: ToastOptions) => void;
    info: (message: string, options?: ToastOptions) => void;
    warning: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', options?: ToastOptions) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        if (type !== 'loading') {
            setTimeout(() => {
                removeToast(id);
            }, options?.duration || 3000);
        }
    }, [removeToast]);

    const success = useCallback((msg: string, opts?: ToastOptions) => showToast(msg, 'success', opts), [showToast]);
    const error = useCallback((msg: string, opts?: ToastOptions) => showToast(msg, 'error', opts), [showToast]);
    const info = useCallback((msg: string, opts?: ToastOptions) => showToast(msg, 'info', opts), [showToast]);
    const warning = useCallback((msg: string, opts?: ToastOptions) => showToast(msg, 'warning', opts), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
            {children}
            <div className="fixed top-4 right-4 flex flex-col gap-2 pointer-events-none" style={{ zIndex: 2147483647 }}>
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

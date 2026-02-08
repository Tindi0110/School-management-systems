import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

interface ConfirmOptions {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
    confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<{
        isOpen: boolean;
        message: string;
        options: ConfirmOptions;
    }>({
        isOpen: false,
        message: '',
        options: {}
    });

    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((message: string, options: ConfirmOptions = {}) => {
        setState({
            isOpen: true,
            message,
            options: {
                title: options.title || 'Confirm Action',
                confirmLabel: options.confirmLabel || 'Confirm',
                cancelLabel: options.cancelLabel || 'Cancel',
                type: options.type || 'info'
            }
        });

        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setState((prev) => ({ ...prev, isOpen: false }));
        if (resolveRef.current) {
            resolveRef.current(true);
            resolveRef.current = null;
        }
    }, []);

    const handleCancel = useCallback(() => {
        setState((prev) => ({ ...prev, isOpen: false }));
        if (resolveRef.current) {
            resolveRef.current(false);
            resolveRef.current = null;
        }
    }, []);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <ConfirmDialog
                isOpen={state.isOpen}
                title={state.options.title || 'Confirm Action'}
                message={state.message}
                confirmLabel={state.options.confirmLabel}
                cancelLabel={state.options.cancelLabel}
                type={state.options.type}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (context === undefined) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};

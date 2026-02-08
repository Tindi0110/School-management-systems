import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import Button from './common/Button';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    type = 'info',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: {
            text: 'text-red-600',
            bg: 'bg-red-50',
            icon: 'text-red-500',
            btn: 'danger' as const
        },
        warning: {
            text: 'text-amber-600',
            bg: 'bg-amber-50',
            icon: 'text-amber-500',
            btn: 'primary' as const
        },
        info: {
            text: 'text-blue-600',
            bg: 'bg-blue-50',
            icon: 'text-blue-500',
            btn: 'primary' as const
        }
    };

    const style = colors[type];

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div
                className="modal max-w-md w-full animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 flex gap-4">
                    <div className={`shrink-0 w-12 h-12 rounded-full ${style.bg} flex items-center justify-center`}>
                        <AlertCircle className={style.icon} size={24} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>
                <div className="modal-footer bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                    <button
                        className="btn btn-secondary text-sm"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                    <Button
                        variant={style.btn}
                        className="text-sm px-6"
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;

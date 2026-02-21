import React from 'react';
import { AlertCircle } from 'lucide-react';
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
                        <h3 className={`text-xl font-black uppercase tracking-tight ${type === 'danger' ? 'text-red-700' : 'text-slate-900'}`}>{title}</h3>
                        <div className="mt-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <p className={`text-sm leading-relaxed font-bold ${type === 'danger' ? 'text-red-600' : 'text-slate-600'}`}>
                                {message}
                            </p>
                        </div>
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

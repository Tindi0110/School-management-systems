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
                className="modal-container max-w-sm w-full animate-scaleIn overflow-hidden !rounded-[2rem] shadow-2xl p-0 border-none"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-white p-8">
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-3xl ${style.bg} flex items-center justify-center mb-6`}>
                            <AlertCircle className={style.icon} size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3 px-4">{title}</h3>
                        <p className="text-sm font-bold text-slate-500 leading-relaxed px-2">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="flex border-t border-slate-100 h-14">
                    <button
                        className="flex-1 text-xs font-black uppercase text-slate-400 hover:bg-slate-50 transition-colors border-r border-slate-100"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        className={`flex-1 text-xs font-black uppercase transition-colors hover:bg-slate-50 ${type === 'danger' ? 'text-red-600' : 'text-primary'}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;

import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
    };

    return (
        <div
            className="modal-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                backdropFilter: 'blur(4px)',
                pointerEvents: 'auto'
            }}
            onClick={onClose}
        >
            <div
                className={`modal w-full ${sizeClasses[size]}`}
                style={{
                    backgroundColor: 'white', // var(--bg-primary)
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // var(--shadow-xl)
                    borderRadius: '0.5rem', // var(--radius-lg)
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 100000,
                    pointerEvents: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3 className="modal-title text-lg font-bold text-primary">{title}</h3>
                    <button
                        onClick={onClose}
                        className="btn-ghost rounded-full p-1 hover:bg-red-50 hover:text-red-500 transition-colors"
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;

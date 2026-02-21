import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-7xl',
        full: 'w-[98vw] h-[95vh] m-2'
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal-container w-full ${sizeClasses[size]} ${size === 'full' ? 'h-[95vh] m-2' : 'max-h-[90vh]'}`}
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

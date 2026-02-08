import React, { useState } from 'react';
import type { ToastType } from '../types/toast';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    // Auto-dismiss logic is handled by the Context, 
    // but the component handles its own exit animation state.

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300); // Wait for transition
    };

    const styles = {
        success: { bg: 'bg-white', border: 'border-l-4 border-l-green-500', icon: '✅' },
        error: { bg: 'bg-white', border: 'border-l-4 border-l-red-500', icon: '❌' },
        warning: { bg: 'bg-white', border: 'border-l-4 border-l-yellow-500', icon: '⚠️' },
        info: { bg: 'bg-white', border: 'border-l-4 border-l-blue-500', icon: 'ℹ️' },
        loading: { bg: 'bg-white', border: 'border-l-4 border-l-gray-400', icon: '⏳' }
    };

    const style = styles[type] || styles.info;

    return (
        <div
            className={`
                pointer-events-auto 
                min-w-[300px] max-w-md 
                p-4 rounded-md shadow-lg 
                flex items-start gap-3 
                ${style.bg} ${style.border} 
                border border-gray-100
                transition-all duration-300 ease-in-out
                ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
            `}
            role="alert"
        >
            <div className="mt-0.5 shrink-0 text-lg">{style.icon}</div>
            <div className="flex-1 text-sm font-medium text-gray-700 leading-snug break-words">
                {message}
            </div>
            <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 font-bold ml-2"
            >
                ✕
            </button>
        </div>
    );
};

export default Toast;

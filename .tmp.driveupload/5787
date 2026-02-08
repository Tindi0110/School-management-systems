import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    loadingText?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    children,
    loading = false,
    loadingText,
    variant = 'primary',
    size = 'md',
    icon,
    className = '',
    disabled,
    ...props
}) => {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        outline: 'btn-outline',
        danger: 'bg-red-600 text-white hover:bg-red-700 border-red-700',
        ghost: 'btn-ghost'
    };

    const sizes = {
        sm: 'btn-sm',
        md: '',
        lg: 'px-8 py-3 text-lg'
    };

    const variantClass = variants[variant] || variants.primary;
    const sizeClass = sizes[size] || sizes.md;

    return (
        <button
            className={`btn ${variantClass} ${sizeClass} ${className} flex items-center justify-center gap-2`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />
                    <span>{loadingText || children}</span>
                </>
            ) : (
                <>
                    {icon && <span className="shrink-0">{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;

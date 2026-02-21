import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = true }) => {
    return (
        <div className={`card ${hover ? 'hover:shadow-lg hover:-translate-y-1' : ''} ${className}`}>
            {children}
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    gradient?: string;
    onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradient, onClick }) => {
    // If a gradient is provided, we use it, otherwise fallback to primary
    const backgroundStyle = gradient || 'var(--primary)';

    return (
        <div
            className={`card flex flex-row items-center gap-6 p-6 transition-all border-none ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
            style={{
                background: backgroundStyle,
                color: 'white'
            }}
            onClick={onClick}
        >
            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                {icon && React.cloneElement(icon as React.ReactElement<any>, { size: 28, strokeWidth: 2.5 })}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{title}</p>
                <div className="text-3xl font-black tracking-tight">{value}</div>
            </div>
        </div>
    );
};

export default Card;

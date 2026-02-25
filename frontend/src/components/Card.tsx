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
    return (
        <div
            className={`stat-card transition-all ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
            style={{ '--stat-bg': gradient } as React.CSSProperties}
            onClick={onClick}
        >
            <div className="stat-icon-wrapper">
                {icon && React.cloneElement(icon as React.ReactElement<any>, { size: 22, strokeWidth: 2.5 })}
            </div>
            <div>
                <p style={{ color: 'white', opacity: 0.9 }} className="text-[10px] font-black uppercase tracking-[0.15em] mb-0.5">{title}</p>
                <div style={{ color: 'white' }} className="text-2xl font-black tracking-tight">{value}</div>
            </div>
        </div>
    );
};


export default Card;

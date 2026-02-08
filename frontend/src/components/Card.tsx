import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = true }) => {
    return (
        <div className={`card ${hover ? '' : 'no-hover'} ${className}`}>
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
    const gradientStyle = gradient || 'var(--primary)';

    return (
        <div
            className={`stat-card ${onClick ? 'cursor-pointer' : ''}`}
            style={{ background: gradientStyle }}
            onClick={onClick}
        >
            <div className="flex items-center gap-4">
                {icon && <div className="p-3 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">{icon}</div>}
                <div>
                    <div className="stat-value text-xl mb-0">{value}</div>
                    <div className="stat-label text-[10px] opacity-80 font-bold">{title}</div>
                </div>
            </div>
        </div>
    );
};

export default Card;

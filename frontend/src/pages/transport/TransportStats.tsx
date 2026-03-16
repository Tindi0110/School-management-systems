import React from 'react';
import { Bus, Navigation, Users, Droplet } from 'lucide-react';
import { StatCard } from '../../components/Card';
import Skeleton from '../../components/common/Skeleton';

interface TransportStatsProps {
    stats: {
        totalFleet: number;
        activeRoutes: number;
        totalEnrolled: number;
        fuelCostTerm: number;
    };
    loading: boolean;
}

const TransportStats: React.FC<TransportStatsProps> = ({ stats, loading }) => {
    return (
        <div className="grid grid-cols-2 gap-6 lg:gap-8 mb-8">
            <div className="min-w-0">
                <StatCard 
                    title="FLEET SIZE" 
                    value={loading ? <Skeleton variant="text" width="40px" height="32px" /> : stats.totalFleet} 
                    icon={<Bus size={18} />} 
                    gradient="linear-gradient(135deg, #0f172a, #1e293b)" 
                />
            </div>
            <div className="min-w-0">
                <StatCard 
                    title="ACTIVE ROUTES" 
                    value={loading ? <Skeleton variant="text" width="40px" height="32px" /> : stats.activeRoutes} 
                    icon={<Navigation size={18} />} 
                    gradient="linear-gradient(135deg, #4facfe, #00f2fe)" 
                />
            </div>
            <div className="min-w-0">
                <StatCard 
                    title="ENROLLMENTS" 
                    value={loading ? <Skeleton variant="text" width="40px" height="32px" /> : stats.totalEnrolled} 
                    icon={<Users size={18} />} 
                    gradient="linear-gradient(135deg, #667eea, #764ba2)" 
                />
            </div>
            <div className="min-w-0">
                <StatCard 
                    title="FUEL (TERM)" 
                    value={loading ? <Skeleton variant="text" width="80px" height="32px" /> : `KSh ${stats.fuelCostTerm.toLocaleString()}`} 
                    icon={<Droplet size={18} />} 
                    gradient="linear-gradient(135deg, #be123c, #fb7185)" 
                />
            </div>
        </div>
    );
};

export default TransportStats;

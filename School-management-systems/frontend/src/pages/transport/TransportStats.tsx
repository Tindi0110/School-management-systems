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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
                title="FLEET SIZE" 
                value={loading ? <Skeleton variant="text" width="40px" height="32px" /> : stats.totalFleet} 
                icon={<Bus className="text-white" />} 
                gradient="linear-gradient(135deg, #1e293b, #334155)" 
            />
            <StatCard 
                title="ACTIVE ROUTES" 
                value={loading ? <Skeleton variant="text" width="40px" height="32px" /> : stats.activeRoutes} 
                icon={<Navigation className="text-white" />} 
                gradient="linear-gradient(135deg, #0ea5e9, #0284c7)" 
            />
            <StatCard 
                title="ENROLLMENTS" 
                value={loading ? <Skeleton variant="text" width="40px" height="32px" /> : stats.totalEnrolled} 
                icon={<Users className="text-white" />} 
                gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" 
            />
            <StatCard 
                title="FUEL (TERM)" 
                value={loading ? <Skeleton variant="text" width="80px" height="32px" /> : `KSh ${stats.fuelCostTerm.toLocaleString()}`} 
                icon={<Droplet className="text-white" />} 
                gradient="linear-gradient(135deg, #f43f5e, #e11d48)" 
            />
        </div>
    );
};

export default TransportStats;

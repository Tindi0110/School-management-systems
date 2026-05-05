import React from 'react';
import { Building, Users, Layout, Wrench } from 'lucide-react';
import { StatCard } from '../../components/Card';

interface HostelDashboardProps {
    stats: {
        totalHostels: number;
        totalCapacity: number;
        totalResidents: number;
        maintenanceIssues: number;
    };
}

const HostelDashboard: React.FC<HostelDashboardProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-2 gap-md mb-8">
            <StatCard title="Hostels" value={stats.totalHostels} icon={<Building />} gradient="linear-gradient(135deg, #0f172a, #1e293b)" />
            <StatCard title="Residents" value={stats.totalResidents} icon={<Users />} gradient="linear-gradient(135deg, #10b981, #059669)" />
            <StatCard title="Occupancy" value={`${Math.round((stats.totalResidents / (stats.totalCapacity || 1)) * 100)}%`} icon={<Layout />} gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
            <StatCard title="Maintenance" value={stats.maintenanceIssues} icon={<Wrench />} gradient="linear-gradient(135deg, #ef4444, #dc2626)" />
        </div>
    );
};

export default HostelDashboard;

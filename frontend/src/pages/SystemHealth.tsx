import { useEffect, useState } from 'react';
import { ShieldCheck, Activity, Database, Server, Smartphone, Globe, RefreshCcw, Clock } from 'lucide-react';
import { auditAPI } from '../api/api';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/Card';

const SystemHealth = () => {
    const { error } = useToast();
    const [healthData, setHealthData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [browserInfo, setBrowserInfo] = useState<any>(null);

    useEffect(() => {
        fetchHealth();
        setBrowserInfo({
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: (navigator as any).platform,
            online: navigator.onLine,
            resolution: `${window.screen.width}x${window.screen.height}`
        });
    }, []);

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const res = await auditAPI.health.get();
            setHealthData(res.data);
        } catch (err: any) {
            console.error(err);
            error("Failed to fetch system health status");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'healthy':
            case 'up':
            case 'connected':
                return 'text-success';
            case 'degraded':
            case 'warning':
                return 'text-warning';
            case 'error':
            case 'down':
                return 'text-error';
            default:
                return 'text-secondary';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'healthy':
            case 'up':
            case 'connected':
                return 'bg-success/10 border-success';
            case 'degraded':
            case 'warning':
                return 'bg-warning/10 border-warning';
            case 'error':
            case 'down':
                return 'bg-error/10 border-error';
            default:
                return 'bg-secondary/10 border-secondary';
        }
    };

    if (loading && !healthData) return <div className="spinner-container"><div className="spinner"></div></div>;

    return (
        <div className="fade-in px-4 pb-10">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-secondary text-white p-8 mb-8 shadow-2xl">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={16} className="text-info-light" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Infrastructure Monitor</span>
                        </div>
                        <h1 className="text-3xl font-black mb-1">System Integrity Dashboard</h1>
                        <p className="text-sm opacity-70">Real-time status of your school management infrastructure</p>
                    </div>
                    <button
                        onClick={fetchHealth}
                        disabled={loading}
                        className="btn bg-white/10 hover:bg-white/20 border-white/20 text-white flex items-center gap-2"
                    >
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh Status
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-8">
                {/* Overall Status */}
                <StatCard
                    title="Overall State"
                    value={healthData?.status || 'Unknown'}
                    icon={<Activity />}
                    gradient={healthData?.status?.toUpperCase() === 'HEALTHY' ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #f59e0b, #d97706)"}
                />

                {/* Server Time */}
                <StatCard
                    title="Server Time"
                    value={healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : '--:--:--'}
                    icon={<Clock />}
                    gradient="linear-gradient(135deg, #3b82f6, #2563eb)"
                />

                {/* Environment */}
                <StatCard
                    title="Environment"
                    value={healthData?.services?.backend?.environment || 'PROD'}
                    icon={<Globe />}
                    gradient="linear-gradient(135deg, #6366f1, #4f46e5)"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Services Status */}
                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                        <Server size={16} /> Backend Services
                    </h3>
                    <div className="card table-wrapper">
                        <table className="table w-full text-left">
                            <thead className="bg-secondary-light">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-secondary">Service</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-secondary">Endpoint</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-secondary text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-light">
                                <tr>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded bg-primary/10 text-primary"><Server size={14} /></div>
                                            <span className="text-sm font-bold">API Server (Python/Django)</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] font-mono text-secondary">/api/audit/status/</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${getStatusBg(healthData?.services?.backend?.status)} ${getStatusColor(healthData?.services?.backend?.status)}`}>
                                            {healthData?.services?.backend?.status || 'UP'}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded bg-info/10 text-info"><Database size={14} /></div>
                                            <span className="text-sm font-bold">Supabase PostgreSQL</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] font-mono text-secondary">Port 6543 (Pooler)</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${getStatusBg(healthData?.services?.database?.status)} ${getStatusColor(healthData?.services?.database?.status)}`}>
                                            {healthData?.services?.database?.status || 'Connected'}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Frontend Health */}
                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                        <Smartphone size={16} /> Client Environment
                    </h3>
                    <div className="card">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-secondary-light">
                                <span className="text-[10px] font-black uppercase text-secondary">Browser</span>
                                <span className="text-xs font-bold">{browserInfo?.userAgent.split(' ').pop()}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-secondary-light">
                                <span className="text-[10px] font-black uppercase text-secondary">Platform</span>
                                <span className="text-xs font-bold">{browserInfo?.platform}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-secondary-light">
                                <span className="text-[10px] font-black uppercase text-secondary">Network State</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${browserInfo?.online ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                    {browserInfo?.online ? 'ONLINE' : 'OFFLINE'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-secondary">Screen Resolution</span>
                                <span className="text-xs font-bold">{browserInfo?.resolution}</span>
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-secondary-light rounded-2xl">
                            <p className="text-[9px] text-secondary leading-relaxed break-all font-mono">
                                <strong>User Agent:</strong> {browserInfo?.userAgent}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemHealth;

import React from 'react';
import { CreditCard, FileText, TrendingUp, CheckCircle } from 'lucide-react';
import { StatCard } from '../../components/Card';
import Button from '../../components/common/Button';

interface FinanceDashboardProps {
    stats: any;
    invoices: any[];
    recentPayments: any[];
    statsContext: any;
    isAllTime: boolean;
    setIsAllTime: (val: boolean) => void;
    formatDate: (date: string) => string;
    setSelectedInvoice: (inv: any) => void;
}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
    stats,
    invoices,
    recentPayments,
    statsContext,
    isAllTime,
    setIsAllTime,
    formatDate,
    setSelectedInvoice
}) => {
    return (
        <div className="space-y-20">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isAllTime ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} `}>
                        {isAllTime ? '🌐 Global History' : `📅 ${statsContext?.term_name || 'Active Term'} ${statsContext?.year || ''} `}
                    </span>
                    {!isAllTime && <p className="text-[10px] text-gray-400 font-bold uppercase italic border-l pl-3">Performance Optimized</p>}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] uppercase font-black tracking-widest"
                    onClick={() => setIsAllTime(!isAllTime)}
                >
                    {isAllTime ? 'Switch to Active Term' : 'View All Time Stats'}
                </Button>
            </div>

            {/* Financial Performance */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Financial Performance</h2>
                </div>
                <div className="grid grid-cols-2 gap-6 lg:gap-8">
                    <StatCard title="Total Invoiced" value={`KES ${stats.totalInvoiced.toLocaleString()} `} icon={<FileText size={18} />} gradient="linear-gradient(135deg, #0f172a, #334155)" />
                    <StatCard title="Total Collected" value={`KES ${stats.totalCollected.toLocaleString()} `} icon={<CheckCircle size={18} />} gradient="linear-gradient(135deg, #059669, #10b981)" />
                    <StatCard title="Outstanding" value={`KES ${stats.totalOutstanding.toLocaleString()} `} icon={<CreditCard size={18} />} gradient="linear-gradient(135deg, #e11d48, #fb7185)" />
                    <StatCard title="Daily Collection" value={`KES ${stats.dailyCollection.toLocaleString()} `} icon={<TrendingUp size={18} />} gradient="linear-gradient(135deg, #7c3aed, #a78bfa)" />
                </div>
            </div>

            {/* Operational Metrics */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-1 h-4 bg-primary/40 rounded-full" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Operational Metrics</h2>
                </div>
                <div className="grid grid-cols-2 gap-6 lg:gap-8">
                    <StatCard title="Enrolled Students" value={stats.enrolledStudents.toLocaleString()} icon={<TrendingUp size={18} />} gradient="linear-gradient(135deg, #0891b2, #22d3ee)" />
                    <StatCard title="Total Capacity" value={stats.totalCapacity.toLocaleString()} icon={<CheckCircle size={18} />} gradient="linear-gradient(135deg, #4f46e5, #818cf8)" />
                    <StatCard title="Revenue / Seat" value={`KES ${stats.revenuePerSeat.toLocaleString()} `} icon={<CreditCard size={18} />} gradient="linear-gradient(135deg, #d97706, #fbbf24)" />
                    <StatCard title="Collection Rate" value={`${stats.collectionRate}% `} icon={<FileText size={18} />} gradient="linear-gradient(135deg, #059669, #10b981)" />
                </div>
            </div>

            {/* Recent Activity — Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Invoices */}
                <div className="card shadow-sm border border-slate-200">
                    <h3 className="text-sm font-black mb-4 uppercase tracking-wider text-slate-700">📄 Recent Invoices</h3>
                    <div className="table-wrapper">
                        <table className="table min-w-[400px]">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center py-8 text-slate-400 italic text-xs">No recent invoices</td></tr>
                                ) : (
                                    invoices.slice(0, 5).map((inv: any) => (
                                        <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs">{inv.student_name}</span>
                                                    <span className="text-[10px] text-slate-400">#INV-{inv.id} · {formatDate(inv.date_generated)}</span>
                                                </div>
                                            </td>
                                            <td className={`font-black text-sm ${Number(inv.balance) === 0 ? 'text-success' : Number(inv.balance) < 0 ? 'text-info' : 'text-error'}`}>
                                                KES {Number(inv.balance).toLocaleString()}
                                            </td>
                                            <td>
                                                <span className={`badge badge-xs ${
                                                    inv.status === 'PAID' ? 'badge-success' :
                                                    inv.status === 'OVERPAID' ? 'badge-info' :
                                                    inv.status === 'PARTIAL' ? 'badge-warning' : 'badge-error'
                                                }`}>{inv.status}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Payments */}
                <div className="card shadow-sm border border-slate-200">
                    <h3 className="text-sm font-black mb-4 uppercase tracking-wider text-slate-700">💳 Recent Payments</h3>
                    <div className="table-wrapper">
                        <table className="table min-w-[400px]">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(recentPayments || []).length === 0 ? (
                                    <tr><td colSpan={3} className="text-center py-8 text-slate-400 italic text-xs">No recent payments</td></tr>
                                ) : (
                                    recentPayments.slice(0, 5).map((p: any) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs">{p.student_name}</span>
                                                    <span className="text-[10px] text-slate-400">{p.method}{p.reference_number ? ` · ${p.reference_number}` : ''}</span>
                                                </div>
                                            </td>
                                            <td className="font-black text-sm text-success">
                                                KES {Number(p.amount).toLocaleString()}
                                            </td>
                                            <td className="text-xs text-slate-500">{formatDate(p.date_received)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceDashboard;

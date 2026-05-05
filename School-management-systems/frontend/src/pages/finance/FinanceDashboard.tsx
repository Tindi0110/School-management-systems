import React from 'react';
import { CreditCard, FileText, TrendingUp, CheckCircle } from 'lucide-react';
import { StatCard } from '../../components/Card';
import Button from '../../components/common/Button';

interface FinanceDashboardProps {
    stats: any;
    invoices: any[];
    statsContext: any;
    isAllTime: boolean;
    setIsAllTime: (val: boolean) => void;
    formatDate: (date: string) => string;
    setSelectedInvoice: (inv: any) => void;
    selectedInvoices: Set<number>;
    toggleInvoiceSelection: (id: number) => void;
    setSelectedInvoices: React.Dispatch<React.SetStateAction<Set<number>>>;
}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
    stats,
    invoices,
    statsContext,
    isAllTime,
    setIsAllTime,
    formatDate,
    setSelectedInvoice,
    selectedInvoices,
    toggleInvoiceSelection,
    setSelectedInvoices
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Invoiced" value={`KES ${stats.totalInvoiced.toLocaleString()} `} icon={<FileText size={18} />} gradient="linear-gradient(135deg, #3b82f6, #2563eb)" />
                <StatCard title="Total Collected" value={`KES ${stats.totalCollected.toLocaleString()} `} icon={<CheckCircle size={18} />} gradient="linear-gradient(135deg, #10b981, #059669)" />
                <StatCard title="Outstanding" value={`KES ${stats.totalOutstanding.toLocaleString()} `} icon={<CreditCard size={18} />} gradient="linear-gradient(135deg, #ef4444, #dc2626)" />
                <StatCard title="Daily Collection" value={`KES ${stats.dailyCollection.toLocaleString()} `} icon={<TrendingUp size={18} />} gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Enrolled Students" value={stats.enrolledStudents.toLocaleString()} icon={<TrendingUp size={18} />} gradient="linear-gradient(135deg, #06b6d4, #0891b2)" />
                <StatCard title="Total Capacity" value={stats.totalCapacity.toLocaleString()} icon={<CheckCircle size={18} />} gradient="linear-gradient(135deg, #6366f1, #4f46e5)" />
                <StatCard title="Revenue / Seat" value={`KES ${stats.revenuePerSeat.toLocaleString()} `} icon={<CreditCard size={18} />} gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
                <StatCard title="Collection Rate" value={`${stats.collectionRate}% `} icon={<FileText size={18} />} gradient="linear-gradient(135deg, #10b981, #059669)" />
            </div>

            <div className="card shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold mb-4">Recent Invoices</h3>
                <div className="table-wrapper">
                    <table className="table min-w-[800px]">
                        <thead>
                            <tr>
                                <th className="w-10">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-xs"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                const outstanding = invoices.filter(i => Number(i.balance) > 0).map(i => i.id);
                                                setSelectedInvoices(new Set(outstanding));
                                            } else {
                                                setSelectedInvoices(new Set());
                                            }
                                        }}
                                        checked={selectedInvoices.size > 0 && selectedInvoices.size === invoices.filter(i => Number(i.balance) > 0).length}
                                    />
                                </th>
                                <th>Reference</th>
                                <th>Student</th>
                                <th>Total</th>
                                <th>Balance</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-400 italic">No recent invoices found</td></tr>
                            ) : (
                                invoices.slice(0, 5).map((inv: any) => (
                                    <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={(e) => {
                                        if ((e.target as HTMLElement).tagName === 'INPUT') return;
                                        setSelectedInvoice(inv);
                                    }}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-xs"
                                                checked={selectedInvoices.has(inv.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    toggleInvoiceSelection(inv.id);
                                                }}
                                                disabled={Number(inv.balance) <= 0}
                                            />
                                        </td>
                                        <td className="font-bold">#INV-{inv.id}</td>
                                        <td>{inv.student_name}</td>
                                        <td>KES {Number(inv.total_amount).toLocaleString()}</td>
                                        <td className={`font-bold ${Number(inv.balance) === 0 ? 'text-success' : Number(inv.balance) < 0 ? 'text-info' : 'text-error'}`}>KES {Number(inv.balance).toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : inv.status === 'OVERPAID' ? 'badge-info text-white' : inv.status === 'PARTIAL' ? 'badge-warning' : 'badge-error'}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="text-xs text-gray-500">{formatDate(inv.date_generated)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinanceDashboard;

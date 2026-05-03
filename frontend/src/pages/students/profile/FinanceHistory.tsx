import React from 'react';
import { CreditCard, TrendingUp, ShieldCheck, Printer } from 'lucide-react';
import Button from '../../../components/common/Button';
import type { Student } from '../../../types/student.types';

interface FinanceHistoryProps {
    student: Student;
    invoices: any[];
    payments: any[];
    statement: any[];
    onPrintStatement: () => void;
}

const FinanceHistory: React.FC<FinanceHistoryProps> = ({
    student, invoices, payments, statement, onPrintStatement
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Modern Financial Dashboard */}
            <div className="grid grid-cols-2 gap-6 no-print min-w-0">
                <div className="md:col-span-2 card flex flex-row items-center gap-6 p-6 transition-all hover-scale border-left-4 border-error">
                    <div className="p-4 rounded-2xl bg-error/10 text-error shrink-0">
                        <CreditCard size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Fee Liability</p>
                        <h3 className="text-3xl font-black text-primary m-0 leading-tight">KES {(student.fee_balance || 0).toLocaleString()}</h3>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${Number(student.fee_balance || 0) <= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                {Number(student.fee_balance || 0) <= 0 ? 'CLEARED' : 'OUTSTANDING'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="card flex flex-row items-center gap-6 p-6 transition-all hover-scale border-left-4 border-info">
                    <div className="p-4 rounded-2xl bg-info/10 text-info shrink-0">
                        <TrendingUp size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Invoiced Sum</p>
                        <h3 className="text-2xl font-black text-primary m-0 leading-tight">KES {invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0).toLocaleString()}</h3>
                    </div>
                </div>
                <div className="card flex flex-row items-center gap-6 p-6 transition-all hover-scale border-left-4 border-success">
                    <div className="p-4 rounded-2xl bg-success/10 text-success shrink-0">
                        <ShieldCheck size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Receipts</p>
                        <h3 className="text-2xl font-black text-primary m-0 leading-tight">KES {payments.reduce((sum, pay) => sum + Number(pay.amount || 0), 0).toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-grow min-w-0">
                    <div className="card border-none shadow-xl bg-white card-mobile-flat p-0 overflow-hidden border-top-4 border-primary">
                        <div className="p-5 border-b bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-0">Accounting Ledger</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Verified transaction history & adjustments</p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button variant="outline" size="sm" className="bg-white shadow-sm font-black flex-1 sm:flex-none" onClick={onPrintStatement} icon={<Printer size={14} />}>PRINT STATEMENT</Button>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 z-10 animate-pulse pointer-events-none opacity-40">
                                <div className="bg-slate-800 text-white p-2 rounded-full">
                                    <TrendingUp className="rotate-90" size={12} />
                                </div>
                            </div>

                            <div className="table-wrapper">
                                <table className="table table-sm w-full min-w-[800px]">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-6 min-w-[120px]">Date</th>
                                            <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-6 min-w-[200px]">Description</th>
                                            <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-6 min-w-[150px]">Reference</th>
                                            <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-6 text-right min-w-[120px]">Debit (+)</th>
                                            <th className="text-[10px] font-black uppercase text-slate-400 py-4 px-6 text-right min-w-[120px]">Credit (-)</th>
                                            <th className="text-[10px] font-black uppercase text-slate-800 py-4 px-6 text-right sticky right-0 bg-slate-50/95 shadow-[-5px_0_10px_rgba(0,0,0,0.02)] min-w-[130px]">Net Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {statement.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-20">
                                                    <div className="flex flex-col items-center gap-2 opacity-30">
                                                        <CreditCard size={48} />
                                                        <p className="text-xs font-black uppercase tracking-widest">No transaction data</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            statement.map((item, i) => (
                                                <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="py-4 px-6">
                                                        <span className="text-xs font-black text-slate-600 font-mono">{new Date(item.date).toLocaleDateString()}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${item.debit > 0 ? 'bg-error shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}></div>
                                                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{item.description}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">{item.reference || 'SYSTEM_GEN'}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <span className={`text-xs font-black ${item.debit > 0 ? 'text-error' : 'text-slate-300'}`}>
                                                            {item.debit > 0 ? `KES ${item.debit.toLocaleString()}` : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <span className={`text-xs font-black ${item.credit > 0 ? 'text-success' : 'text-slate-300'}`}>
                                                            {item.credit > 0 ? `KES ${item.credit.toLocaleString()}` : '—'}
                                                        </span>
                                                    </td>
                                                    <td className={`py-4 px-6 text-right font-black text-xs sticky right-0 group-hover:bg-slate-50 transition-colors ${item.balance === 0 ? 'text-success' : item.balance < 0 ? 'text-info' : 'text-error'}`}>
                                                        KES {item.balance.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    {statement.length > 0 && (
                                        <tfoot className="bg-slate-900 text-white">
                                            <tr>
                                                <td colSpan={3} className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white/50">Cumulative Closing Position</td>
                                                <td className="py-4 px-6 text-right text-xs font-black text-error/80">KES {statement.reduce((s, i) => s + i.debit, 0).toLocaleString()}</td>
                                                <td className="py-4 px-6 text-right text-xs font-black text-success/80">KES {statement.reduce((s, i) => s + i.credit, 0).toLocaleString()}</td>
                                                <td className={`py-4 px-6 text-right text-sm font-black sticky right-0 bg-slate-800 ${Number(student.fee_balance || 0) <= 0 ? 'text-success' : 'text-error'}`}>
                                                    KES {(student.fee_balance || 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceHistory;

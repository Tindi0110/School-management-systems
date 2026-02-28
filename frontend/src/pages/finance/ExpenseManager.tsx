import React from 'react';
import { Plus, FileText, CheckCircle, Trash2, TrendingUp } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import Button from '../../components/common/Button';

interface ExpenseManagerProps {
    filteredExpenses: any[];
    isReadOnly: boolean;
    setShowExpenseModal: (val: boolean) => void;
    invFilters: any;
    setInvFilters: (f: any) => void;
    formatDate: (d: string) => string;
    totalItems: number;
    page: number;
    setPage: (p: number | ((prev: number) => number)) => void;
    pageSize: number;
    isSubmitting: boolean;
    handleApprove: (id: number) => void;
    handleDecline: (id: number) => void;
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({
    filteredExpenses,
    isReadOnly,
    setShowExpenseModal,
    invFilters,
    setInvFilters,
    formatDate,
    totalItems,
    page,
    setPage,
    pageSize,
    isSubmitting,
    handleApprove,
    handleDecline
}) => {
    return (
        <div className="card shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-bold">Expense History</h3>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="w-40">
                        <SearchableSelect
                            placeholder="All Categories"
                            options={[
                                { id: '', label: 'All Categories' },
                                { id: 'SALARY', label: 'Salary' },
                                { id: 'UTILITIES', label: 'Utilities' },
                                { id: 'MAINTENANCE', label: 'Maintenance' },
                                { id: 'SUPPLIES', label: 'Supplies' },
                                { id: 'FOOD', label: 'Food' },
                                { id: 'OTHER', label: 'Other' }
                            ]}
                            value={invFilters.expenseCategory}
                            onChange={(val) => setInvFilters({ ...invFilters, expenseCategory: val.toString() })}
                        />
                    </div>
                    {!isReadOnly && (
                        <Button variant="secondary" size="sm" onClick={() => setShowExpenseModal(true)} icon={<Plus size={16} />}>
                            Record Expense
                        </Button>
                    )}
                </div>
            </div>
            <div className="table-wrapper">
                <table className="table min-w-[900px]">
                    <thead>
                        <tr>
                            <th>Date & Origin</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Paid To</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-10 text-slate-400 italic">No expenses recorded for this selection</td></tr>
                        ) : (
                            filteredExpenses.map((exp: any) => (
                                <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                                    <td>
                                        <div className="font-bold">{formatDate(exp.date_occurred)}</div>
                                        {exp.origin_model && (
                                            <div className="text-[10px] uppercase font-bold text-primary opacity-60 flex items-center gap-1 mt-1">
                                                <TrendingUp size={10} /> {exp.origin_model.split('.').pop()} INT
                                            </div>
                                        )}
                                    </td>
                                    <td><span className="badge badge-outline text-xs">{exp.category}</span></td>
                                    <td className="max-w-[200px] truncate" title={exp.description}>{exp.description}</td>
                                    <td>{exp.paid_to}</td>
                                    <td className="font-bold">KES {Number(exp.amount).toLocaleString()}</td>
                                    <td>
                                        <span className={`badge text-xs font-bold ${exp.status === 'APPROVED' ? 'badge-success text-white' : exp.status === 'DECLINED' ? 'badge-error text-white' : 'badge-warning text-yellow-900 border-yellow-300'}`}>
                                            {exp.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center justify-end gap-2">
                                            {exp.receipt_scan && (
                                                <a href={exp.receipt_scan} target="_blank" rel="noreferrer" className="btn btn-ghost btn-xs text-blue-500" title="View Receipt">
                                                    <FileText size={14} />
                                                </a>
                                            )}
                                            {!isReadOnly && exp.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(exp.id)}
                                                        className="btn btn-ghost btn-xs text-success hover:bg-success/10"
                                                        title="Approve"
                                                        disabled={isSubmitting}
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDecline(exp.id)}
                                                        className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                                                        title="Decline"
                                                        disabled={isSubmitting}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center mt-4 no-print px-2">
                <div className="text-xs text-secondary font-medium">
                    Showing <span className="text-primary font-bold">{filteredExpenses.length}</span> of <span className="text-primary font-bold">{totalItems}</span> expenses
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p: number) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <div className="flex items-center px-4 text-xs font-bold bg-slate-100 rounded-lg">Page {page}</div>
                    <Button variant="outline" size="sm" onClick={() => setPage((p: number) => p + 1)} disabled={filteredExpenses.length < pageSize}>Next</Button>
                </div>
            </div>
        </div>
    );
};

export default ExpenseManager;

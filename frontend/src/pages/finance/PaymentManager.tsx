import React from 'react';
import { Plus } from 'lucide-react';
import Button from '../../components/common/Button';

interface PaymentManagerProps {
    filteredPayments: any[];
    isReadOnly: boolean;
    setShowPaymentModal: (val: boolean) => void;
    formatDate: (date: string) => string;
    totalItems: number;
    page: number;
    setPage: (page: number | ((p: number) => number)) => void;
    pageSize: number;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({
    filteredPayments,
    isReadOnly,
    setShowPaymentModal,
    formatDate,
    totalItems,
    page,
    setPage,
    pageSize
}) => {
    return (
        <div className="card shadow-sm border border-slate-200">
            <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold">Payment Transactions</h3>
                {!isReadOnly && <Button variant="primary" size="sm" onClick={() => setShowPaymentModal(true)} icon={<Plus size={16} />}>Receive Payment</Button>}
            </div>
            <div className="table-wrapper">
                <table className="table min-w-[800px]">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Ref</th>
                            <th>Student</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-10 text-slate-400 italic">No payment transactions found</td></tr>
                        ) : (
                            filteredPayments.map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50/50">
                                    <td>{formatDate(p.date_received)}</td>
                                    <td className="font-bold">#{p.reference_number || p.id}</td>
                                    <td>{p.student_name}</td>
                                    <td className="font-bold text-success">KES {Number(p.amount).toLocaleString()}</td>
                                    <td>{p.method}</td>
                                    <td><span className="badge badge-success">COMPLETED</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center mt-4 no-print px-2">
                <div className="text-xs text-secondary font-medium">
                    Showing <span className="text-primary font-bold">{filteredPayments.length}</span> of <span className="text-primary font-bold">{totalItems}</span> payments
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p: number) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <div className="flex items-center px-4 text-xs font-bold bg-slate-100 rounded-lg">Page {page}</div>
                    <Button variant="outline" size="sm" onClick={() => setPage((p: number) => p + 1)} disabled={filteredPayments.length < pageSize}>Next</Button>
                </div>
            </div>
        </div>
    );
};

export default PaymentManager;

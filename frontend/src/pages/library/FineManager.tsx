import React from 'react';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import Button from '../../components/common/Button';

interface FineManagerProps {
    fines: any[];
    isReadOnly: boolean;
    isSyncing: boolean;
    onSync: () => void;
    onAdd: () => void;
    onEdit: (f: any) => void;
    onDelete: (e: React.MouseEvent, id: number) => void;
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (p: number) => void;
}

const FineManager: React.FC<FineManagerProps> = ({
    fines,
    isReadOnly,
    isSyncing,
    onSync,
    onAdd,
    onEdit,
    onDelete,
    page,
    total,
    pageSize,
    onPageChange
}) => {
    return (
        <div className="table-container fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3>Library Fines & Discipline</h3>
                <div className="flex gap-2">
                    {!isReadOnly && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onSync}
                            loading={isSyncing}
                            loadingText="Syncing..."
                            icon={<RefreshCw size={14} />}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                            Sync to Finance
                        </Button>
                    )}
                    {!isReadOnly && (
                        <Button variant="primary" size="sm" onClick={onAdd} icon={<Plus size={14} />}>Record Fine</Button>
                    )}
                </div>
            </div>
            <table className="table">
                <thead><tr><th>Student</th><th>Amount (KES)</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                    {fines.length === 0 && <tr><td colSpan={6} className="text-center italic">No fines found.</td></tr>}
                    {fines.map((f: any) => (
                        <tr key={f.id}>
                            <td>{f.user_name || 'Unknown Student'}</td>
                            <td className="font-bold">{parseFloat(f.amount).toLocaleString()}</td>
                            <td>{f.reason}</td>
                            <td>
                                <span className={`badge ${f.status === 'PAID' ? 'badge-success' : (f.adjustment ? 'badge-warning' : 'badge-error')}`}>
                                    {f.status === 'PAID' ? 'PAID' : (f.adjustment ? 'BILLED TO INVOICE' : 'PENDING')}
                                </span>
                            </td>
                            <td>{f.date_issued}</td>
                            <td>
                                <div className="flex gap-2">
                                    {!isReadOnly && (
                                        <>
                                            <Button variant="ghost" size="sm" className="text-primary" onClick={() => onEdit(f)} icon={<Edit size={14} />} />
                                            <Button variant="ghost" size="sm" className="text-error" onClick={(e) => onDelete(e, f.id)} icon={<Trash2 size={14} />} />
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* Pagination */}
            {total > pageSize && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-sm text-secondary">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} fines
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>← Prev</Button>
                        <span className="flex items-center px-4 font-bold text-sm">Page {page} / {Math.ceil(total / pageSize)}</span>
                        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page * pageSize >= total}>Next →</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FineManager;

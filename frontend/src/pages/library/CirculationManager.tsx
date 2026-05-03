import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';

interface CirculationManagerProps {
    lendings: any[];
    isReadOnly: boolean;
    onIssue: () => void;
    onReturn: (id: number) => void;
    onExtend: (id: number) => void;
    onEdit: (l: any) => void;
    onDelete: (e: React.MouseEvent, id: number) => void;
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (p: number) => void;
}

const CirculationManager: React.FC<CirculationManagerProps> = ({
    lendings,
    isReadOnly,
    onIssue,
    onReturn,
    onExtend,
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
                <h3>Circulation Record</h3>
                {!isReadOnly && (
                    <Button variant="primary" size="sm" onClick={onIssue} icon={<Plus size={14} />}>Issue Book</Button>
                )}
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Book Title</th>
                        <th>Copy ID</th>
                        <th>Student</th>
                        <th>Borrowed</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {lendings.map((l: any) => (
                        <tr key={l.id}>
                            <td className="font-bold">{l.book_title}</td>
                            <td><span className="font-mono text-xs bg-secondary-light px-2 py-1 rounded">{l.copy_number}</span></td>
                            <td>{l.user_name || l.student_name}</td>
                            <td>{l.date_issued}</td>
                            <td><span className={new Date(l.due_date) < new Date() && !l.date_returned ? 'text-error font-bold' : ''}>{l.due_date}</span></td>
                            <td><span className={`badge ${l.date_returned ? 'badge-success' : (new Date(l.due_date) < new Date() ? 'badge-error' : 'badge-info')}`}>{l.date_returned ? 'RETURNED' : (new Date(l.due_date) < new Date() ? 'OVERDUE' : 'ISSUED')}</span></td>
                            <td>
                                <div className="flex gap-2">
                                    {!isReadOnly && !l.date_returned && (
                                        <>
                                            <Button size="sm" onClick={() => onReturn(l.id)}>
                                                Return
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-warning border-warning hover:bg-warning hover:text-white"
                                                onClick={() => onExtend(l.id)}>
                                                Extend
                                            </Button>
                                        </>
                                    )}
                                    {!isReadOnly && (
                                        <>
                                            <Button variant="ghost" size="sm" className="text-primary" onClick={() => onEdit(l)} icon={<Edit size={14} />} />
                                            <Button variant="ghost" size="sm" className="text-error" onClick={(e) => onDelete(e, l.id)} icon={<Trash2 size={14} />} />
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
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} records
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

export default CirculationManager;

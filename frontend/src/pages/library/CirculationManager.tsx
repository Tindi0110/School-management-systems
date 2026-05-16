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
    activeRole: 'STUDENT' | 'STAFF';
    onRoleChange: (role: 'STUDENT' | 'STAFF') => void;
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
    onPageChange,
    activeRole,
    onRoleChange
}) => {
    return (
        <div className="table-container fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                    <button 
                        className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${activeRole === 'STUDENT' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                        onClick={() => onRoleChange('STUDENT')}
                    >
                        STUDENTS
                    </button>
                    <button 
                        className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${activeRole === 'STAFF' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                        onClick={() => onRoleChange('STAFF')}
                    >
                        STAFF / TEACHERS
                    </button>
                </div>
                {!isReadOnly && (
                    <Button variant="primary" size="sm" onClick={onIssue} icon={<Plus size={14} />}>Issue Book</Button>
                )}
            </div>

            <table className="table">
                <thead>
                    <tr>
                        <th>Book Title</th>
                        <th>Copy ID</th>
                        <th>Borrower</th>
                        <th>Borrowed</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {lendings.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-12 text-secondary italic">No active {activeRole.toLowerCase()} lendings found</td></tr>
                    ) : (
                        lendings.map((l: any) => (
                            <tr key={l.id}>
                                <td className="font-bold">{l.book_title}</td>
                                <td><span className="font-mono text-xs bg-secondary-light px-2 py-1 rounded">{l.copy_number}</span></td>
                                <td>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{l.user_name || l.student_name}</span>
                                        <span className="text-[9px] font-black text-secondary uppercase tracking-widest">{l.user_role}</span>
                                    </div>
                                </td>
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
                    )))}
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

import React from 'react';
import { Plus, ArrowRight, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';

interface InventoryManagerProps {
    books: any[];
    copies: any[];
    filteredCopies: any[];
    isReadOnly: boolean;
    viewingInventoryBookId: number | null;
    onSetViewingBookId: (id: number | null) => void;
    onAddCopy: (bookId?: string) => void;
    onEditCopy: (c: any) => void;
    onDeleteCopy: (e: React.MouseEvent, id: number) => void;
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (p: number) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({
    books,
    copies,
    filteredCopies,
    isReadOnly,
    viewingInventoryBookId,
    onSetViewingBookId,
    onAddCopy,
    onEditCopy,
    onDeleteCopy,
    page,
    total,
    pageSize,
    onPageChange
}) => {
    return (
        <div className="table-container fade-in">
            {!viewingInventoryBookId ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3>Inventory Summary</h3>
                        {!isReadOnly && (
                            <Button variant="primary" size="sm" onClick={() => onAddCopy()} icon={<Plus size={14} />}>Add Copy</Button>
                        )}
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Book Title</th>
                                <th>Total Copies</th>
                                <th>Available</th>
                                <th>Issued</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {books.map(b => {
                                const bookCopies = copies.filter(c => c.book === b.id);
                                const available = bookCopies.filter(c => c.status === 'AVAILABLE').length;
                                const issued = bookCopies.filter(c => c.status === 'ISSUED').length;

                                return (
                                    <tr key={b.id}>
                                        <td className="font-bold">{b.title}</td>
                                        <td><span className="badge badge-info">{bookCopies.length}</span></td>
                                        <td><span className="badge badge-success">{available}</span></td>
                                        <td><span className="badge badge-warning">{issued}</span></td>
                                        <td>
                                            <Button variant="outline" size="sm" onClick={() => onSetViewingBookId(b.id)} icon={<ArrowRight size={14} />}>
                                                View Units
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {/* Summary Pagination */}
                    {total > pageSize && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <span className="text-sm text-secondary">
                                Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} titles
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>← Prev</Button>
                                <span className="flex items-center px-4 font-bold text-sm">Page {page} / {Math.ceil(total / pageSize)}</span>
                                <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page * pageSize >= total}>Next →</Button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => onSetViewingBookId(null)}>← Back</Button>
                            <h3>{books.find(b => b.id === viewingInventoryBookId)?.title} - Copies</h3>
                        </div>
                        {!isReadOnly && (
                            <Button variant="primary" size="sm" onClick={() => onAddCopy(String(viewingInventoryBookId))} icon={<Plus size={14} />}>
                                Add Copy to this Title
                            </Button>
                        )}
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Accession ID</th>
                                <th>Condition</th>
                                <th>Status</th>
                                <th>Purchase Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCopies.filter(c => c.book === viewingInventoryBookId).map(c => (
                                <tr key={c.id}>
                                    <td><span className="font-mono bg-secondary-light px-2 py-1 rounded text-xs">#{c.copy_number}</span></td>
                                    <td><span className={`badge ${c.condition === 'NEW' ? 'badge-success' : 'badge-info'}`}>{c.condition}</span></td>
                                    <td><span className={`status-badge ${c.status === 'AVAILABLE' ? 'success' : c.status === 'OVERDUE' ? 'error' : 'secondary'}`}>{c.status}</span></td>
                                    <td>{c.purchase_date || 'N/A'}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            {!isReadOnly && (
                                                <>
                                                    <Button variant="ghost" size="sm" className="text-primary" onClick={() => onEditCopy(c)} icon={<Edit size={14} />} />
                                                    <Button variant="ghost" size="sm" className="text-error" onClick={(e) => onDeleteCopy(e, c.id)} icon={<Trash2 size={14} />} />
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {copies.filter(c => c.book === viewingInventoryBookId).length === 0 && (
                                <tr><td colSpan={5} className="text-center italic text-secondary">No copies found for this title.</td></tr>
                            )}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default InventoryManager;

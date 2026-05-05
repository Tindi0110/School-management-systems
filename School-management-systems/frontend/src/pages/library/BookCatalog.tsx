import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';

interface BookCatalogProps {
    books: any[];
    copies: any[];
    searchTerm: string;
    isReadOnly: boolean;
    onAdd: () => void;
    onEdit: (b: any) => void;
    onDelete: (e: React.MouseEvent, id: number) => void;
    onViewUnits: (id: number) => void;
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (p: number) => void;
}

const BookCatalog: React.FC<BookCatalogProps> = ({
    books,
    copies,
    isReadOnly,
    onAdd,
    onEdit,
    onDelete,
    onViewUnits,
    page,
    total,
    pageSize,
    onPageChange
}) => {
    return (
        <div className="table-container fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3>Asset Catalog</h3>
                {!isReadOnly && (
                    <Button variant="primary" size="sm" onClick={onAdd} icon={<Plus size={14} />}>Add Title</Button>
                )}
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>ISBN</th>
                        <th>Category</th>
                        <th>Availability</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {books.map((b: any) => {
                        const bookCopies = copies.filter(c => c.book === b.id);
                        const available = bookCopies.filter(c => c.status === 'AVAILABLE').length;
                        return (
                            <tr key={b.id}>
                                <td className="font-bold">{b.title}</td>
                                <td>{b.author}</td>
                                <td className="font-mono text-xs">{b.isbn || 'N/A'}</td>
                                <td>{b.category || 'General'}</td>
                                <td>
                                    <span className={`badge ${available > 0 ? 'badge-success' : 'badge-warning'}`}>
                                        {available} / {bookCopies.length} Units
                                    </span>
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        {!isReadOnly && (
                                            <>
                                                <Button variant="ghost" size="sm" className="text-primary" onClick={() => onEdit(b)} icon={<Edit size={14} />} />
                                                <Button variant="ghost" size="sm" className="text-error" onClick={(e) => onDelete(e, b.id)} icon={<Trash2 size={14} />} />
                                            </>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => onViewUnits(b.id)}>View Units</Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {/* Pagination */}
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
        </div>
    );
};

export default BookCatalog;

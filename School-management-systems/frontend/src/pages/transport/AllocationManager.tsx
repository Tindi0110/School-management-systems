import React from 'react';
import { MapPin, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';

interface AllocationManagerProps {
    allocations: any[];
    searchTerm: string;
    onEdit: (a: any) => void;
    onDelete: (id: number) => void;
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

const AllocationManager: React.FC<AllocationManagerProps> = ({
    allocations,
    searchTerm,
    onEdit,
    onDelete,
    page,
    total,
    pageSize,
    onPageChange
}) => {
    // Note: Backend search will be used, but we keep the client-side filter as fallback or for small datasets
    const filteredAllocations = allocations.filter(a =>
        !searchTerm ||
        (a.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.route_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.pickup_point_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="table-container fade-in">
            <table className="table">
                <thead>
                    <tr>
                        <th>Student Passenger</th>
                        <th>Route & Pick-up</th>
                        <th>Seat No</th>
                        <th>Period</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAllocations.map(a => (
                        <tr key={a.id}>
                            <td>
                                <div className="flex items-center gap-4">
                                    <div className="avatar-sm">{a.student_name ? a.student_name[0] : '?'}</div>
                                    <span className="font-bold">{a.student_name}</span>
                                </div>
                            </td>
                            <td>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">{a.route_name}</span>
                                    <span className="text-xs text-secondary flex items-center gap-2"><MapPin size={10} /> {a.pickup_point_name}</span>
                                </div>
                            </td>
                            <td><span className="font-mono bg-secondary-light px-2 py-1 rounded text-xs">{a.seat_number || 'TBA'}</span></td>
                            <td>{a.start_date}</td>
                            <td><span className={`status-badge ${a.status === 'ACTIVE' ? 'success' : 'secondary'}`}>{a.status}</span></td>
                            <td>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="text-primary" onClick={() => onEdit(a)} icon={<Edit size={14} />} />
                                    <Button variant="ghost" size="sm" className="text-error" onClick={() => onDelete(a.id)} icon={<Trash2 size={14} />} />
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredAllocations.length === 0 && (
                        <tr>
                            <td colSpan={6} className="text-center py-8 text-secondary italic">No allocations found.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination UI */}
            {total > pageSize && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-sm text-secondary">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} allocations
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>← Prev</Button>
                        <span className="btn btn-ghost btn-sm pointer-events-none px-4">Page {page} / {Math.ceil(total / pageSize)}</span>
                        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page * pageSize >= total}>Next →</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllocationManager;

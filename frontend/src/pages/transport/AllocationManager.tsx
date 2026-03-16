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
    const filteredAllocations = allocations.filter(a =>
        !searchTerm ||
        (a.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.route_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.pickup_point_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="card card-mobile-flat p-0 overflow-hidden fade-in">
            <div className="p-0 table-wrapper overflow-x-auto overflow-y-auto w-full block m-0">
                <table className="table min-w-[600px] border-collapse">
                    <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm text-[10px] uppercase">
                        <tr>
                            <th className="py-4 px-6 text-left">Student Passenger</th>
                            <th className="py-4 px-6 text-left">Route & Pick-up</th>
                            <th className="py-4 px-6">Seat No</th>
                            <th className="py-4 px-6">Period</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAllocations.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-light text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
                                            {a.student_name ? a.student_name[0].toUpperCase() : '?'}
                                        </div>
                                        <span className="font-bold text-xs">{a.student_name}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xs text-slate-800">{a.route_name}</span>
                                        <span className="text-[10px] text-secondary flex items-center gap-1 mt-0.5"><MapPin size={10} /> {a.pickup_point_name}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <code className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black">{a.seat_number || 'TBA'}</code>
                                </td>
                                <td className="py-4 px-6 text-[10px] font-bold text-slate-500">{a.start_date}</td>
                                <td className="py-4 px-6 text-center">
                                    <span className={`badge badge-xs font-black ${a.status === 'ACTIVE' ? 'badge-success' : 'badge-ghost opacity-40'}`}>{a.status}</span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <div className="flex gap-1 justify-end">
                                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10" onClick={() => onEdit(a)} icon={<Edit size={12} />} />
                                        <Button variant="ghost" size="sm" className="text-error hover:bg-error/10" onClick={() => onDelete(a.id)} icon={<Trash2 size={12} />} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredAllocations.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-slate-300 font-black text-[10px] uppercase tracking-widest">No allocations found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {total > pageSize && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-secondary uppercase">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>← Prev</Button>
                        <span className="btn btn-ghost btn-sm pointer-events-none px-4 text-[10px] font-black">Page {page} / {Math.ceil(total / pageSize)}</span>
                        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page * pageSize >= total}>Next →</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllocationManager;

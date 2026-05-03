import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface HostelLogManagerProps {
    type: 'discipline' | 'assets' | 'maintenance';
    data: any[];
    page: number;
    setPage: (p: number | ((prev: number) => number)) => void;
    total: number;
    pageSize: number;
    students: any[];
    hostels: any[];
    onAdd: () => void;
    onEdit: (item: any) => void;
    onDelete: (id: number) => void;
}

const HostelLogManager: React.FC<HostelLogManagerProps> = ({
    type, data, page, setPage, total, pageSize, students, hostels, onAdd, onEdit, onDelete
}) => {
    const titles = {
        discipline: 'Disciplinary Records',
        assets: 'Hostel Assets / Inventory',
        maintenance: 'Maintenance Requests'
    };

    return (
        <div className="table-container fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold mb-0">{titles[type]}</h3>
                <button className="btn btn-primary btn-sm" onClick={onAdd}>
                    <Plus size={14} className="mr-1" /> New Record
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="table w-full shadow-sm rounded-lg overflow-hidden">
                    <thead className="bg-slate-50">
                        {type === 'discipline' ? (
                            <tr><th>Date</th><th>Student</th><th>Offence</th><th>Severity</th><th>Action Taken</th><th>Actions</th></tr>
                        ) : type === 'assets' ? (
                            <tr><th>Code</th><th>Name</th><th>Condition</th><th>Location</th><th>Value</th><th>Actions</th></tr>
                        ) : (
                            <tr><th>Date Reported</th><th>Location</th><th>Issue</th><th>Status</th><th>Cost</th><th>Actions</th></tr>
                        )}
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-10 opacity-40">No {type} records found.</td></tr>
                        ) : (
                            data.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50/50">
                                    {type === 'discipline' ? (
                                        <>
                                            <td>{item.incident_date || item.date}</td>
                                            <td className="font-bold">{item.student_name || students.find(s => s.id === item.student)?.full_name || 'N/A'}</td>
                                            <td className="max-w-[150px] truncate">{item.offence}</td>
                                            <td><span className={`badge badge-xs text-[10px] font-black ${item.severity === 'MAJOR' ? 'badge-error' : item.severity === 'MODERATE' ? 'badge-warning' : 'badge-ghost'}`}>{item.severity}</span></td>
                                            <td className="text-xs">{item.action_taken || 'Pending'}</td>
                                        </>
                                    ) : type === 'assets' ? (
                                        <>
                                            <td className="font-mono text-xs">{item.asset_code}</td>
                                            <td className="font-bold">{item.type || item.asset_type}</td>
                                            <td><span className={`badge badge-xs ${item.condition === 'GOOD' ? 'badge-success text-white' : item.condition === 'DAMAGED' ? 'badge-error text-white' : 'badge-warning'}`}>{item.condition}</span></td>
                                            <td className="text-xs">
                                                {item.hostel_name || hostels.find(h => h.id === item.hostel)?.name}
                                                {item.room_number ? ` - ${item.room_number}` : ''}
                                            </td>
                                            <td className="font-mono text-xs">KES {Number(item.value).toLocaleString()}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{item.date_reported || item.date}</td>
                                            <td className="text-xs">{item.hostel_name} - {item.room_number}</td>
                                            <td className="max-w-[200px] truncate">{item.issue}</td>
                                            <td><span className={`badge badge-xs font-bold ${item.status === 'COMPLETED' ? 'badge-success text-white' : item.status === 'IN_PROGRESS' ? 'badge-info text-white' : 'badge-warning'}`}>{item.status}</span></td>
                                            <td className="font-mono text-xs">KES {Number(item.repair_cost).toLocaleString()}</td>
                                        </>
                                    )}
                                    <td>
                                        <div className="flex gap-1">
                                            <button className="btn btn-xs btn-ghost text-primary" onClick={() => onEdit(item)}><Edit size={14} /></button>
                                            <button className="btn btn-xs btn-ghost text-error" onClick={() => onDelete(item.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {total > pageSize && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t px-2">
                    <span className="text-xs text-secondary font-medium">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} records
                    </span>
                    <div className="flex gap-2">
                        <button className="btn btn-outline btn-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                        <span className="btn btn-ghost btn-xs pointer-events-none text-xs font-bold">Page {page} / {Math.ceil(total / pageSize)}</span>
                        <button className="btn btn-outline btn-xs" onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= total}>Next</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HostelLogManager;

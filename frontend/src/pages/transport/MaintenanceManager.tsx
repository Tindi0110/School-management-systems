import React from 'react';
import { Plus, Edit, Trash2, Wrench } from 'lucide-react';
import Button from '../../components/common/Button';

interface MaintenanceManagerProps {
    records: any[];
    searchTerm: string;
    onAdd: () => void;
    onEdit: (m: any) => void;
    onDelete: (id: number) => void;
    vehicles: any[];
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({
    records,
    searchTerm,
    onAdd,
    onEdit,
    onDelete,
    vehicles,
    page,
    total,
    pageSize,
    onPageChange
}) => {
    return (
        <div className="table-container fade-in">
            <div className="flex justify-between items-center mb-4 px-4 pt-4">
                <h3 className="mb-0">Maintenance & Repairs</h3>
                <Button variant="primary" size="sm" onClick={onAdd} icon={<Plus size={14} />}>Request Service</Button>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Vehicle</th>
                        <th>Description</th>
                        <th>Cost (KES)</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map(r => {
                        const vehicle = vehicles.find(v => v.id === r.vehicle);
                        return (
                            <tr key={r.id}>
                                <td>{r.service_date}</td>
                                <td><span className="font-semibold">{vehicle?.registration_number || `Vehicle #${r.vehicle}`}</span></td>
                                <td className="max-w-xs truncate">{r.description}</td>
                                <td>{parseFloat(r.cost).toLocaleString()}</td>
                                <td>
                                    <span className={`status-badge ${r.status === 'COMPLETED' ? 'success' :
                                            r.status === 'IN_PROGRESS' ? 'warning' : 'secondary'
                                        }`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="text-primary" onClick={() => onEdit(r)} icon={<Edit size={14} />} />
                                        <Button variant="ghost" size="sm" className="text-error" onClick={() => onDelete(r.id)} icon={<Trash2 size={14} />} />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {records.length === 0 && (
                        <tr>
                            <td colSpan={6} className="text-center py-8 text-secondary italic">No maintenance records found.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination UI */}
            {total > pageSize && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t px-4 pb-4">
                    <span className="text-sm text-secondary">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} records
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

export default MaintenanceManager;

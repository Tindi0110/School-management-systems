import React from 'react';
import { ShieldAlert, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';

interface SafetyManagerProps {
    incidents: any[];
    vehicles: any[];
    onAdd: () => void;
    onEdit: (i: any) => void;
    onDelete: (id: number) => void;
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

const SafetyManager: React.FC<SafetyManagerProps> = ({
    incidents,
    vehicles,
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
            <div className="flex justify-between items-center mb-4 px-4 pt-4">
                <h3 className="mb-0">Safety & Incidents</h3>
                <Button variant="primary" size="sm" className="bg-error hover:bg-error-dark" onClick={onAdd} icon={<ShieldAlert size={14} />}>Report Incident</Button>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Vehicle</th>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {incidents.map(i => {
                        const vehicle = vehicles.find(v => v.id === i.vehicle);
                        return (
                            <tr key={i.id}>
                                <td>{i.date}</td>
                                <td><span className="font-semibold">{vehicle?.registration_number || `Vehicle #${i.vehicle}`}</span></td>
                                <td><span className="badge badge-outline">{i.incident_type}</span></td>
                                <td>
                                    <span className={`status-badge ${i.severity === 'CRITICAL' ? 'error' :
                                        i.severity === 'MAJOR' ? 'warning' : 'secondary'
                                        }`}>
                                        {i.severity}
                                    </span>
                                </td>
                                <td className="max-w-xs truncate">{i.description}</td>
                                <td>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="text-primary" onClick={() => onEdit(i)} icon={<Edit size={14} />} />
                                        <Button variant="ghost" size="sm" className="text-error" onClick={() => onDelete(i.id)} icon={<Trash2 size={14} />} />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {incidents.length === 0 && (
                        <tr>
                            <td colSpan={6} className="text-center py-8 text-secondary italic">No incidents reported.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination UI */}
            {total > pageSize && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t px-4 pb-4">
                    <span className="text-sm text-secondary">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} incidents
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

export default SafetyManager;

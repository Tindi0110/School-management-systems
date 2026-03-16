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
        <div className="card card-mobile-flat p-0 overflow-hidden fade-in">
            <div className="card-header">
                <div>
                    <h3 className="mb-0 text-sm font-black uppercase">Safety & Incidents</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">All reported safety incidents and events</p>
                </div>
                <Button variant="primary" size="sm" className="font-black bg-error hover:bg-error-dark border-error" onClick={onAdd} icon={<ShieldAlert size={14} />}>Report Incident</Button>
            </div>

            <div className="p-0 table-wrapper overflow-x-auto w-full block m-0">
                <table className="table min-w-[600px] border-collapse">
                    <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm text-[10px] uppercase">
                        <tr>
                            <th className="py-4 px-6 text-left">Date</th>
                            <th className="py-4 px-6 text-left">Vehicle</th>
                            <th className="py-4 px-6">Type</th>
                            <th className="py-4 px-6">Severity</th>
                            <th className="py-4 px-6 text-left">Description</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {incidents.map(i => {
                            const vehicle = vehicles.find(v => v.id === i.vehicle);
                            return (
                                <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-6 text-[11px] font-bold text-slate-500">{i.date}</td>
                                    <td className="py-4 px-6 font-bold text-xs text-slate-800">{vehicle?.registration_number || `Vehicle #${i.vehicle}`}</td>
                                    <td className="py-4 px-6 text-center">
                                        <span className="badge badge-outline badge-xs font-black uppercase">{i.incident_type}</span>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className={`badge badge-xs font-black ${
                                            i.severity === 'CRITICAL' ? 'badge-error' :
                                            i.severity === 'MAJOR' ? 'badge-warning' : 'badge-ghost opacity-60'
                                        }`}>{i.severity}</span>
                                    </td>
                                    <td className="py-4 px-6 max-w-xs truncate text-[11px] text-slate-600">{i.description}</td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex gap-1 justify-end">
                                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10" onClick={() => onEdit(i)} icon={<Edit size={12} />} />
                                            <Button variant="ghost" size="sm" className="text-error hover:bg-error/10" onClick={() => onDelete(i.id)} icon={<Trash2 size={12} />} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {incidents.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-slate-300 font-black text-[10px] uppercase tracking-widest">No incidents reported.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {total > pageSize && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-secondary uppercase">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} incidents
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

export default SafetyManager;

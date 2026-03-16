import React from 'react';
import { Plus, Edit, Trash2, Bus } from 'lucide-react';
import Button from '../../components/common/Button';

interface TripLogsProps {
    trips: any[];
    onAdd: () => void;
    onEdit: (t: any) => void;
    onDelete: (id: number) => void;
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

const TripLogs: React.FC<TripLogsProps> = ({
    trips,
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
                    <h3 className="mb-0 text-sm font-black uppercase">Daily Trip Logs</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Track all vehicle trips and journeys</p>
                </div>
                <Button variant="primary" size="sm" className="font-black" onClick={onAdd} icon={<Plus size={14} />}>New Trip</Button>
            </div>

            <div className="p-0 table-wrapper overflow-x-auto w-full block m-0">
                <table className="table min-w-[700px] border-collapse">
                    <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm text-[10px] uppercase">
                        <tr>
                            <th className="py-4 px-6 text-left">Date</th>
                            <th className="py-4 px-6 text-left">Route</th>
                            <th className="py-4 px-6 text-left">Vehicle</th>
                            <th className="py-4 px-6">Attendant</th>
                            <th className="py-4 px-6">Departure / Arrival</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {trips.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-4 px-6 text-[11px] font-bold text-slate-500">{t.date}</td>
                                <td className="py-4 px-6 font-bold text-xs text-slate-800">{t.route_name}</td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-400"><Bus size={12} /></div>
                                        <code className="text-[10px] font-black">{t.vehicle_plate}</code>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-[11px] font-bold text-slate-500 text-center">{t.attendant || 'N/A'}</td>
                                <td className="py-4 px-6">
                                    <div className="text-[10px] font-black space-y-0.5 text-center">
                                        <div className="text-success">↑ {t.departure_time || '--:--'}</div>
                                        <div className="text-slate-400">↓ {t.arrival_time || '--:--'}</div>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <span className={`badge badge-xs font-black ${t.status === 'COMPLETED' ? 'badge-success' : t.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-ghost opacity-40'}`}>{t.status}</span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <div className="flex gap-1 justify-end">
                                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10" onClick={() => onEdit(t)} icon={<Edit size={12} />} />
                                        <Button variant="ghost" size="sm" className="text-error hover:bg-error/10" onClick={() => onDelete(t.id)} icon={<Trash2 size={12} />} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {trips.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-slate-300 font-black text-[10px] uppercase tracking-widest">No trip logs recorded.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {total > pageSize && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-secondary uppercase">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} trips
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

export default TripLogs;

import React from 'react';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import Button from '../../components/common/Button';

interface FuelManagerProps {
    records: any[];
    vehicles: any[];
    onDelete: (id: number) => void;
    onEdit: (record: any) => void;
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onAdd: () => void;
}

const FuelManager: React.FC<FuelManagerProps> = ({
    records,
    vehicles,
    onDelete,
    onEdit,
    page,
    total,
    pageSize,
    onPageChange,
    onAdd
}) => {
    return (
        <div className="card card-mobile-flat p-0 overflow-hidden fade-in">
            <div className="card-header flex justify-between items-center">
                <div>
                    <h3 className="mb-0 text-sm font-black uppercase">Fuel Consumption Logs</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">All fleet refuelling records</p>
                </div>
                <Button size="sm" onClick={onAdd} icon={<Plus size={14} />}>
                    Log Fuel
                </Button>
            </div>

            <div className="p-0 table-wrapper overflow-x-auto w-full block m-0">
                <table className="table min-w-[600px] border-collapse">
                    <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm text-[10px] uppercase">
                        <tr>
                            <th className="py-4 px-6 text-left">Date</th>
                            <th className="py-4 px-6 text-left">Vehicle</th>
                            <th className="py-4 px-6">Litres</th>
                            <th className="py-4 px-6">Amount (KES)</th>
                            <th className="py-4 px-6">Mileage</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {records.map(r => {
                            const vehicle = vehicles.find(v => v.id === r.vehicle);
                            return (
                                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-6 text-[11px] font-bold text-slate-500">{r.date}</td>
                                    <td className="py-4 px-6 font-bold text-xs text-slate-800">{vehicle?.registration_number || `Vehicle #${r.vehicle}`}</td>
                                    <td className="py-4 px-6 text-center text-[11px] font-bold text-slate-700">{r.liters} L</td>
                                    <td className="py-4 px-6 text-center font-black text-xs text-slate-800">{parseFloat(r.amount).toLocaleString()}</td>
                                    <td className="py-4 px-6 text-center text-[11px] font-bold text-slate-500">{r.mileage} KM</td>
                                    <td className="py-4 px-6 text-center">
                                        <span className={`badge ${r.status === 'APPROVED' ? 'badge-success' : 'badge-warning'} text-[9px] px-2 py-0.5`}>
                                            {r.status || 'PENDING'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => onEdit(r)} icon={<Edit2 size={12} />} />
                                            <Button variant="ghost" size="sm" className="text-error hover:bg-error/10" onClick={() => onDelete(r.id)} icon={<Trash2 size={12} />} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {records.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-slate-300 font-black text-[10px] uppercase tracking-widest">No fuel records logged.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {total > pageSize && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-secondary uppercase">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} records
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

export default FuelManager;

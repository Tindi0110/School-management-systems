import React from 'react';
import { Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';

interface FuelManagerProps {
    records: any[];
    vehicles: any[];
    onDelete: (id: number) => void;
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

const FuelManager: React.FC<FuelManagerProps> = ({
    records,
    vehicles,
    onDelete,
    page,
    total,
    pageSize,
    onPageChange
}) => {
    return (
        <div className="table-container fade-in">
            <div className="flex justify-between items-center mb-4 px-4 pt-4">
                <h3 className="mb-0">Fuel Consumption Logs</h3>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Vehicle</th>
                        <th>Liters</th>
                        <th>Amount (KES)</th>
                        <th>Mileage</th>
                        <th>Receipt No</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map(r => {
                        const vehicle = vehicles.find(v => v.id === r.vehicle);
                        return (
                            <tr key={r.id}>
                                <td>{r.date}</td>
                                <td><span className="font-semibold">{vehicle?.registration_number || `Vehicle #${r.vehicle}`}</span></td>
                                <td>{r.liters} L</td>
                                <td className="font-bold">{parseFloat(r.amount).toLocaleString()}</td>
                                <td>{r.mileage} KM</td>
                                <td><span className="font-mono text-xs">{r.receipt_no || '---'}</span></td>
                                <td>
                                    <Button variant="ghost" size="sm" className="text-error" onClick={() => onDelete(r.id)} icon={<Trash2 size={14} />} />
                                </td>
                            </tr>
                        );
                    })}
                    {records.length === 0 && (
                        <tr>
                            <td colSpan={7} className="text-center py-8 text-secondary italic">No fuel records logged.</td>
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

export default FuelManager;

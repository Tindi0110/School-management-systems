import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';

interface TripLogsProps {
    trips: any[];
    searchTerm: string;
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
    searchTerm,
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
                <h3 className="mb-0">Daily Trip Logs</h3>
                <Button variant="primary" size="sm" onClick={onAdd} icon={<Plus size={14} />}>New Trip</Button>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Route</th>
                        <th>Vehicle</th>
                        <th>Attendant</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {trips.map(t => (
                        <tr key={t.id}>
                            <td>{t.date}</td>
                            <td className="font-semibold">{t.route_name}</td>
                            <td>{t.vehicle_plate}</td>
                            <td>{t.attendant || 'N/A'}</td>
                            <td>
                                <div className="text-xs">
                                    <div className="text-success font-medium">S: {t.departure_time || '--:--'}</div>
                                    <div className="text-secondary">E: {t.arrival_time || '--:--'}</div>
                                </div>
                            </td>
                            <td><span className="status-badge success">{t.status}</span></td>
                            <td>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="text-primary" onClick={() => onEdit(t)} icon={<Edit size={14} />} />
                                    <Button variant="ghost" size="sm" className="text-error" onClick={() => onDelete(t.id)} icon={<Trash2 size={14} />} />
                                </div>
                            </td>
                        </tr>
                    ))}
                    {trips.length === 0 && (
                        <tr>
                            <td colSpan={7} className="text-center py-8 text-secondary italic">No trip logs recorded.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination UI */}
            {total > pageSize && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t px-4 pb-4">
                    <span className="text-sm text-secondary">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} trips
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

export default TripLogs;

import React from 'react';
import { Bus, Edit, Trash2, Plus } from 'lucide-react';
import Button from '../../components/common/Button';

interface FleetManagerProps {
    vehicles: any[];
    searchTerm: string;
    onEdit: (v: any) => void;
    onDelete: (id: number) => void;
    onLogFuel: (v: any) => void;
    onAdd: () => void;
}

const FleetManager: React.FC<FleetManagerProps> = ({
    vehicles,
    searchTerm,
    onEdit,
    onDelete,
    onLogFuel,
    onAdd
}) => {
    const filteredVehicles = vehicles.filter(v =>
        !searchTerm ||
        v.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.make_model || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredVehicles.map(v => (
                <div key={v.id} className="card p-6 hover-scale border-top-4 border-primary">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="mb-0">{v.registration_number}</h3>
                            <span className="text-xs font-bold text-secondary uppercase tracking-wider">{v.make_model || v.vehicle_type}</span>
                        </div>
                        <div className={`p-2 rounded-lg ${v.status === 'ACTIVE' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>
                            <Bus size={20} />
                        </div>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-secondary">Seating Cap:</span><span className="font-semibold">{v.seating_capacity} Seats</span></div>
                        <div className="flex justify-between"><span className="text-secondary">Condition:</span><span className="font-semibold">{v.current_condition}</span></div>
                        <div className="flex justify-between">
                            <span className="text-secondary">Insurance Info:</span>
                            <span className={`font-semibold ${v.insurance_expiry && new Date(v.insurance_expiry) < new Date() ? 'text-error' : ''}`}>
                                {v.insurance_expiry || 'N/A'}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6 border-top pt-4">
                        <Button variant="ghost" size="sm" className="flex-1 text-primary" onClick={() => onEdit(v)} icon={<Edit size={14} />}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-error" onClick={() => onDelete(v.id)} icon={<Trash2 size={14} />} />
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => onLogFuel(v)}>Fuel Logs</Button>
                    </div>
                </div>
            ))}
            <div className="card border-dashed border-2 flex flex-col items-center justify-center p-8 text-secondary cursor-pointer hover:bg-slate-50 transition-colors" onClick={onAdd}>
                <Plus size={32} className="mb-2" />
                <p className="font-bold">Add New Vehicle</p>
            </div>
        </div>
    );
};

export default FleetManager;

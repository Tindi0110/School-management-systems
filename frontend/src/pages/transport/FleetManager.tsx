import React from 'react';
import { Bus, Edit, Trash2, Plus, Fuel } from 'lucide-react';
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
        <div className="grid grid-cols-12 gap-6 lg:gap-8 min-w-0">
            {filteredVehicles.map(v => (
                <div key={v.id} className="col-span-12 md:col-span-6 lg:col-span-4 min-w-0">
                    <div className="card hover:shadow-2xl transition-all h-full flex flex-col p-6 overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-lg ${v.status === 'ACTIVE' ? 'bg-success text-white' : 'bg-warning text-white'}`}>
                                <Bus size={16} />
                            </div>
                            <span className="badge badge-info badge-xs">CAP: {v.seating_capacity}</span>
                        </div>
                        <h3 className="mb-1 text-sm font-black">{v.registration_number}</h3>
                        <p className="text-[10px] font-bold text-secondary mb-4 uppercase tracking-wider">{v.make_model || v.vehicle_type}</p>
                        <div className="space-y-2 text-[11px] font-bold flex-1">
                            <div className="flex justify-between items-center">
                                <span className="text-secondary uppercase">Condition:</span>
                                <span className="text-slate-700">{v.current_condition}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-secondary uppercase">Insurance:</span>
                                <span className={`font-black ${v.insurance_expiry && new Date(v.insurance_expiry) < new Date() ? 'text-error' : 'text-slate-700'}`}>
                                    {v.insurance_expiry || 'N/A'}
                                </span>
                            </div>
                        </div>
                        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                            <span className={`badge badge-xs font-black ${v.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>{v.status}</span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" onClick={() => onEdit(v)} title="Edit Vehicle" icon={<Edit size={10} />} />
                                <Button variant="ghost" size="sm" className="text-primary" onClick={() => onLogFuel(v)} title="Fuel Logs" icon={<Fuel size={10} />} />
                                <Button variant="ghost" size="sm" className="text-error" onClick={() => onDelete(v.id)} title="Delete" icon={<Trash2 size={10} />} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <div className="col-span-12 md:col-span-6 lg:col-span-4 min-w-0">
                <div className="card border-dashed flex flex-col items-center justify-center p-8 cursor-pointer hover:border-primary group h-full" onClick={onAdd}>
                    <Plus size={32} className="text-secondary group-hover:text-primary transition-all mb-2" />
                    <span className="text-xs font-black uppercase text-secondary">Add New Vehicle</span>
                </div>
            </div>
        </div>
    );
};

export default FleetManager;

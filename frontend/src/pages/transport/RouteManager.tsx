import React from 'react';
import { MapPin, Navigation, Clock, Edit, Trash2, Plus } from 'lucide-react';
import Button from '../../components/common/Button';

interface RouteManagerProps {
    routes: any[];
    pickupPoints: any[];
    searchTerm: string;
    onEditRoute: (r: any) => void;
    onDeleteRoute: (id: number) => void;
    onAddRoute: () => void;
    onEditPoint: (p: any) => void;
    onDeletePoint: (id: number) => void;
    onAddPoint: (routeId: number) => void;
}

const RouteManager: React.FC<RouteManagerProps> = ({
    routes,
    pickupPoints,
    searchTerm,
    onEditRoute,
    onDeleteRoute,
    onAddRoute,
    onEditPoint,
    onDeletePoint,
    onAddPoint
}) => {
    const filteredRoutes = routes.filter(r =>
        !searchTerm ||
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.route_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRoutes.map(r => (
                <div key={r.id} className="card p-6 border-left-4 border-primary">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1"><span className="badge badge-primary">{r.route_code}</span></div>
                            <h3 className="mb-0">{r.name}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-secondary font-bold uppercase">Base Fee/Term</p>
                            <h3 className="text-primary">KES {parseFloat(r.base_cost || 0).toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="bg-secondary-light rounded-lg p-4 mb-4">
                        <p className="text-xs font-bold text-secondary uppercase mb-2">Service Points</p>
                        <div className="space-y-3">
                            {pickupPoints.filter(p => p.route === r.id).length === 0 && <p className="text-secondary italic text-xs">No points mapped yet.</p>}
                            {pickupPoints.filter(p => p.route === r.id).map(p => (
                                <div key={p.id} className="flex items-center gap-4 text-sm group">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    <span className="flex-1 font-semibold">{p.point_name}</span>
                                    <span className="text-secondary flex items-center gap-2"><Clock size={12} /> {p.pickup_time}</span>
                                    <span className="badge badge-primary text-[10px]">KES {parseFloat(p.additional_cost || 0).toLocaleString()}</span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" className="text-primary p-0" onClick={() => onEditPoint(p)} icon={<Edit size={10} />} />
                                        <Button variant="ghost" size="sm" className="text-error p-0" onClick={() => onDeletePoint(p.id)} icon={<Trash2 size={10} />} />
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" className="w-full mt-2 border-dashed" onClick={() => onAddPoint(r.id)} icon={<Plus size={12} />}>Add Point</Button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs border-top pt-4 mt-4">
                        <span className="text-secondary flex items-center gap-2"><Navigation size={12} /> {r.distance_km} KM Loop</span>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-primary" onClick={() => onEditRoute(r)} icon={<Edit size={12} />}>Edit</Button>
                            <Button variant="ghost" size="sm" className="text-error" onClick={() => onDeleteRoute(r.id)} icon={<Trash2 size={12} />} />
                        </div>
                    </div>
                </div>
            ))}
            <div className="card border-dashed border-2 flex flex-col items-center justify-center p-8 text-secondary cursor-pointer hover:bg-slate-50 transition-colors" onClick={onAddRoute}>
                <MapPin size={32} className="mb-2" />
                <p className="font-bold">Map New Route</p>
            </div>
        </div>
    );
};

export default RouteManager;

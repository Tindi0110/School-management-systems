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
        <div className="grid grid-cols-12 gap-6 lg:gap-8 min-w-0">
            {filteredRoutes.map(r => (
                <div key={r.id} className="col-span-12 md:col-span-6 min-w-0">
                    <div className="card hover:shadow-2xl transition-all h-full flex flex-col p-6 overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 rounded-lg bg-primary-light text-white">
                                <Navigation size={16} />
                            </div>
                            <span className="badge badge-primary badge-xs font-black">{r.route_code}</span>
                        </div>
                        <h3 className="mb-1 text-sm font-black">{r.name}</h3>
                        <p className="text-[10px] font-bold text-secondary mb-4 uppercase flex items-center gap-1">
                            <Navigation size={10} /> {r.distance_km} KM Loop
                        </p>

                        {/* Service Points */}
                        <div className="flex-1 space-y-2 mb-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Service Points</p>
                            {pickupPoints.filter(p => p.route === r.id).length === 0 && (
                                <p className="text-secondary italic text-[10px]">No stops mapped yet.</p>
                            )}
                            {pickupPoints.filter(p => p.route === r.id).map(p => (
                                <div key={p.id} className="flex items-center gap-3 text-[11px] group p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                    <span className="flex-1 font-bold text-slate-700">{p.point_name}</span>
                                    <span className="text-secondary flex items-center gap-1"><Clock size={10} /> {p.pickup_time}</span>
                                    <span className="badge badge-primary badge-xs font-bold">KES {parseFloat(p.additional_cost || 0).toLocaleString()}</span>
                                    <div className="flex gap-1 transition-opacity">
                                        <Button variant="ghost" size="sm" className="text-primary p-0 h-5 w-5" onClick={() => onEditPoint(p)} icon={<Edit size={10} />} />
                                        <Button variant="ghost" size="sm" className="text-error p-0 h-5 w-5" onClick={() => onDeletePoint(p.id)} icon={<Trash2 size={10} />} />
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" className="w-full mt-2 border-dashed text-[10px] font-black" onClick={() => onAddPoint(r.id)} icon={<Plus size={12} />}>ADD STOP</Button>
                        </div>

                        {/* Footer */}
                        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-secondary uppercase">KES {parseFloat(r.base_cost || 0).toLocaleString()} / Term</span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" onClick={() => onEditRoute(r)} title="Edit Route" icon={<Edit size={10} />} />
                                <Button variant="ghost" size="sm" className="text-error" onClick={() => onDeleteRoute(r.id)} title="Delete Route" icon={<Trash2 size={10} />} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <div className="col-span-12 md:col-span-6 min-w-0">
                <div className="card border-dashed flex flex-col items-center justify-center p-8 cursor-pointer hover:border-primary group h-full" onClick={onAddRoute}>
                    <MapPin size={32} className="text-secondary group-hover:text-primary transition-all mb-2" />
                    <span className="text-xs font-black uppercase text-secondary">Map New Route</span>
                </div>
            </div>
        </div>
    );
};

export default RouteManager;

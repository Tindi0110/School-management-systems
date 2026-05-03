import React from 'react';
import { Building, Plus, Bed as BedIcon, Edit, Users, Trash2 } from 'lucide-react';

interface HostelRegistryProps {
    hostels: any[];
    rooms: any[];
    staff: any[];
    searchTerm: string;
    openViewRooms: (h: any) => void;
    handleEditHostel: (h: any) => void;
    openViewResidents: (h: any) => void;
    handleDeleteHostel: (id: number) => void;
    setIsHostelModalOpen: (val: boolean) => void;
}

const HostelRegistry: React.FC<HostelRegistryProps> = ({
    hostels,
    rooms,
    staff,
    searchTerm,
    openViewRooms,
    handleEditHostel,
    openViewResidents,
    handleDeleteHostel,
    setIsHostelModalOpen
}) => {
    const filteredHostels = hostels.filter(h =>
        !searchTerm ||
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.warden_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {filteredHostels.length > 0 ? (
                filteredHostels.map(h => (
                    <div key={h.id} className="card p-6 border-top-4 border-primary hover-scale shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="mb-0 text-lg font-bold">{h.name}</h3>
                                <span className={`badge ${h.gender_allowed === 'M' ? 'badge-primary' : 'badge-error'}`}>
                                    {h.gender_allowed === 'M' ? 'BOYS' : 'GIRLS'}
                                </span>
                            </div>
                            <Building className="text-secondary opacity-20" size={40} />
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-secondary">Warden:</span>
                                <span className="font-semibold text-primary">
                                    {staff.find(s => String(s.id) === String(h.warden))?.full_name || h.warden_name || 'Not Assigned'}
                                </span>
                            </div>
                            <div className="flex justify-between"><span className="text-secondary">Type:</span><span className="font-semibold">{h.hostel_type}</span></div>
                            <div className="flex justify-between"><span className="text-secondary">Rooms:</span><span className="font-semibold">{rooms.filter(r => String(r.hostel) === String(h.id)).length} Units</span></div>
                            <div className="w-full bg-secondary-light rounded-full h-2 mt-4">
                                <div className="bg-primary h-2 rounded-full" style={{ width: `${h.occupancy_rate || 0}%` }}></div>
                            </div>
                            <p className="text-right text-xs font-bold text-primary mt-1">{h.occupancy_rate || 0}% Occupied</p>
                        </div>
                        <div className="flex gap-2 mt-6 pt-4 border-t flex-wrap">
                            <button className="btn btn-xs btn-outline flex-1 gap-1" onClick={() => openViewRooms(h)} title="View Rooms"><BedIcon size={12} /> Rooms</button>
                            <button className="btn btn-xs btn-outline flex-1 gap-1" onClick={() => handleEditHostel(h)} title="Edit Details"><Edit size={12} /> Edit</button>
                            <button className="btn btn-xs btn-outline flex-1 gap-1" onClick={() => openViewResidents(h)} title="View Residents"><Users size={12} /> Users</button>
                            <button className="btn btn-xs btn-outline text-error border-error hover:bg-error hover:text-white" onClick={(e) => { e.stopPropagation(); handleDeleteHostel(h.id); }} title="Delete Hostel"><Trash2 size={12} /></button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="col-span-full py-12 text-center opacity-40">
                    <Building size={48} className="mx-auto mb-2" />
                    <p className="font-medium italic">No hostels registered.</p>
                </div>
            )}
            <div className="card p-6 flex flex-col items-center justify-center border-dashed border-2 text-secondary cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsHostelModalOpen(true)}>
                <Plus size={32} className="mb-2" />
                <p className="font-bold">Add New Hostel</p>
            </div>
        </div>
    );
};

export default HostelRegistry;

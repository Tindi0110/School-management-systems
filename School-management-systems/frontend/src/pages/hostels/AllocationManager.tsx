import React from 'react';
import { Plus, Users as UsersIcon, Printer, Edit, Trash2 } from 'lucide-react';
import { exportToCSV } from '../../utils/export';

interface AllocationManagerProps {
    allocations: any[];
    rooms: any[];
    hostels: any[];
    students: any[];
    allocPage: number;
    setAllocPage: (page: number | ((p: number) => number)) => void;
    allocTotal: number;
    pageSize: number;
    setIsAllocationModalOpen: (val: boolean) => void;
    setAllocationId: React.Dispatch<React.SetStateAction<number | null>>;
    setIsTransferMode: React.Dispatch<React.SetStateAction<boolean>>;
    openTransferModal: (a: any) => void;
    handleEditAllocation: (a: any) => void;
    handleDeleteAllocation: (id: number) => void;
}

const AllocationManager: React.FC<AllocationManagerProps> = ({
    allocations,
    rooms,
    hostels,
    students,
    allocPage,
    setAllocPage,
    allocTotal,
    pageSize,
    setIsAllocationModalOpen,
    setAllocationId,
    setIsTransferMode,
    openTransferModal,
    handleEditAllocation,
    handleDeleteAllocation
}) => {
    return (
        <div className="table-container fade-in">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h3 className="text-lg font-bold mb-0">Student Allocations</h3>
                <div className="flex gap-2 items-center">
                    <button className="btn btn-outline btn-sm" onClick={() => exportToCSV(allocations.map(a => {
                        const room = rooms.find(r => String(r.id) === String(a.room));
                        return {
                            Student: a.student_name || students.find(s => String(s.id) === String(a.student))?.full_name,
                            Hostel: a.hostel_name || (room ? hostels.find(h => String(h.id) === String(room.hostel))?.name : 'N/A'),
                            Room: a.room_number || 'N/A',
                            Bed: a.bed_number || 'N/A',
                            Status: a.status
                        };
                    }), 'allocations_report')}>
                        <UsersIcon size={14} className="mr-1" /> CSV
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => window.print()}><Printer size={14} className="mr-1" /> Print</button>
                    <button className="btn btn-primary btn-sm ml-2" onClick={() => { setAllocationId(null); setIsTransferMode(false); setIsAllocationModalOpen(true); }}>
                        <Plus size={14} className="mr-1" /> Assign Student
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="table table-zebra w-full shadow-sm rounded-lg overflow-hidden">
                    <thead className="bg-slate-50">
                        <tr><th>Student</th><th>Hostel</th><th>Room</th><th>Bed</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {allocations.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-10">
                                    <div className="flex flex-col items-center opacity-40">
                                        <UsersIcon size={40} className="mb-2" />
                                        <p className="font-medium">No student allocations found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            allocations.map((a: any) => (
                                <tr key={a.id} className="hover:bg-slate-50/50">
                                    <td className="font-bold">
                                        {a.student_name || students.find(s => String(s.id) === String(a.student))?.full_name || `ID: ${a.student}`}
                                    </td>
                                    <td>{a.hostel_name || 'N/A'}</td>
                                    <td>{a.room_number || 'N/A'}</td>
                                    <td>{a.bed_number || 'N/A'}</td>
                                    <td><span className={`badge text-xs ${a.status === 'ACTIVE' ? 'badge-success text-white' : 'badge-ghost'}`}>{a.status}</span></td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button className="btn btn-xs btn-outline text-info border-info hover:bg-info hover:text-white" onClick={() => openTransferModal(a)} title="Transfer Room">Transfer</button>
                                            <button className="btn btn-xs btn-ghost text-primary" onClick={() => handleEditAllocation(a)}><Edit size={14} /></button>
                                            <button className="btn btn-xs btn-ghost text-error" onClick={() => handleDeleteAllocation(a.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {allocTotal > pageSize && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t px-2">
                    <span className="text-xs text-secondary font-medium">
                        Showing {((allocPage - 1) * pageSize) + 1}–{Math.min(allocPage * pageSize, allocTotal)} of {allocTotal} allocations
                    </span>
                    <div className="flex gap-2">
                        <button className="btn btn-outline btn-xs" onClick={() => setAllocPage(p => Math.max(1, p - 1))} disabled={allocPage === 1}>Prev</button>
                        <span className="btn btn-ghost btn-xs pointer-events-none text-xs font-bold">Page {allocPage} / {Math.ceil(allocTotal / pageSize)}</span>
                        <button className="btn btn-outline btn-xs" onClick={() => setAllocPage(p => p + 1)} disabled={allocPage * pageSize >= allocTotal}>Next</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllocationManager;

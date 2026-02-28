import React from 'react';
import { Plus, Printer, Edit, Trash2 } from 'lucide-react';
import PremiumDateInput from '../../components/common/DatePicker';

interface AttendanceManagerProps {
    attendance: any[];
    students: any[];
    attnPage: number;
    setAttnPage: (page: number | ((p: number) => number)) => void;
    attnTotal: number;
    pageSize: number;
    setIsAttendanceModalOpen: (val: boolean) => void;
    setAttendanceMode: (mode: 'SINGLE' | 'BULK') => void;
    handleEditAttendance: (a: any) => void;
    handleDeleteAttendance: (id: number) => void;
}

const AttendanceManager: React.FC<AttendanceManagerProps> = ({
    attendance,
    students,
    attnPage,
    setAttnPage,
    attnTotal,
    pageSize,
    setIsAttendanceModalOpen,
    setAttendanceMode,
    handleEditAttendance,
    handleDeleteAttendance
}) => {
    return (
        <div className="table-container fade-in">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h3 className="text-lg font-bold mb-0">Hostel Attendance</h3>
                <div className="flex gap-2 items-center">
                    <button className="btn btn-outline btn-sm" onClick={() => window.print()}><Printer size={14} className="mr-1" /> Print Report</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setAttendanceMode('BULK'); setIsAttendanceModalOpen(true); }}>
                        <Plus size={14} className="mr-1" /> Room Roll Call
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => { setAttendanceMode('SINGLE'); setIsAttendanceModalOpen(true); }}>
                        <Plus size={14} className="mr-1" /> Log Individual
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="table w-full shadow-sm rounded-lg overflow-hidden">
                    <thead className="bg-slate-50">
                        <tr><th>Date</th><th>Student</th><th>Session</th><th>Status</th><th>Room</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {attendance.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-12 opacity-40">No attendance records found for this period.</td></tr>
                        ) : (
                            attendance.map((a: any) => (
                                <tr key={a.id} className="hover:bg-slate-50/50">
                                    <td>{a.date}</td>
                                    <td className="font-bold">
                                        {a.student_name || students.find(s => String(s.id) === String(a.student))?.full_name || `ID: ${a.student}`}
                                    </td>
                                    <td className="text-xs font-bold text-secondary uppercase">{a.session}</td>
                                    <td>
                                        <span className={`badge text-xs font-bold ${a.status === 'PRESENT' ? 'badge-success text-white' : a.status === 'ABSENT' ? 'badge-error text-white' : 'badge-warning text-yellow-900 border-yellow-300'}`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td>{a.room_number || 'N/A'}</td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button className="btn btn-xs btn-ghost text-primary" onClick={() => handleEditAttendance(a)}><Edit size={14} /></button>
                                            <button className="btn btn-xs btn-ghost text-error" onClick={() => handleDeleteAttendance(a.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {attnTotal > pageSize && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t px-2">
                    <span className="text-xs text-secondary font-medium">
                        Showing {((attnPage - 1) * pageSize) + 1}–{Math.min(attnPage * pageSize, attnTotal)} of {attnTotal} records
                    </span>
                    <div className="flex gap-2">
                        <button className="btn btn-outline btn-xs" onClick={() => setAttnPage(p => Math.max(1, p - 1))} disabled={attnPage === 1}>Prev</button>
                        <span className="btn btn-ghost btn-xs pointer-events-none text-xs font-bold">Page {attnPage} / {Math.ceil(attnTotal / pageSize)}</span>
                        <button className="btn btn-outline btn-xs" onClick={() => setAttnPage(p => p + 1)} disabled={attnPage * pageSize >= attnTotal}>Next</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceManager;

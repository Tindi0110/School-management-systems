import React from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import Modal from '../../components/Modal';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/SearchableSelect';
import PremiumDateInput from '../../components/common/DatePicker';

interface HostelModalsProps {
    // Hostel
    isHostelModalOpen: boolean;
    setIsHostelModalOpen: (val: boolean) => void;
    hostelFormData: any;
    setHostelFormData: (val: any) => void;
    handleHostelSubmit: (e: React.FormEvent) => void;
    hostelId: number | null;

    // Room
    isRoomModalOpen: boolean;
    setIsRoomModalOpen: (val: boolean) => void;
    roomFormData: any;
    setRoomFormData: (val: any) => void;
    handleRoomSubmit: (e: React.FormEvent) => void;
    roomId: number | null;

    // Allocation
    isAllocationModalOpen: boolean;
    setIsAllocationModalOpen: (val: boolean) => void;
    allocationFormData: any;
    setAllocationFormData: (val: any) => void;
    handleAllocationSubmit: (e: React.FormEvent) => void;
    allocationId: number | null;
    isTransferMode: boolean;

    // Asset
    isAssetModalOpen: boolean;
    setIsAssetModalOpen: (val: boolean) => void;
    assetFormData: any;
    setAssetFormData: (val: any) => void;
    handleAssetSubmit: (e: React.FormEvent) => void;
    assetId: number | null;

    // Attendance
    isAttendanceModalOpen: boolean;
    setIsAttendanceModalOpen: (val: boolean) => void;
    attendanceFormData: any;
    setAttendanceFormData: (val: any) => void;
    handleAttendanceSubmit: (e: React.FormEvent) => void;
    attendanceId: number | null;
    attendanceMode: 'SINGLE' | 'BULK';
    setAttendanceMode: (val: 'SINGLE' | 'BULK') => void;
    bulkAttendanceRoom: number | null;
    setBulkAttendanceRoom: (val: number | null) => void;
    bulkAttendanceData: any;
    setBulkAttendanceData: (val: any) => void;
    handleBulkAttendanceSubmit: () => void;

    // Discipline
    isDisciplineModalOpen: boolean;
    setIsDisciplineModalOpen: (val: boolean) => void;
    disciplineFormData: any;
    setDisciplineFormData: (val: any) => void;
    handleDisciplineSubmit: (e: React.FormEvent) => void;
    disciplineId: number | null;

    // Maintenance
    isMaintenanceModalOpen: boolean;
    setIsMaintenanceModalOpen: (val: boolean) => void;
    maintenanceFormData: any;
    setMaintenanceFormData: (val: any) => void;
    handleMaintenanceSubmit: (e: React.FormEvent) => void;
    maintenanceId: number | null;

    // View Residents
    isViewResidentsModalOpen: boolean;
    setIsViewResidentsModalOpen: (val: boolean) => void;
    viewHostelResidents: any[];

    // View Rooms
    isViewRoomsModalOpen: boolean;
    setIsViewRoomsModalOpen: (val: boolean) => void;
    selectedHostel: any;
    openAddRoom: (h: any) => void;
    openEditRoom: (r: any) => void;
    handleDeleteRoom: (id: number) => void;
    openViewResidents: (h: any) => void;

    // Shared Data
    hostels: any[];
    rooms: any[];
    beds: any[];
    students: any[];
    allocations: any[];  // Active allocations for room-to-student lookup
    staff: any[];
    isSubmitting: boolean;
}

const HostelModals: React.FC<HostelModalsProps> = ({
    isHostelModalOpen, setIsHostelModalOpen, hostelFormData, setHostelFormData, handleHostelSubmit, hostelId,
    isRoomModalOpen, setIsRoomModalOpen, roomFormData, setRoomFormData, handleRoomSubmit, roomId,
    isAllocationModalOpen, setIsAllocationModalOpen, allocationFormData, setAllocationFormData, handleAllocationSubmit, allocationId, isTransferMode,
    isAssetModalOpen, setIsAssetModalOpen, assetFormData, setAssetFormData, handleAssetSubmit, assetId,
    isAttendanceModalOpen, setIsAttendanceModalOpen, attendanceFormData, setAttendanceFormData, handleAttendanceSubmit, attendanceId, attendanceMode, setAttendanceMode: _setAttendanceMode, bulkAttendanceRoom, setBulkAttendanceRoom, bulkAttendanceData, setBulkAttendanceData, handleBulkAttendanceSubmit,
    isDisciplineModalOpen, setIsDisciplineModalOpen, disciplineFormData, setDisciplineFormData, handleDisciplineSubmit, disciplineId,
    isMaintenanceModalOpen, setIsMaintenanceModalOpen, maintenanceFormData, setMaintenanceFormData, handleMaintenanceSubmit, maintenanceId,
    isViewResidentsModalOpen, setIsViewResidentsModalOpen, viewHostelResidents,
    isViewRoomsModalOpen, setIsViewRoomsModalOpen, selectedHostel, openAddRoom, openEditRoom, handleDeleteRoom, openViewResidents,
    hostels, rooms, beds, students, allocations, staff, isSubmitting
}) => {
    // Derive students in a room from active allocations (students have no direct current_room field)
    const getStudentsInRoom = (roomId: number) => {
        const allocsInRoom = allocations.filter(
            (a: any) => String(a.room) === String(roomId) && a.status === 'ACTIVE'
        );
        return allocsInRoom
            .map((a: any) => students.find((s: any) => String(s.id) === String(a.student)))
            .filter(Boolean);
    };
    return (
        <>
            {/* Hostel Modal */}
            <Modal
                isOpen={isHostelModalOpen}
                onClose={() => setIsHostelModalOpen(false)}
                title={hostelId ? "Edit Hostel" : "Add New Hostel"}
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setIsHostelModalOpen(false)}>Cancel</button>
                        <button type="submit" form="hostel-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "SAVING..." : (hostelId ? "UPDATE HOSTEL" : "CREATE HOSTEL")}
                        </button>
                    </>
                }
            >
                <form id="hostel-form" onSubmit={handleHostelSubmit} className="space-y-6">
                    <div className="form-group">
                        <label>Hostel Name</label>
                        <input type="text" placeholder="e.g. Mandela Hall" value={hostelFormData.name} onChange={(e) => setHostelFormData({ ...hostelFormData, name: e.target.value })} required />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Gender Restriction</label>
                            <SearchableSelect options={[{ id: 'M', label: 'Male Only' }, { id: 'F', label: 'Female Only' }, { id: 'B', label: 'Mixed / Both' }]} value={hostelFormData.gender_allowed} onChange={(v) => setHostelFormData({ ...hostelFormData, gender_allowed: v.toString() })} />
                        </div>
                        <div className="form-group">
                            <label>Hostel Category</label>
                            <SearchableSelect options={[{ id: 'BOARDING', label: 'Boarding' }, { id: 'COLLEGE', label: 'College' }]} value={hostelFormData.hostel_type} onChange={(v) => setHostelFormData({ ...hostelFormData, hostel_type: v.toString() })} />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Total Capacity (Beds)</label>
                            <input type="number" value={hostelFormData.capacity} onChange={(e) => setHostelFormData({ ...hostelFormData, capacity: Number(e.target.value) })} required />
                        </div>
                        <div className="form-group">
                            <label>Assigned Warden</label>
                            <SearchableSelect placeholder="Select Staff Member" options={staff.map(s => ({ id: s.id.toString(), label: s.full_name }))} value={hostelFormData.warden} onChange={(v) => setHostelFormData({ ...hostelFormData, warden: v.toString() })} />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* View Rooms Modal */}
            <Modal
                isOpen={isViewRoomsModalOpen}
                onClose={() => setIsViewRoomsModalOpen(false)}
                title={`Inventory: ${selectedHostel?.name}`}
                footer={<button type="button" className="modern-btn modern-btn-secondary" onClick={() => setIsViewRoomsModalOpen(false)}>Close</button>}
            >
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary border border-slate-100">
                                <Users size={20} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Hostel</h4>
                                <p className="text-xs font-black text-slate-700">{selectedHostel?.name}</p>
                            </div>
                        </div>
                        <button className="modern-btn modern-btn-primary py-2 px-4 text-[10px]" onClick={() => openAddRoom(selectedHostel)}>
                            <Plus size={14} className="mr-2" /> ADD ROOM
                        </button>
                    </div>
                    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Room No.</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Beds</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rooms.filter(r => String(r.hostel) === String(selectedHostel?.id)).map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-black text-slate-700">#{r.room_number}</div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase">{r.floor || 'G-Floor'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{r.room_type}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="text-xs font-black text-slate-700">{r.available_beds} <span className="text-[9px] text-slate-400 font-bold">/ {r.capacity}</span></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${r.available_beds > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'}`}></div>
                                                <span className={`text-[9px] font-black uppercase tracking-tight ${r.available_beds > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {r.available_beds > 0 ? 'Available' : 'Full House'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors" title="Edit Room" onClick={() => openEditRoom(r)}><Edit size={14} /></button>
                                                <button className="p-2 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors" title="View Residents" onClick={() => openViewResidents({ ...selectedHostel, roomFilter: r.id })}><Users size={14} /></button>
                                                <button className="p-2 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors" title="Delete Room" onClick={() => handleDeleteRoom(r.id)}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {rooms.filter(r => String(r.hostel) === String(selectedHostel?.id)).length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs italic">No rooms documented for this hostel entity</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>

            {/* Room Modal */}
            <Modal
                isOpen={isRoomModalOpen}
                onClose={() => setIsRoomModalOpen(false)}
                title={roomId ? "Edit Room" : "Add New Room"}
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setIsRoomModalOpen(false)}>Cancel</button>
                        <button type="submit" form="room-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "SAVING..." : "SAVE ROOM"}
                        </button>
                    </>
                }
            >
                <form id="room-form" onSubmit={handleRoomSubmit} className="space-y-6">
                    <div className="form-group">
                        <label>Assigned Hostel</label>
                        <SearchableSelect options={hostels.map(h => ({ id: h.id.toString(), label: h.name }))} value={roomFormData.hostel} onChange={(v) => setRoomFormData({ ...roomFormData, hostel: v.toString() })} required />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Room Identification No.</label>
                            <input type="text" placeholder="e.g. 101" value={roomFormData.room_number} onChange={(e) => setRoomFormData({ ...roomFormData, room_number: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Floor / Sector</label>
                            <input type="text" placeholder="e.g. Ground Floor" value={roomFormData.floor} onChange={(e) => setRoomFormData({ ...roomFormData, floor: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Room Category</label>
                            <SearchableSelect options={[{ id: 'DORM', label: 'Dormitory' }, { id: 'STUDIO', label: 'Studio' }, { id: 'DOUBLE', label: 'Double' }, { id: 'SINGLE', label: 'Single' }]} value={roomFormData.room_type} onChange={(v) => setRoomFormData({ ...roomFormData, room_type: v.toString() })} />
                        </div>
                        <div className="form-group">
                            <label>Total Bed Capacity</label>
                            <input type="number" placeholder="e.g. 4" value={roomFormData.capacity} onChange={(e) => setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) })} required />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Allocation Modal */}
            <Modal
                isOpen={isAllocationModalOpen}
                onClose={() => { setIsAllocationModalOpen(false); }}
                title={isTransferMode ? "Transfer Student" : allocationId ? "Edit Allocation" : "Student Admission to Hostel"}
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setIsAllocationModalOpen(false)}>Cancel</button>
                        <button type="submit" form="allocation-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "PROCESSING..." : (isTransferMode ? "EXECUTE TRANSFER" : "CONFIRM ADMISSION")}
                        </button>
                    </>
                }
            >
                <form id="allocation-form" onSubmit={handleAllocationSubmit} className="space-y-6">
                    <div className="form-group">
                        <label>Target Student Candidate</label>
                        <SearchableSelect
                            placeholder="Search by name or admission number..."
                            options={students.filter(s => s.category?.toUpperCase() === 'BOARDING').map(s => ({ id: s.id.toString(), label: `${s.admission_number} - ${s.full_name}` }))}
                            value={allocationFormData.student}
                            onChange={(v) => setAllocationFormData({ ...allocationFormData, student: v.toString() })}
                            disabled={isTransferMode || allocationId !== null}
                            required
                        />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Designated Hostel</label>
                            <SearchableSelect options={hostels.map(h => ({ id: h.id.toString(), label: h.name }))} value={allocationFormData.hostel} onChange={(v) => setAllocationFormData({ ...allocationFormData, hostel: v.toString(), room: '', bed: '' })} required />
                        </div>
                        <div className="form-group">
                            <label>Specific Room</label>
                            <SearchableSelect options={rooms.filter(r => String(r.hostel) === String(allocationFormData.hostel)).map(r => ({ id: r.id.toString(), label: `Room ${r.room_number} (${r.available_beds} beds left)` }))} value={allocationFormData.room} onChange={(v) => setAllocationFormData({ ...allocationFormData, room: v.toString(), bed: '' })} disabled={!allocationFormData.hostel} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Available Bed Assignment</label>
                        <SearchableSelect
                            placeholder="Select an unoccupied bed"
                            options={beds
                                .filter(b =>
                                    String(b.room) === String(allocationFormData.room) &&
                                    (b.is_available || b.status?.toUpperCase() === 'AVAILABLE' || String(b.id) === String(allocationFormData.bed))
                                )
                                .map(b => ({ id: b.id.toString(), label: `Bed ${b.bed_number}` || 'Unknown Bed' }))
                            }
                            value={allocationFormData.bed}
                            onChange={(v) => setAllocationFormData({ ...allocationFormData, bed: v.toString() })}
                            disabled={!allocationFormData.room}
                            required
                        />
                    </div>
                </form>
            </Modal>

            {/* Attendance Modal */}
            <Modal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                title={attendanceMode === 'BULK' ? "Room Roll Call" : (attendanceId ? "Edit Attendance" : "Log Attendance")}
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setIsAttendanceModalOpen(false)}>Cancel</button>
                        {attendanceMode === 'BULK' ? (
                            <button type="button" className="modern-btn modern-btn-primary" onClick={handleBulkAttendanceSubmit} disabled={!bulkAttendanceRoom || Object.keys(bulkAttendanceData).length === 0}>
                                SUBMIT ROLL CALL
                            </button>
                        ) : (
                            <button type="submit" form="attendance-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                                LOG STATUS
                            </button>
                        )}
                    </>
                }
            >
                <div className="space-y-6">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Reporting Date</label>
                            <PremiumDateInput value={attendanceFormData.date} onChange={(d) => setAttendanceFormData({ ...attendanceFormData, date: d })} required />
                        </div>
                        <div className="form-group">
                            <label>Check-in Session</label>
                            <SearchableSelect options={[{ id: 'MORNING', label: 'Morning Call' }, { id: 'EVENING', label: 'Evening Call' }, { id: 'NIGHT', label: 'Night Call' }, { id: 'SPECIAL', label: 'Special Check' }]} value={attendanceFormData.session} onChange={(v) => setAttendanceFormData({ ...attendanceFormData, session: v.toString() })} />
                        </div>
                    </div>

                    {attendanceMode === 'BULK' ? (
                        <div className="space-y-6">
                            <div className="form-group">
                                <label>Target Room for Batch Logging</label>
                                <SearchableSelect placeholder="Select room to begin roll call..." options={rooms.map(r => ({ id: r.id.toString(), label: `Room ${r.room_number} (${r.hostel_name || 'N/A'})` }))} value={bulkAttendanceRoom !== null ? bulkAttendanceRoom.toString() : ''} onChange={(v) => setBulkAttendanceRoom(Number(v))} />
                            </div>
                            {bulkAttendanceRoom && (() => {
                                const roomStudents = getStudentsInRoom(bulkAttendanceRoom);
                                return (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Resident List ({roomStudents.length})</h4>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin">
                                            {roomStudents.length === 0 && <p className="text-center py-10 text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed">No active residents documented for this room</p>}
                                            {roomStudents.map((s: any) => (
                                                <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 group hover:border-primary/30 transition-all">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <div className="text-[11px] font-black text-slate-800">{s.full_name}</div>
                                                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{s.admission_number}</div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {[
                                                                { id: 'PRESENT', label: 'P', color: 'emerald' },
                                                                { id: 'ABSENT', label: 'A', color: 'rose' },
                                                                { id: 'PERMISSION', label: 'L', color: 'amber' },
                                                                { id: 'SICK', label: 'S', color: 'sky' }
                                                            ].map(st => (
                                                                <button
                                                                    key={st.id}
                                                                    type="button"
                                                                    onClick={() => setBulkAttendanceData({ ...bulkAttendanceData, [s.id]: { ...bulkAttendanceData[s.id], status: st.id } })}
                                                                    className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${bulkAttendanceData[s.id]?.status === st.id ? `bg-${st.color}-500 text-white shadow-lg shadow-${st.color}-200` : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                                    title={st.id}
                                                                >
                                                                    {st.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Add observation or remarks..."
                                                        className="h-8 text-[10px] bg-slate-50 border-none rounded-lg px-3 focus:bg-white transition-colors"
                                                        value={bulkAttendanceData[s.id]?.remarks || ''}
                                                        onChange={(e) => setBulkAttendanceData({ ...bulkAttendanceData, [s.id]: { ...bulkAttendanceData[s.id], remarks: e.target.value } })}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <form id="attendance-form" onSubmit={handleAttendanceSubmit} className="space-y-6">
                            <div className="form-group">
                                <label>Student Candidate</label>
                                <SearchableSelect placeholder="Search student..." options={students.map(s => ({ id: s.id.toString(), label: `${s.admission_number} - ${s.full_name}` }))} value={attendanceFormData.student} onChange={(v) => setAttendanceFormData({ ...attendanceFormData, student: v.toString() })} required />
                            </div>
                            <div className="form-group">
                                <label>Presence Status</label>
                                <SearchableSelect options={[{ id: 'PRESENT', label: 'Present' }, { id: 'ABSENT', label: 'Absent' }, { id: 'PERMISSION', label: 'On Permission' }, { id: 'SICK', label: 'Sick Bay/Hospital' }]} value={attendanceFormData.status} onChange={(v) => setAttendanceFormData({ ...attendanceFormData, status: v.toString() })} />
                            </div>
                            <div className="form-group">
                                <label>Remarks / Observations</label>
                                <input type="text" placeholder="e.g. Returned late from library" value={attendanceFormData.remarks} onChange={(e) => setAttendanceFormData({ ...attendanceFormData, remarks: e.target.value })} />
                            </div>
                        </form>
                    )}
                </div>
            </Modal>

            {/* Asset Modal */}
            <Modal
                isOpen={isAssetModalOpen}
                onClose={() => setIsAssetModalOpen(false)}
                title={assetId ? "Edit Asset" : "Record New Asset"}
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setIsAssetModalOpen(false)}>Cancel</button>
                        <button type="submit" form="asset-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "SAVING..." : "SAVE ASSET"}
                        </button>
                    </>
                }
            >
                <form id="asset-form" onSubmit={handleAssetSubmit} className="space-y-6">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Internal Asset Code</label>
                            <input type="text" placeholder="e.g. HOS-BED-001" className="font-mono" value={assetFormData.asset_code} onChange={(e) => setAssetFormData({ ...assetFormData, asset_code: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Asset Classification</label>
                            <SearchableSelect options={[{ id: 'FURNITURE', label: 'Furniture' }, { id: 'ELECTRONICS', label: 'Electronics' }, { id: 'BEDDING', label: 'Bedding' }, { id: 'OTHER', label: 'Other' }]} value={assetFormData.type || assetFormData.asset_type} onChange={(v) => setAssetFormData({ ...assetFormData, asset_type: v.toString(), type: v.toString() })} />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Primary Location (Hostel)</label>
                            <SearchableSelect options={hostels.map(h => ({ id: h.id.toString(), label: h.name }))} value={assetFormData.hostel} onChange={(v) => setAssetFormData({ ...assetFormData, hostel: v.toString(), room: '' })} required />
                        </div>
                        <div className="form-group">
                            <label>Assigned Room (Optional)</label>
                            <SearchableSelect options={rooms.filter(r => String(r.hostel) === String(assetFormData.hostel)).map(r => ({ id: r.id.toString(), label: `Room ${r.room_number}` }))} value={assetFormData.room} onChange={(v) => setAssetFormData({ ...assetFormData, room: v.toString() })} />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Valuation (KES)</label>
                            <input type="number" placeholder="0.00" value={assetFormData.value} onChange={(e) => setAssetFormData({ ...assetFormData, value: Number(e.target.value) })} />
                        </div>
                        <div className="form-group">
                            <label>Physical Condition</label>
                            <SearchableSelect options={[{ id: 'GOOD', label: 'Good / Serviceable' }, { id: 'FAIR', label: 'Fair / Worn' }, { id: 'DAMAGED', label: 'Damaged / Broken' }, { id: 'LOST', label: 'Missing / Lost' }]} value={assetFormData.condition} onChange={(v) => setAssetFormData({ ...assetFormData, condition: v.toString() })} />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Discipline Modal */}
            <Modal
                isOpen={isDisciplineModalOpen}
                onClose={() => setIsDisciplineModalOpen(false)}
                title={disciplineId ? "Edit Record" : "Log Disciplinary Incident"}
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setIsDisciplineModalOpen(false)}>Cancel</button>
                        <button type="submit" form="discipline-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "LOGGING..." : "LOG INCIDENT"}
                        </button>
                    </>
                }
            >
                <form id="discipline-form" onSubmit={handleDisciplineSubmit} className="space-y-6">
                    <div className="form-group">
                        <label>Student Involved</label>
                        <SearchableSelect placeholder="Search student..." options={students.map(s => ({ id: s.id.toString(), label: `${s.admission_number} - ${s.full_name}` }))} value={disciplineFormData.student} onChange={(v) => setDisciplineFormData({ ...disciplineFormData, student: v.toString() })} required />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Incident Date</label>
                            <PremiumDateInput value={disciplineFormData.date} onChange={(d) => setDisciplineFormData({ ...disciplineFormData, date: d })} required />
                        </div>
                        <div className="form-group">
                            <label>Severity Level</label>
                            <SearchableSelect options={[{ id: 'MINOR', label: 'Minor' }, { id: 'MODERATE', label: 'Moderate' }, { id: 'MAJOR', label: 'Major' }, { id: 'CRITICAL', label: 'Critical' }]} value={disciplineFormData.severity} onChange={(v) => setDisciplineFormData({ ...disciplineFormData, severity: v.toString() })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Offence Title / Summary</label>
                        <input type="text" placeholder="e.g. Breaking Curfew" value={disciplineFormData.offence} onChange={(e) => setDisciplineFormData({ ...disciplineFormData, offence: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Detailed Incident Description</label>
                        <textarea className="h-32" placeholder="Provide full details of the incident..." value={disciplineFormData.description} onChange={(e) => setDisciplineFormData({ ...disciplineFormData, description: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Action Taken / Recommendation</label>
                        <input type="text" placeholder="e.g. Issued verbal warning" value={disciplineFormData.action_taken} onChange={(e) => setDisciplineFormData({ ...disciplineFormData, action_taken: e.target.value })} />
                    </div>
                </form>
            </Modal>

            {/* Maintenance Modal */}
            <Modal
                isOpen={isMaintenanceModalOpen}
                onClose={() => setIsMaintenanceModalOpen(false)}
                title={maintenanceId ? "Edit Request" : "Log Maintenance Request"}
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setIsMaintenanceModalOpen(false)}>Cancel</button>
                        <button type="submit" form="maintenance-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "SUBMITTING..." : "SUBMIT REQUEST"}
                        </button>
                    </>
                }
            >
                <form id="maintenance-form" onSubmit={handleMaintenanceSubmit} className="space-y-6">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Target Hostel</label>
                            <SearchableSelect options={hostels.map(h => ({ id: h.id.toString(), label: h.name }))} value={maintenanceFormData.hostel} onChange={(v) => setMaintenanceFormData({ ...maintenanceFormData, hostel: v.toString(), room: '' })} required />
                        </div>
                        <div className="form-group">
                            <label>Specific Room / Zone</label>
                            <SearchableSelect placeholder="General/Common Area" options={[{ id: '', label: 'General/Common Area' }, ...rooms.filter(r => String(r.hostel) === String(maintenanceFormData.hostel)).map(r => ({ id: r.id.toString(), label: `Room ${r.room_number}` }))]} value={maintenanceFormData.room} onChange={(v) => setMaintenanceFormData({ ...maintenanceFormData, room: v.toString() })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Fault / Issue Description</label>
                        <textarea className="h-32" placeholder="Describe the physical issue or repair needed..." value={maintenanceFormData.issue} onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, issue: e.target.value })} required />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Estimated Repair Cost (KES)</label>
                            <input type="number" placeholder="0.00" value={maintenanceFormData.repair_cost} onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, repair_cost: Number(e.target.value) })} />
                        </div>
                        <div className="form-group">
                            <label>Resolution Status</label>
                            <SearchableSelect options={[{ id: 'PENDING', label: 'Pending / Logged' }, { id: 'IN_PROGRESS', label: 'Repair In Progress' }, { id: 'COMPLETED', label: 'Fixed / Completed' }, { id: 'CANCELLED', label: 'Cancelled' }]} value={maintenanceFormData.status} onChange={(v) => setMaintenanceFormData({ ...maintenanceFormData, status: v.toString() })} />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* View Residents Modal */}
            <Modal
                isOpen={isViewResidentsModalOpen}
                onClose={() => setIsViewResidentsModalOpen(false)}
                title={`Resident Directory: ${selectedHostel?.name || 'Hostel'}`}
                footer={<button type="button" className="modern-btn modern-btn-secondary" onClick={() => setIsViewResidentsModalOpen(false)}>Close</button>}
            >
                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Resident Student</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Admission</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Room No.</th>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Bed ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {viewHostelResidents.length > 0 ? (
                                viewHostelResidents.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-black text-slate-800">{r.student_name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-400 font-mono tracking-tight">{r.admission_number}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase">#{r.room_number}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[10px] font-black text-primary uppercase">Bed {r.bed_number}</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">No active residents detected in this sector</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </>
    );
};

export default HostelModals;

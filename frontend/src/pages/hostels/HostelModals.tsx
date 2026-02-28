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
    hostels, rooms, beds, students, staff, isSubmitting
}) => {
    return (
        <>
            {/* Hostel Modal */}
            <Modal isOpen={isHostelModalOpen} onClose={() => setIsHostelModalOpen(false)} title={hostelId ? "Edit Hostel" : "Add New Hostel"}>
                <form onSubmit={handleHostelSubmit} className="space-y-4">
                    <div className="form-group"><label className="label">Hostel Name</label><input type="text" className="input" value={hostelFormData.name} onChange={(e) => setHostelFormData({ ...hostelFormData, name: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Gender Allowed</label>
                            <SearchableSelect options={[{ id: 'M', label: 'Male' }, { id: 'F', label: 'Female' }, { id: 'B', label: 'Mixed' }]} value={hostelFormData.gender_allowed} onChange={(v) => setHostelFormData({ ...hostelFormData, gender_allowed: v.toString() })} />
                        </div>
                        <div className="form-group">
                            <label className="label">Type</label>
                            <SearchableSelect options={[{ id: 'BOARDING', label: 'Boarding' }, { id: 'COLLEGE', label: 'College' }]} value={hostelFormData.hostel_type} onChange={(v) => setHostelFormData({ ...hostelFormData, hostel_type: v.toString() })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Capacity</label><input type="number" className="input" value={hostelFormData.capacity} onChange={(e) => setHostelFormData({ ...hostelFormData, capacity: Number(e.target.value) })} required /></div>
                        <div className="form-group">
                            <label className="label">Hostel Warden</label>
                            <SearchableSelect placeholder="Select Staff" options={staff.map(s => ({ id: s.id.toString(), label: s.full_name }))} value={hostelFormData.warden} onChange={(v) => setHostelFormData({ ...hostelFormData, warden: v.toString() })} />
                        </div>
                    </div>
                    <div className="modal-action"><Button type="button" variant="ghost" onClick={() => setIsHostelModalOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={isSubmitting}>{hostelId ? "Update" : "Save"}</Button></div>
                </form>
            </Modal>

            {/* Room Modal */}
            <Modal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title={roomId ? "Edit Room" : "Add New Room"}>
                <form onSubmit={handleRoomSubmit} className="space-y-4">
                    <div className="form-group">
                        <label className="label">Target Hostel</label>
                        <SearchableSelect options={hostels.map(h => ({ id: h.id.toString(), label: h.name }))} value={roomFormData.hostel} onChange={(v) => setRoomFormData({ ...roomFormData, hostel: v.toString() })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Room Number</label><input type="text" className="input" value={roomFormData.room_number} onChange={(e) => setRoomFormData({ ...roomFormData, room_number: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Floor / Wing</label><input type="text" className="input" value={roomFormData.floor} onChange={(e) => setRoomFormData({ ...roomFormData, floor: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Room Type</label>
                            <SearchableSelect options={[{ id: 'DORM', label: 'Dormitory' }, { id: 'STUDIO', label: 'Studio' }, { id: 'DOUBLE', label: 'Double' }, { id: 'SINGLE', label: 'Single' }]} value={roomFormData.room_type} onChange={(v) => setRoomFormData({ ...roomFormData, room_type: v.toString() })} />
                        </div>
                        <div className="form-group"><label className="label">Capacity (Beds)</label><input type="number" className="input" value={roomFormData.capacity} onChange={(e) => setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) })} required /></div>
                    </div>
                    <div className="modal-action"><Button type="button" variant="ghost" onClick={() => setIsRoomModalOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={isSubmitting}>Save Room</Button></div>
                </form>
            </Modal>

            {/* Allocation Modal */}
            <Modal isOpen={isAllocationModalOpen} onClose={() => { setIsAllocationModalOpen(false); }} title={isTransferMode ? "Transfer Student" : allocationId ? "Edit Allocation" : "Student Admission to Hostel"}>
                <form onSubmit={handleAllocationSubmit} className="space-y-4">
                    <SearchableSelect label="Student" placeholder="Search student..." options={students.map(s => ({ id: s.id.toString(), label: `${s.admission_number} - ${s.full_name}` }))} value={allocationFormData.student} onChange={(v) => setAllocationFormData({ ...allocationFormData, student: v.toString() })} disabled={isTransferMode || allocationId !== null} required />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Hostel</label>
                            <SearchableSelect options={hostels.map(h => ({ id: h.id.toString(), label: h.name }))} value={allocationFormData.hostel} onChange={(v) => setAllocationFormData({ ...allocationFormData, hostel: v.toString(), room: '', bed: '' })} required />
                        </div>
                        <div className="form-group">
                            <label className="label">Room</label>
                            <SearchableSelect options={rooms.filter(r => String(r.hostel) === String(allocationFormData.hostel)).map(r => ({ id: r.id.toString(), label: `Room ${r.room_number} (${r.available_beds} beds left)` }))} value={allocationFormData.room} onChange={(v) => setAllocationFormData({ ...allocationFormData, room: v.toString(), bed: '' })} disabled={!allocationFormData.hostel} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="label">Available Bed</label>
                        <SearchableSelect options={beds.filter(b => String(b.room) === String(allocationFormData.room) && (b.is_available || String(b.id) === String(allocationFormData.bed))).map(b => ({ id: b.id.toString(), label: `Bed ${b.bed_number}` }))} value={allocationFormData.bed} onChange={(v) => setAllocationFormData({ ...allocationFormData, bed: v.toString() })} disabled={!allocationFormData.room} required />
                    </div>
                    <div className="modal-action"><Button type="button" variant="ghost" onClick={() => setIsAllocationModalOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={isSubmitting}>{isTransferMode ? "Transfer" : "Confirm Admission"}</Button></div>
                </form>
            </Modal>

            {/* Attendance Modal */}
            <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title={attendanceMode === 'BULK' ? "Room Roll Call" : (attendanceId ? "Edit Attendance" : "Log Attendance")}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <PremiumDateInput label="Date" value={attendanceFormData.date} onChange={(d) => setAttendanceFormData({ ...attendanceFormData, date: d })} required />
                        <div className="form-group">
                            <label className="label">Session</label>
                            <SearchableSelect options={[{ id: 'MORNING', label: 'Morning' }, { id: 'EVENING', label: 'Evening' }, { id: 'SPECIAL', label: 'Special Check' }]} value={attendanceFormData.session} onChange={(v) => setAttendanceFormData({ ...attendanceFormData, session: v.toString() })} />
                        </div>
                    </div>

                    {attendanceMode === 'BULK' ? (
                        <div className="space-y-4">
                            <SearchableSelect label="Select Room" options={rooms.map(r => ({ id: r.id.toString(), label: `Room ${r.room_number} (${rooms.find(rm => rm.id === r.id)?.hostel_name || 'N/A'})` }))} value={bulkAttendanceRoom !== null ? bulkAttendanceRoom.toString() : ''} onChange={(v) => setBulkAttendanceRoom(Number(v))} />
                            {bulkAttendanceRoom && (
                                <div className="max-h-96 overflow-y-auto border rounded-lg p-2 space-y-2 bg-slate-50">
                                    {students.filter(s => s.current_room === bulkAttendanceRoom).map(s => (
                                        <div key={s.id} className="bg-white p-3 rounded-md shadow-sm border flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-sm">{s.full_name}</span>
                                                <div className="flex gap-2">
                                                    {['PRESENT', 'ABSENT', 'PERMISSION'].map(st => (
                                                        <button key={st} onClick={() => setBulkAttendanceData({ ...bulkAttendanceData, [s.id]: { ...bulkAttendanceData[s.id], status: st } })} className={`btn btn-xs ${bulkAttendanceData[s.id]?.status === st ? (st === 'PRESENT' ? 'btn-success' : st === 'ABSENT' ? 'btn-error' : 'btn-warning') : 'btn-outline opacity-50'}`}>
                                                            {st[0]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <input type="text" placeholder="Remarks..." className="input input-xs bg-slate-50 border-none" value={bulkAttendanceData[s.id]?.remarks || ''} onChange={(e) => setBulkAttendanceData({ ...bulkAttendanceData, [s.id]: { ...bulkAttendanceData[s.id], remarks: e.target.value } })} />
                                        </div>
                                    ))}
                                    {students.filter(s => s.current_room === bulkAttendanceRoom).length === 0 && <p className="text-center py-6 text-slate-400 italic">No students assigned to this room</p>}
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                            <SearchableSelect label="Student" options={students.map(s => ({ id: s.id.toString(), label: `${s.admission_number} - ${s.full_name}` }))} value={attendanceFormData.student} onChange={(v) => setAttendanceFormData({ ...attendanceFormData, student: v.toString() })} required />
                            <div className="form-group">
                                <label className="label">Status</label>
                                <SearchableSelect options={[{ id: 'PRESENT', label: 'Present' }, { id: 'ABSENT', label: 'Absent' }, { id: 'PERMISSION', label: 'On Permission' }, { id: 'SICK', label: 'In Sanatorium' }]} value={attendanceFormData.status} onChange={(v) => setAttendanceFormData({ ...attendanceFormData, status: v.toString() })} />
                            </div>
                            <div className="form-group"><label className="label">Remarks</label><input type="text" className="input" value={attendanceFormData.remarks} onChange={(e) => setAttendanceFormData({ ...attendanceFormData, remarks: e.target.value })} /></div>
                            <div className="modal-action"><Button type="button" variant="ghost" onClick={() => setIsAttendanceModalOpen(false)}>Cancel</Button><Button type="submit" variant="primary">Log Status</Button></div>
                        </form>
                    )}
                    {attendanceMode === 'BULK' && <div className="modal-action"><Button type="button" variant="ghost" onClick={() => setIsAttendanceModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleBulkAttendanceSubmit} disabled={!bulkAttendanceRoom || Object.keys(bulkAttendanceData).length === 0}>Submit Roll Call</Button></div>}
                </div>
            </Modal>

            {/* Asset Modal */}
            <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} title={assetId ? "Edit Asset" : "Record New Asset"}>
                <form onSubmit={handleAssetSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Asset Code</label><input type="text" className="input font-mono text-sm" value={assetFormData.asset_code} onChange={(e) => setAssetFormData({ ...assetFormData, asset_code: e.target.value })} required /></div>
                        <div className="form-group">
                            <label className="label">Category</label>
                            <SearchableSelect options={[{ id: 'FURNITURE', label: 'Furniture' }, { id: 'ELECTRONICS', label: 'Electronics' }, { id: 'BEDDING', label: 'Bedding' }, { id: 'OTHER', label: 'Other' }]} value={assetFormData.type || assetFormData.asset_type} onChange={(v) => setAssetFormData({ ...assetFormData, asset_type: v.toString(), type: v.toString() })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Location (Hostel)</label>
                            <SearchableSelect options={hostels.map(h => ({ id: h.id.toString(), label: h.name }))} value={assetFormData.hostel} onChange={(v) => setAssetFormData({ ...assetFormData, hostel: v.toString(), room: '' })} required />
                        </div>
                        <div className="form-group">
                            <label className="label">Room (Optional)</label>
                            <SearchableSelect options={rooms.filter(r => String(r.hostel) === String(assetFormData.hostel)).map(r => ({ id: r.id.toString(), label: `Room ${r.room_number}` }))} value={assetFormData.room} onChange={(v) => setAssetFormData({ ...assetFormData, room: v.toString() })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Valuation (KES)</label><input type="number" className="input" value={assetFormData.value} onChange={(e) => setAssetFormData({ ...assetFormData, value: Number(e.target.value) })} /></div>
                        <div className="form-group">
                            <label className="label">Condition</label>
                            <SearchableSelect options={[{ id: 'GOOD', label: 'Good' }, { id: 'FAIR', label: 'Fair/Worn' }, { id: 'DAMAGED', label: 'Damaged' }, { id: 'LOST', label: 'Lost' }]} value={assetFormData.condition} onChange={(v) => setAssetFormData({ ...assetFormData, condition: v.toString() })} />
                        </div>
                    </div>
                    <div className="modal-action"><Button type="button" variant="ghost" onClick={() => setIsAssetModalOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={isSubmitting}>Save Asset</Button></div>
                </form>
            </Modal>

            {/* Discipline Modal */}
            <Modal isOpen={isDisciplineModalOpen} onClose={() => setIsDisciplineModalOpen(false)} title={disciplineId ? "Edit Record" : "Log Disciplinary Incident"}>
                <form onSubmit={handleDisciplineSubmit} className="space-y-4">
                    <SearchableSelect label="Student" options={students.map(s => ({ id: s.id.toString(), label: `${s.admission_number} - ${s.full_name}` }))} value={disciplineFormData.student} onChange={(v) => setDisciplineFormData({ ...disciplineFormData, student: v.toString() })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <PremiumDateInput label="Incident Date" value={disciplineFormData.date} onChange={(d) => setDisciplineFormData({ ...disciplineFormData, date: d })} required />
                        <div className="form-group">
                            <label className="label">Severity</label>
                            <SearchableSelect options={[{ id: 'MINOR', label: 'Minor' }, { id: 'MODERATE', label: 'Moderate' }, { id: 'MAJOR', label: 'Major' }, { id: 'CRITICAL', label: 'Critical' }]} value={disciplineFormData.severity} onChange={(v) => setDisciplineFormData({ ...disciplineFormData, severity: v.toString() })} />
                        </div>
                    </div>
                    <div className="form-group"><label className="label">Offence Title</label><input type="text" className="input" value={disciplineFormData.offence} onChange={(e) => setDisciplineFormData({ ...disciplineFormData, offence: e.target.value })} required /></div>
                    <div className="form-group"><label className="label">Description</label><textarea className="textarea h-24" value={disciplineFormData.description} onChange={(e) => setDisciplineFormData({ ...disciplineFormData, description: e.target.value })} /></div>
                    <div className="form-group"><label className="label">Action Taken</label><input type="text" className="input" value={disciplineFormData.action_taken} onChange={(e) => setDisciplineFormData({ ...disciplineFormData, action_taken: e.target.value })} /></div>
                    <div className="modal-action"><Button type="button" variant="ghost" onClick={() => setIsDisciplineModalOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={isSubmitting}>Log Incident</Button></div>
                </form>
            </Modal>

            {/* Maintenance Modal */}
            <Modal isOpen={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} title={maintenanceId ? "Edit Request" : "Log Maintenance Request"}>
                <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Hostel</label>
                            <SearchableSelect options={hostels.map(h => ({ id: h.id.toString(), label: h.name }))} value={maintenanceFormData.hostel} onChange={(v) => setMaintenanceFormData({ ...maintenanceFormData, hostel: v.toString(), room: '' })} required />
                        </div>
                        <div className="form-group">
                            <label className="label">Room/Zone</label>
                            <SearchableSelect options={[{ id: '', label: 'General/Common Area' }, ...rooms.filter(r => String(r.hostel) === String(maintenanceFormData.hostel)).map(r => ({ id: r.id.toString(), label: `Room ${r.room_number}` }))]} value={maintenanceFormData.room} onChange={(v) => setMaintenanceFormData({ ...maintenanceFormData, room: v.toString() })} />
                        </div>
                    </div>
                    <div className="form-group"><label className="label">Issue Description</label><textarea className="textarea h-24" value={maintenanceFormData.issue} onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, issue: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Estimated Cost (KES)</label><input type="number" className="input" value={maintenanceFormData.repair_cost} onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, repair_cost: Number(e.target.value) })} /></div>
                        <div className="form-group">
                            <label className="label">Current Status</label>
                            <SearchableSelect options={[{ id: 'PENDING', label: 'Pending' }, { id: 'IN_PROGRESS', label: 'In Progress' }, { id: 'COMPLETED', label: 'Completed' }, { id: 'CANCELLED', label: 'Cancelled' }]} value={maintenanceFormData.status} onChange={(v) => setMaintenanceFormData({ ...maintenanceFormData, status: v.toString() })} />
                        </div>
                    </div>
                    <div className="modal-action"><Button type="button" variant="ghost" onClick={() => setIsMaintenanceModalOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={isSubmitting}>Submit Request</Button></div>
                </form>
            </Modal>

            {/* View Residents Modal */}
            <Modal isOpen={isViewResidentsModalOpen} onClose={() => setIsViewResidentsModalOpen(false)} title={`Residents in ${selectedHostel?.name || 'Hostel'}`}>
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead><tr><th>Student</th><th>Admission</th><th>Room</th><th>Bed</th></tr></thead>
                        <tbody>
                            {viewHostelResidents.length > 0 ? (
                                viewHostelResidents.map((r: any) => (
                                    <tr key={r.id}>
                                        <td className="font-bold">{r.student_name}</td>
                                        <td>{r.admission_number}</td>
                                        <td>{r.room_number}</td>
                                        <td>{r.bed_number}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={4} className="text-center py-10 italic text-slate-400">No active residents found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="modal-action"><Button variant="ghost" onClick={() => setIsViewResidentsModalOpen(false)}>Close</Button></div>
            </Modal>

            {/* View Rooms Modal */}
            <Modal isOpen={isViewRoomsModalOpen} onClose={() => setIsViewRoomsModalOpen(false)} title={`Rooms in ${selectedHostel?.name}`}>
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
                        <div className="text-xs font-bold uppercase text-secondary">Hostel: {selectedHostel?.name}</div>
                        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => openAddRoom(selectedHostel)}>Add Room</Button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="table w-full table-compact">
                            <thead><tr><th>No.</th><th>Type</th><th>Floor</th><th>Beds</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {rooms.filter(r => String(r.hostel) === String(selectedHostel?.id)).map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50">
                                        <td className="font-bold">#{r.room_number}</td>
                                        <td>{r.room_type}</td>
                                        <td>{r.floor}</td>
                                        <td>{r.available_beds} / {r.capacity}</td>
                                        <td><div className="flex items-center gap-1"><div className={`w-2 h-2 rounded-full ${r.available_beds > 0 ? 'bg-success' : 'bg-error'}`}></div><span className="text-[10px] uppercase font-bold text-secondary">{r.available_beds > 0 ? 'Available' : 'Full'}</span></div></td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button className="btn btn-ghost btn-xs text-primary" onClick={() => openEditRoom(r)}><Edit size={12} /></button>
                                                <button className="btn btn-ghost btn-xs text-success" onClick={() => openViewResidents({ ...selectedHostel, roomFilter: r.id })}><Users size={12} /></button>
                                                <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDeleteRoom(r.id)}><Trash2 size={12} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {rooms.filter(r => String(r.hostel) === String(selectedHostel?.id)).length === 0 && <tr><td colSpan={6} className="text-center py-6 italic text-slate-400">No rooms added to this hostel</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="modal-action"><Button variant="ghost" onClick={() => setIsViewRoomsModalOpen(false)}>Close</Button></div>
            </Modal>
        </>
    );
};

export default HostelModals;

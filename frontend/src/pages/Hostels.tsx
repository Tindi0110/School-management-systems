import React, { useEffect, useState } from 'react';
import { Search, Printer, Plus } from 'lucide-react';
import { hostelAPI, studentsAPI, staffAPI } from '../api/api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';

// Modular Components
import HostelDashboard from './hostels/HostelDashboard';
import HostelRegistry from './hostels/HostelRegistry';
import AllocationManager from './hostels/AllocationManager';
import AttendanceManager from './hostels/AttendanceManager';
import HostelLogManager from './hostels/HostelLogManager';
import HostelModals from './hostels/HostelModals';

const Hostels = () => {
    const [activeTab, setActiveTab] = useState('registry');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success, error: toastError } = useToast();
    const { confirm } = useConfirm();

    // Data State
    const [hostels, setHostels] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [beds, setBeds] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<any[]>([]);
    const [allAllocations, setAllAllocations] = useState<any[]>([]); // For lookups
    const [attendance, setAttendance] = useState<any[]>([]);
    const [discipline, setDiscipline] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [maintenance, setMaintenance] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalHostels: 0, totalCapacity: 0, totalResidents: 0, maintenanceIssues: 0 });

    // UI/Modal/Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHostel, setSelectedHostel] = useState<any>(null);
    const [viewHostelResidents, setViewHostelResidents] = useState<any[]>([]);
    const [isHostelModalOpen, setIsHostelModalOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [isViewResidentsModalOpen, setIsViewResidentsModalOpen] = useState(false);
    const [isViewRoomsModalOpen, setIsViewRoomsModalOpen] = useState(false);

    // ID States for Edit
    const [hostelId, setHostelId] = useState<number | null>(null);
    const [roomId, setRoomId] = useState<number | null>(null);
    const [allocationId, setAllocationId] = useState<number | null>(null);
    const [assetId, setAssetId] = useState<number | null>(null);
    const [attendanceId, setAttendanceId] = useState<number | null>(null);
    const [disciplineId, setDisciplineId] = useState<number | null>(null);
    const [maintenanceId, setMaintenanceId] = useState<number | null>(null);

    // Form Data
    const [hostelFormData, setHostelFormData] = useState({ name: '', gender_allowed: 'M', hostel_type: 'BOARDING', capacity: 100, warden: '' });
    const [roomFormData, setRoomFormData] = useState({ hostel: '', room_number: '', room_type: 'DORM', floor: 'Ground', capacity: 4 });
    const [allocationFormData, setAllocationFormData] = useState({ student: '', hostel: '', room: '', bed: '', status: 'ACTIVE' });
    const [isTransferMode, setIsTransferMode] = useState(false);
    const [assetFormData, setAssetFormData] = useState<any>({ asset_code: '', asset_type: 'FURNITURE', type: 'FURNITURE', condition: 'GOOD', value: 0, quantity: 1, hostel: '', room: '' });
    const [attendanceFormData, setAttendanceFormData] = useState<any>({ student: '', date: new Date().toISOString().split('T')[0], status: 'PRESENT', session: 'EVENING', remarks: '' });
    const [disciplineFormData, setDisciplineFormData] = useState({ student: '', offence: '', description: '', date: new Date().toISOString().split('T')[0], action_taken: '', severity: 'MINOR' });
    const [maintenanceFormData, setMaintenanceFormData] = useState({ hostel: '', room: '', issue: '', repair_cost: 0, status: 'PENDING', date: new Date().toISOString().split('T')[0] });

    // Bulk Attendance
    const [attendanceMode, setAttendanceMode] = useState<'SINGLE' | 'BULK'>('SINGLE');
    const [bulkAttendanceRoom, setBulkAttendanceRoom] = useState<number | null>(null);
    const [bulkAttendanceData, setBulkAttendanceData] = useState<{ [studentId: number]: { status: string, remarks: string } }>({});

    // Pagination
    const PAGE_SIZE = 25;
    const [allocPage, setAllocPage] = useState(1); const [allocTotal, setAllocTotal] = useState(0);
    const [discPage, setDiscPage] = useState(1); const [discTotal, setDiscTotal] = useState(0);
    const [assetPage, setAssetPage] = useState(1); const [assetTotal, setAssetTotal] = useState(0);
    const [attnPage, setAttnPage] = useState(1); const [attnTotal, setAttnTotal] = useState(0);
    const [maintPage, setMaintPage] = useState(1); const [maintTotal, setMaintTotal] = useState(0);

    // Loaders
    const loadData = async () => {
        setLoading(hostels.length === 0);
        try {
            const d = (r: any) => r?.data?.results ?? r?.data ?? [];
            const [hRes, sRes, studRes, rRes, bRes, stfRes, allAllocRes] = await Promise.all([
                hostelAPI.hostels.getAll(), hostelAPI.hostels.getStats(), studentsAPI.getAll({ page_size: 500 }),
                hostelAPI.rooms.getAll({ page_size: 500 }), hostelAPI.beds.getAll({ page_size: 1000 }), staffAPI.getAll({ page_size: 100 }),
                hostelAPI.allocations.getAll({ status: 'ACTIVE', page_size: 500 })
            ]);
            setHostels(d(hRes)); setStats(sRes.data); setStudents(d(studRes)); setRooms(d(rRes)); setBeds(d(bRes)); setStaff(d(stfRes)); setAllAllocations(d(allAllocRes));
            loadTabSpecificData();
        } catch (err) { toastError("Data sync lag detected."); }
        finally { setLoading(false); }
    };

    const loadTabSpecificData = async () => {
        const d = (r: any) => r?.data?.results ?? r?.data ?? [];
        const t = (r: any) => r?.data?.count ?? 0;
        const p = { page_size: PAGE_SIZE, search: searchTerm };

        if (activeTab === 'allocations') { const res = await hostelAPI.allocations.getAll({ ...p, page: allocPage }); setAllocations(d(res)); setAllocTotal(t(res)); }
        else if (activeTab === 'discipline') { const res = await hostelAPI.discipline.getAll({ ...p, page: discPage }); setDiscipline(d(res)); setDiscTotal(t(res)); }
        else if (activeTab === 'assets') { const res = await hostelAPI.assets.getAll({ ...p, page: assetPage }); setAssets(d(res)); setAssetTotal(t(res)); }
        else if (activeTab === 'attendance') { const res = await hostelAPI.attendance.getAll({ ...p, page: attnPage }); setAttendance(d(res)); setAttnTotal(t(res)); }
        else if (activeTab === 'maintenance') { const res = await hostelAPI.maintenance.getAll({ ...p, page: maintPage }); setMaintenance(d(res)); setMaintTotal(t(res)); }
    };

    useEffect(() => { loadData(); }, []);
    useEffect(() => { loadTabSpecificData(); }, [activeTab, allocPage, discPage, assetPage, attnPage, maintPage, searchTerm]);

    // Handlers (Refactored/Mapped)
    const handleHostelSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            if (hostelId) await hostelAPI.hostels.update(hostelId, hostelFormData); else await hostelAPI.hostels.create(hostelFormData);
            success(hostelId ? 'Hostel updated' : 'Hostel created');
            setIsHostelModalOpen(false); loadData();
        } catch (err: any) { toastError(err.message || 'Error saving hostel'); }
        finally { setIsSubmitting(false); }
    };

    const handleRoomSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const payload = { ...roomFormData, hostel: Number(roomFormData.hostel), capacity: Number(roomFormData.capacity) };
            if (roomId) await hostelAPI.rooms.update(roomId, payload); else await hostelAPI.rooms.create(payload);
            success('Room saved'); setIsRoomModalOpen(false); loadData();
        } catch (err: any) { toastError('Error saving room'); }
        finally { setIsSubmitting(false); }
    };

    const handleAllocationSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            if (isTransferMode && allocationId) { await hostelAPI.allocations.transfer(allocationId, Number(allocationFormData.bed)); success('Transferred'); }
            else {
                const p = { student: Number(allocationFormData.student), room: Number(allocationFormData.room), bed: Number(allocationFormData.bed), status: allocationFormData.status };
                if (allocationId) await hostelAPI.allocations.update(allocationId, p); else await hostelAPI.allocations.create(p);
                success('Allocation saved');
            }
            setIsAllocationModalOpen(false); loadData();
        } catch (err: any) { toastError('Allocation failed'); }
        finally { setIsSubmitting(false); }
    };

    const handleAttendanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const p = { ...attendanceFormData, student: Number(attendanceFormData.student) };
            if (attendanceId) await hostelAPI.attendance.update(attendanceId, p); else await hostelAPI.attendance.create(p);
            success('Logged'); setIsAttendanceModalOpen(false); loadData();
        } catch (err: any) { toastError('Log failed'); }
        finally { setIsSubmitting(false); }
    };

    const handleBulkAttendanceSubmit = async () => {
        if (!bulkAttendanceRoom) return;
        setIsSubmitting(true);
        try {
            const records = Object.entries(bulkAttendanceData).map(([id, data]: [string, any]) => ({ student_id: Number(id), status: data.status, remarks: data.remarks || '' }));
            const payload = { room_id: bulkAttendanceRoom, date: attendanceFormData.date, session: attendanceFormData.session, attendance_data: records };
            await hostelAPI.attendance.bulkMark(payload);
            success('Roll call submitted'); setIsAttendanceModalOpen(false); setBulkAttendanceData({}); loadData();
        } catch (err: any) { toastError('Bulk log failed'); }
        finally { setIsSubmitting(false); }
    };

    const handleAssetSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const p = { ...assetFormData, hostel: Number(assetFormData.hostel), room: assetFormData.room ? Number(assetFormData.room) : null, quantity: Number(assetFormData.quantity || 1) };
            if (assetId) await hostelAPI.assets.update(assetId, p); else await hostelAPI.assets.create(p);
            success('Asset saved'); setIsAssetModalOpen(false); loadData();
        } catch (err: any) { toastError('Error saving asset'); }
        finally { setIsSubmitting(false); }
    };

    const handleDisciplineSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const p = { student: Number(disciplineFormData.student), incident_date: disciplineFormData.date, offence: disciplineFormData.offence, description: disciplineFormData.description, action_taken: disciplineFormData.action_taken, severity: disciplineFormData.severity };
            if (disciplineId) await hostelAPI.discipline.update(disciplineId, p); else await hostelAPI.discipline.create(p);
            success('Discipline logged'); setIsDisciplineModalOpen(false); loadData();
        } catch (err: any) { toastError('Log failed'); }
        finally { setIsSubmitting(false); }
    };

    const handleMaintenanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const p = { hostel: Number(maintenanceFormData.hostel), room: maintenanceFormData.room ? Number(maintenanceFormData.room) : null, issue: maintenanceFormData.issue, repair_cost: maintenanceFormData.repair_cost, status: maintenanceFormData.status, date_reported: maintenanceFormData.date };
            if (maintenanceId) await hostelAPI.maintenance.update(maintenanceId, p); else await hostelAPI.maintenance.create(p);
            success('Log saved'); setIsMaintenanceModalOpen(false); loadData();
        } catch (err: any) { toastError('Save failed'); }
        finally { setIsSubmitting(false); }
    };

    // Helper functions for Residency lookups
    const openViewResidents = (h: any) => {
        setSelectedHostel(h);
        let residents = allAllocations.filter((a: any) => {
            if (a.status !== 'ACTIVE') return false;
            const room = rooms.find(r => String(r.id) === String(a.room));
            return room && String(room.hostel) === String(h.id);
        });
        if (h.roomFilter) residents = residents.filter((a: any) => String(a.room) === String(h.roomFilter));
        const displayData = residents.map((a: any) => {
            const student = students.find(s => String(s.id) === String(a.student));
            const room = rooms.find(r => String(r.id) === String(a.room));
            const bed = beds.find(b => String(b.id) === String(a.bed));
            return { id: a.id, student_name: student?.full_name || 'Unknown', admission_number: student?.admission_number || '', room_number: room?.room_number || 'N/A', bed_number: bed?.bed_number || 'N/A' };
        });
        setViewHostelResidents(displayData); setIsViewResidentsModalOpen(true);
    };

    const openAddRoom = (h: any) => { setRoomFormData({ hostel: h.id.toString(), room_number: '', room_type: 'DORM', floor: 'Ground', capacity: 4 }); setIsRoomModalOpen(true); };

    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

    return (
        <div className="fade-in px-4 pb-12">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Hostel Ops</h1>
                    <p className="text-secondary text-sm font-medium">Logistics and Residents Registry</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <Button variant="outline" onClick={() => window.print()} icon={<Printer size={18} />}>Report</Button>
                    <Button variant="primary" onClick={() => { setAllocationId(null); setIsTransferMode(false); setIsAllocationModalOpen(true); }} icon={<Plus size={18} />}>New Admission</Button>
                </div>
            </div>

            <HostelDashboard stats={stats} />

            <div className="nav-tab-container no-print mb-6">
                {['registry', 'allocations', 'attendance', 'discipline', 'assets', 'maintenance'].map(tab => (
                    <button key={tab} className={`nav-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab.toUpperCase()}</button>
                ))}
            </div>

            <div className="card mb-6 no-print p-4 bg-slate-50/50">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-50" size={18} />
                    <input type="text" placeholder={`Search ${activeTab}...`} className="input pl-10 h-11 border-none focus:ring-2 ring-primary/20" onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {activeTab === 'registry' && <HostelRegistry hostels={hostels} rooms={rooms} staff={staff} searchTerm={searchTerm} openViewRooms={(h) => { setSelectedHostel(h); setIsViewRoomsModalOpen(true); }} handleEditHostel={(h) => { setHostelId(h.id); setHostelFormData({ name: h.name, gender_allowed: h.gender_allowed, hostel_type: h.hostel_type, capacity: h.capacity, warden: h.warden ? String(h.warden.id || h.warden) : '' }); setIsHostelModalOpen(true); }} openViewResidents={openViewResidents} handleDeleteHostel={async (id) => { if (await confirm('Delete Hostel?')) hostelAPI.hostels.delete(id).then(() => loadData()); }} setIsHostelModalOpen={setIsHostelModalOpen} />}
            {activeTab === 'allocations' && <AllocationManager allocations={allocations} rooms={rooms} hostels={hostels} students={students} allocPage={allocPage} setAllocPage={setAllocPage} allocTotal={allocTotal} pageSize={PAGE_SIZE} setIsAllocationModalOpen={setIsAllocationModalOpen} setAllocationId={setAllocationId} setIsTransferMode={setIsTransferMode} openTransferModal={(a) => { setIsTransferMode(true); setAllocationId(a.id); setAllocationFormData({ student: String(a.student), hostel: '', room: '', bed: '', status: 'ACTIVE' }); setIsAllocationModalOpen(true); }} handleEditAllocation={(a) => { const r = rooms.find(rm => rm.id === a.room); setAllocationId(a.id); setAllocationFormData({ ...a, student: String(a.student), hostel: r ? String(r.hostel) : '', room: String(a.room), bed: String(a.bed) }); setIsAllocationModalOpen(true); }} handleDeleteAllocation={async (id) => { if (await confirm('Delete Allocation?')) hostelAPI.allocations.delete(id).then(() => loadData()); }} />}
            {activeTab === 'attendance' && <AttendanceManager attendance={attendance} students={students} attnPage={attnPage} setAttnPage={setAttnPage} attnTotal={attnTotal} pageSize={PAGE_SIZE} setIsAttendanceModalOpen={setIsAttendanceModalOpen} setAttendanceMode={setAttendanceMode} handleEditAttendance={(a) => { setAttendanceId(a.id); setAttendanceFormData({ ...a, student: String(a.student) }); setAttendanceMode('SINGLE'); setIsAttendanceModalOpen(true); }} handleDeleteAttendance={async (id) => { if (await confirm('Delete Record?')) hostelAPI.attendance.delete(id).then(() => loadData()); }} />}
            {activeTab === 'discipline' && <HostelLogManager type="discipline" data={discipline} page={discPage} setPage={setDiscPage} total={discTotal} pageSize={PAGE_SIZE} students={students} hostels={hostels} onAdd={() => { setDisciplineId(null); setIsDisciplineModalOpen(true); }} onEdit={(d) => { setDisciplineId(d.id); setDisciplineFormData({ ...d, student: String(d.student), date: d.incident_date || d.date }); setIsDisciplineModalOpen(true); }} onDelete={async (id) => { if (await confirm('Delete Record?')) hostelAPI.discipline.delete(id).then(() => loadData()); }} />}
            {activeTab === 'assets' && <HostelLogManager type="assets" data={assets} page={assetPage} setPage={setAssetPage} total={assetTotal} pageSize={PAGE_SIZE} students={students} hostels={hostels} onAdd={() => { setAssetId(null); setIsAssetModalOpen(true); }} onEdit={(a) => { setAssetId(a.id); setAssetFormData({ ...a, hostel: String(a.hostel), room: a.room ? String(a.room) : '' }); setIsAssetModalOpen(true); }} onDelete={async (id) => { if (await confirm('Delete Asset?')) hostelAPI.assets.delete(id).then(() => loadData()); }} />}
            {activeTab === 'maintenance' && <HostelLogManager type="maintenance" data={maintenance} page={maintPage} setPage={setMaintPage} total={maintTotal} pageSize={PAGE_SIZE} students={students} hostels={hostels} onAdd={() => { setMaintenanceId(null); setIsMaintenanceModalOpen(true); }} onEdit={(m) => { setMaintenanceId(m.id); setMaintenanceFormData({ ...m, hostel: String(m.hostel), room: m.room ? String(m.room) : '', date: m.date_reported || m.date }); setIsMaintenanceModalOpen(true); }} onDelete={async (id) => { if (await confirm('Delete Request?')) hostelAPI.maintenance.delete(id).then(() => loadData()); }} />}

            <HostelModals
                isHostelModalOpen={isHostelModalOpen} setIsHostelModalOpen={setIsHostelModalOpen} hostelFormData={hostelFormData} setHostelFormData={setHostelFormData} handleHostelSubmit={handleHostelSubmit} hostelId={hostelId}
                isRoomModalOpen={isRoomModalOpen} setIsRoomModalOpen={setIsRoomModalOpen} roomFormData={roomFormData} setRoomFormData={setRoomFormData} handleRoomSubmit={handleRoomSubmit} roomId={roomId}
                isAllocationModalOpen={isAllocationModalOpen} setIsAllocationModalOpen={setIsAllocationModalOpen} allocationFormData={allocationFormData} setAllocationFormData={setAllocationFormData} handleAllocationSubmit={handleAllocationSubmit} allocationId={allocationId} isTransferMode={isTransferMode}
                isAssetModalOpen={isAssetModalOpen} setIsAssetModalOpen={setIsAssetModalOpen} assetFormData={assetFormData} setAssetFormData={setAssetFormData} handleAssetSubmit={handleAssetSubmit} assetId={assetId}
                isAttendanceModalOpen={isAttendanceModalOpen} setIsAttendanceModalOpen={setIsAttendanceModalOpen} attendanceFormData={attendanceFormData} setAttendanceFormData={setAttendanceFormData} handleAttendanceSubmit={handleAttendanceSubmit} attendanceId={attendanceId} attendanceMode={attendanceMode} setAttendanceMode={setAttendanceMode} bulkAttendanceRoom={bulkAttendanceRoom} setBulkAttendanceRoom={setBulkAttendanceRoom} bulkAttendanceData={bulkAttendanceData} setBulkAttendanceData={setBulkAttendanceData} handleBulkAttendanceSubmit={handleBulkAttendanceSubmit}
                isDisciplineModalOpen={isDisciplineModalOpen} setIsDisciplineModalOpen={setIsDisciplineModalOpen} disciplineFormData={disciplineFormData} setDisciplineFormData={setDisciplineFormData} handleDisciplineSubmit={handleDisciplineSubmit} disciplineId={disciplineId}
                isMaintenanceModalOpen={isMaintenanceModalOpen} setIsMaintenanceModalOpen={setIsMaintenanceModalOpen} maintenanceFormData={maintenanceFormData} setMaintenanceFormData={setMaintenanceFormData} handleMaintenanceSubmit={handleMaintenanceSubmit} maintenanceId={maintenanceId}
                isViewResidentsModalOpen={isViewResidentsModalOpen} setIsViewResidentsModalOpen={setIsViewResidentsModalOpen} viewHostelResidents={viewHostelResidents}
                isViewRoomsModalOpen={isViewRoomsModalOpen} setIsViewRoomsModalOpen={setIsViewRoomsModalOpen} selectedHostel={selectedHostel} openAddRoom={openAddRoom} openEditRoom={(r) => { setRoomId(r.id); setRoomFormData({ ...r, hostel: String(r.hostel) }); setIsRoomModalOpen(true); }} handleDeleteRoom={async (id) => { if (await confirm('Delete Room?')) hostelAPI.rooms.delete(id).then(() => loadData()); }} openViewResidents={openViewResidents}
                hostels={hostels} rooms={rooms} beds={beds} students={students} staff={staff} isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default Hostels;

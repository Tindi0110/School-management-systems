import React, { useEffect, useState } from 'react';
import {
    Plus, Building, Edit, Trash2,
    Building as BuildingIcon, Users as UsersIcon, Printer,
    Package, Wrench, Bed as BedIcon,
    Layout
} from 'lucide-react';
import { hostelAPI, studentsAPI, staffAPI } from '../api/api';
import { exportToCSV } from '../utils/export';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';

const Hostels = () => {
    const [activeTab, setActiveTab] = useState('registry');
    const [hostels, setHostels] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [beds, setBeds] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [discipline, setDiscipline] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [maintenance, setMaintenance] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success, error: toastError } = useToast();
    const { confirm } = useConfirm();


    // Modal & Form States
    // ID States for Edit
    const [hostelId, setHostelId] = useState<number | null>(null);
    const [roomId, setRoomId] = useState<number | null>(null);
    const [allocationId, setAllocationId] = useState<number | null>(null);
    const [assetId, setAssetId] = useState<number | null>(null);
    const [attendanceId, setAttendanceId] = useState<number | null>(null);
    const [disciplineId, setDisciplineId] = useState<number | null>(null);
    const [maintenanceId, setMaintenanceId] = useState<number | null>(null);

    // Bulk Attendance State
    const [attendanceMode, setAttendanceMode] = useState<'SINGLE' | 'BULK'>('SINGLE');
    const [bulkAttendanceRoom, setBulkAttendanceRoom] = useState<number | null>(null);
    const [bulkAttendanceData, setBulkAttendanceData] = useState<{ [studentId: number]: { status: string, remarks: string } }>({});

    // Modal States
    const [isHostelModalOpen, setIsHostelModalOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

    // Form Data
    const [hostelFormData, setHostelFormData] = useState({ name: '', gender_allowed: 'M', hostel_type: 'BOARDING', capacity: 100, warden: '' });
    const [roomFormData, setRoomFormData] = useState({ hostel: '', room_number: '', room_type: 'DORM', floor: 'Ground', capacity: 4 });
    const [allocationFormData, setAllocationFormData] = useState({ student: '', hostel: '', room: '', bed: '', status: 'ACTIVE' }); // Added hostel for cascading
    const [isTransferMode, setIsTransferMode] = useState(false); // New State
    const [allocationSort, setAllocationSort] = useState<'HOSTEL' | 'ROOM' | 'STATUS'>('HOSTEL'); // New State
    const [attendanceSort, setAttendanceSort] = useState<'DATE' | 'HOSTEL' | 'SESSION'>('DATE'); // New State
    const [assetFormData, setAssetFormData] = useState<any>({ asset_code: '', asset_type: 'FURNITURE', type: 'FURNITURE', condition: 'GOOD', value: 0, quantity: 1, hostel: '', room: '' });
    const [attendanceFormData, setAttendanceFormData] = useState<any>({ student: '', date: new Date().toISOString().split('T')[0], status: 'PRESENT', session: 'EVENING', remarks: '' });
    const [assetSort, setAssetSort] = useState({ field: 'asset_code', direction: 'asc' });
    const [disciplineFormData, setDisciplineFormData] = useState({ student: '', offence: '', description: '', date: new Date().toISOString().split('T')[0], action_taken: '', severity: 'MINOR' });
    const [maintenanceFormData, setMaintenanceFormData] = useState({ hostel: '', room: '', issue: '', repair_cost: 0, status: 'PENDING', date: new Date().toISOString().split('T')[0] });

    // Filter States for Modals (Strict Cascading)
    const [filterHostel, setFilterHostel] = useState<string>(''); // Used across modals to drive Room dropdown


    const [selectedHostel, setSelectedHostel] = useState<any>(null);
    const [viewHostelResidents, setViewHostelResidents] = useState<any[]>([]);
    const [isViewResidentsModalOpen, setIsViewResidentsModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [
                hostelsRes, roomsRes, bedsRes, allocationsRes,
                attendanceRes, disciplineRes, assetsRes,
                maintenanceRes, studentsRes, staffRes
            ] = await Promise.all([
                hostelAPI.hostels.getAll(),
                hostelAPI.rooms.getAll(),
                hostelAPI.beds.getAll(),
                hostelAPI.allocations.getAll(),
                hostelAPI.attendance.getAll(),
                hostelAPI.discipline.getAll(),
                hostelAPI.assets.getAll(),
                hostelAPI.maintenance.getAll(),
                studentsAPI.getAll(),
                staffAPI.getAll(),
            ]);
            setHostels(hostelsRes.data);
            setRooms(roomsRes.data);
            setBeds(bedsRes.data);
            setAllocations(allocationsRes.data);
            setAttendance(attendanceRes.data);
            setDiscipline(disciplineRes.data);
            setAssets(assetsRes.data);
            setMaintenance(maintenanceRes.data);
            setStudents(studentsRes.data);
            setStaff(staffRes.data);
        } catch (error) {
            console.error('Error loading hostel data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAllocationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isTransferMode && allocationId) {
                await hostelAPI.allocations.transfer(allocationId, Number(allocationFormData.bed));
                success('Student transferred successfully.');
            } else {
                const payload = {
                    student: Number(allocationFormData.student),
                    room: Number(allocationFormData.room),
                    bed: Number(allocationFormData.bed),
                    status: allocationFormData.status
                };
                if (allocationId) await hostelAPI.allocations.update(allocationId, payload);
                else await hostelAPI.allocations.create(payload);
                success(allocationId ? 'Allocation updated.' : 'Student assigned to hostel successfully.');
            }
            loadData();
            setIsAllocationModalOpen(false);
            setAllocationId(null);
            setIsTransferMode(false);
            setAllocationFormData({ student: '', hostel: '', room: '', bed: '', status: 'ACTIVE' });
        } catch (err: any) {
            toastError(err.message || 'Failed to process request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditAllocation = (a: any) => {
        setIsTransferMode(false);
        setAllocationId(a.id);
        // We need to reverse lookup the hostel from the room
        const room = rooms.find(r => r.id === a.room);
        const hostelId = room ? String(room.hostel) : '';

        setAllocationFormData({
            ...a,
            student: String(a.student),
            hostel: hostelId, // Set Cascading Context
            room: String(a.room),
            bed: String(a.bed),
            status: a.status
        });
        setIsAllocationModalOpen(true);
    };

    const openTransferModal = (a: any) => {
        setIsTransferMode(true);
        setAllocationId(a.id);
        // Pre-fill Name but reset location choices
        setAllocationFormData({
            student: String(a.student),
            hostel: '',
            room: '',
            bed: '',
            status: 'ACTIVE'
        });
        setIsAllocationModalOpen(true);
    }

    const handleDeleteAllocation = async (id: number) => {
        if (!await confirm('Remove this allocation?', { type: 'danger' })) return;
        try {
            await hostelAPI.allocations.delete(id);
            success('Allocation removed');
            loadData();
        } catch (err: any) {
            toastError(err.message || 'Failed to delete allocation');
        }
    };

    const handleHostelSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (hostelId) {
                await hostelAPI.hostels.update(hostelId, hostelFormData);
                success('Hostel updated.');
            } else {
                await hostelAPI.hostels.create(hostelFormData);
                success('Hostel created.');
            }
            loadData();
            setIsHostelModalOpen(false);
            setHostelId(null);
            setHostelFormData({ name: '', gender_allowed: 'M', hostel_type: 'BOARDING', capacity: 100, warden: '' });
        } catch (err: any) {
            toastError(err.message || 'Failed to save hostel.');
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleEditHostel = (h: any) => {
        setHostelId(h.id);
        const wardenId = typeof h.warden === 'object' ? h.warden?.id : h.warden;
        setHostelFormData({
            name: h.name,
            gender_allowed: h.gender_allowed,
            hostel_type: h.hostel_type,
            capacity: h.capacity,
            warden: wardenId ? wardenId.toString() : ''
        });
        setIsHostelModalOpen(true);
    };
    const handleDeleteHostel = async (id: number) => {
        if (!await confirm('Delete hostel? Warning: This may fail if rooms exist.', { type: 'danger' })) return;
        try {
            await hostelAPI.hostels.delete(id);
            success('Hostel deleted');
            loadData();
        } catch (err: any) {
            toastError(err.message || 'Failed to delete hostel.');
        }
    };

    const handleRoomSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...roomFormData, hostel: Number(roomFormData.hostel), capacity: Number(roomFormData.capacity) };
            if (roomId) await hostelAPI.rooms.update(roomId, payload);
            else await hostelAPI.rooms.create(payload);
            success(roomId ? 'Room updated.' : 'Room added.');
            loadData(); setIsRoomModalOpen(false); setRoomId(null); setRoomFormData({ hostel: '', room_number: '', room_type: 'DORM', floor: 'Ground', capacity: 4 });
        } catch (err: any) {
            toastError(err.message || 'Failed to save room.');
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleEditRoom = (r: any) => { setRoomId(r.id); setRoomFormData({ ...r, hostel: String(r.hostel) }); setIsRoomModalOpen(true); };
    const handleDeleteRoom = async (id: number) => {
        if (!await confirm('Delete this room?', { type: 'danger' })) return;
        try {
            await hostelAPI.rooms.delete(id);
            success('Room deleted');
            loadData();
        } catch (err: any) {
            toastError(err.message || 'Failed to delete room');
        }
    };

    // --- New Handlers (Assets, Attendance, Discipline, Maintenance) ---

    const handleAssetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...assetFormData,
                hostel: Number(assetFormData.hostel),
                room: assetFormData.room ? Number(assetFormData.room) : null,
                quantity: Number(assetFormData.quantity || 1)
            };
            if (assetId) await hostelAPI.assets.update(assetId, payload);
            else await hostelAPI.assets.create(payload);
            success(assetId ? 'Asset updated.' : 'Asset recorded.');
            loadData(); setIsAssetModalOpen(false); setAssetId(null);
            setAssetFormData({ asset_code: '', asset_type: 'FURNITURE', type: 'FURNITURE', condition: 'GOOD', value: 0, quantity: 1, hostel: '', room: '' });
        } catch (err: any) {
            toastError(err.message || 'Failed to save asset');
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleEditAsset = (a: any) => { setAssetId(a.id); setAssetFormData({ ...a, hostel: String(a.hostel) }); setIsAssetModalOpen(true); };
    const handleDeleteAsset = async (id: number) => {
        if (await confirm('Delete this asset?', { type: 'danger' })) {
            try {
                await hostelAPI.assets.delete(id);
                success('Asset deleted');
                loadData();
            } catch (err: any) {
                toastError(err.message || 'Failed to delete asset');
            }
        }
    };

    const handleAttendanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...attendanceFormData, student: Number(attendanceFormData.student) };
            if (attendanceId) await hostelAPI.attendance.update(attendanceId, payload);
            else await hostelAPI.attendance.create(payload);
            success(attendanceId ? 'Attendance updated.' : 'Attendance logged.');
            loadData(); setIsAttendanceModalOpen(false); setAttendanceId(null); setAttendanceFormData({ student: '', date: new Date().toISOString().split('T')[0], status: 'PRESENT', session: 'EVENING', remarks: '' });
        } catch (err: any) {
            toastError(err.message || 'Failed to save attendance.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkAttendanceSubmit = async () => {
        if (!bulkAttendanceRoom) return;
        const studentIds = Object.keys(bulkAttendanceData);
        let successCount = 0;
        let errors: string[] = [];

        const targetDate = attendanceFormData.date || new Date().toISOString().split('T')[0];
        const targetSession = attendanceFormData.session;

        for (const sId of studentIds) {
            const studentId = parseInt(sId);
            const data = bulkAttendanceData[studentId];

            // Check for existing record to UPSERT
            const existingRecord = attendance.find(a =>
                a.student === studentId &&
                a.date === targetDate &&
                a.session === targetSession
            );

            try {
                if (existingRecord) {
                    await hostelAPI.attendance.update(existingRecord.id, {
                        student: studentId,
                        date: targetDate,
                        status: data.status,
                        session: targetSession,
                        remarks: data.remarks
                    });
                } else {
                    await hostelAPI.attendance.create({
                        student: studentId,
                        date: targetDate,
                        status: data.status,
                        session: targetSession,
                        remarks: data.remarks
                    });
                }
                successCount++;
            } catch (err: any) {
                console.error(`Failed for student ${sId}`, err);
                const msg = err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message;
                errors.push(`Student ${sId}: ${msg}`);
            }
        }

        loadData();
        setIsAttendanceModalOpen(false);
        setBulkAttendanceRoom(null);
        setBulkAttendanceData({});

        if (successCount === studentIds.length) {
            success(`Roll call complete. Processed ${successCount}/${studentIds.length} students successfully.`);
        } else {
            toastError(`Roll call complete. Processed ${successCount}/${studentIds.length}.\n\nErrors potentially due to validation:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`);
        }
    };
    const handleEditAttendance = (a: any) => { setAttendanceId(a.id); setAttendanceFormData({ ...a, student: String(a.student) }); setAttendanceMode('SINGLE'); setIsAttendanceModalOpen(true); };
    const handleDeleteAttendance = async (id: number) => {
        if (await confirm('Delete attendance record?', { type: 'danger' })) {
            try {
                await hostelAPI.attendance.delete(id);
                success('Record deleted');
                loadData();
            } catch (err: any) {
                toastError(err.message || 'Failed to delete record');
            }
        }
    };

    const handleDisciplineSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                student: Number(disciplineFormData.student),
                incident_date: disciplineFormData.date,
                offence: disciplineFormData.offence,
                description: disciplineFormData.description,
                action_taken: disciplineFormData.action_taken,
                severity: disciplineFormData.severity
            };
            if (disciplineId) await hostelAPI.discipline.update(disciplineId, payload);
            else await hostelAPI.discipline.create(payload);
            success(disciplineId ? 'Record updated.' : 'Discipline record added.');
            loadData(); setIsDisciplineModalOpen(false); setDisciplineId(null);
            setDisciplineFormData({ student: '', offence: '', description: '', date: new Date().toISOString().split('T')[0], action_taken: '', severity: 'MINOR' });
        } catch (err: any) {
            toastError(err.message || 'Failed to save discipline record.');
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleEditDiscipline = (d: any) => { setDisciplineId(d.id); setDisciplineFormData({ ...d, student: String(d.student) }); setIsDisciplineModalOpen(true); };
    const handleDeleteDiscipline = async (id: number) => {
        if (await confirm('Delete record?', { type: 'danger' })) {
            try {
                await hostelAPI.discipline.delete(id);
                success('Record deleted');
                loadData();
            } catch (err: any) {
                toastError(err.message || 'Failed to delete record');
            }
        }
    };

    const handleMaintenanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...maintenanceFormData, hostel: Number(maintenanceFormData.hostel) };
            const backendPayload = {
                hostel: payload.hostel,
                room: payload.room ? Number(payload.room) : null,
                issue: payload.issue,
                repair_cost: payload.repair_cost,
                status: payload.status,
                date_reported: payload.date || new Date().toISOString().split('T')[0],
                reported_by: null
            };

            if (maintenanceId) await hostelAPI.maintenance.update(maintenanceId, backendPayload);
            else await hostelAPI.maintenance.create(backendPayload);
            success(maintenanceId ? 'Request updated.' : 'Maintenance request logged.');
            loadData(); setIsMaintenanceModalOpen(false); setMaintenanceId(null);
            setMaintenanceFormData({ hostel: '', room: '', issue: '', repair_cost: 0, status: 'PENDING', date: new Date().toISOString().split('T')[0] });
        } catch (err: any) {
            toastError(err.message || 'Failed to save maintenance request');
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleEditMaintenance = (m: any) => { setMaintenanceId(m.id); setMaintenanceFormData({ ...m, hostel: String(m.hostel) }); setIsMaintenanceModalOpen(true); };
    const handleDeleteMaintenance = async (id: number) => {
        if (await confirm('Delete request?', { type: 'danger' })) {
            try {
                await hostelAPI.maintenance.delete(id);
                success('Request deleted');
                loadData();
            } catch (err: any) {
                toastError(err.message || 'Failed to delete request');
            }
        }
    };

    const openEditHostel = (h: any) => {
        setSelectedHostel(h);
        const wardenId = typeof h.warden === 'object' ? h.warden?.id : h.warden;
        setHostelFormData({
            name: h.name,
            gender_allowed: h.gender_allowed,
            hostel_type: h.hostel_type,
            capacity: h.capacity,
            warden: wardenId ? wardenId.toString() : ''
        });
        setIsHostelModalOpen(true);
    };

    const openEditRoom = (r: any) => {
        // Find parent hostel to set context if needed, or just rely on API
        // For now, assuming we edit within the context of the selected hostel
        setRoomFormData({
            hostel: r.hostel.toString(),
            room_number: r.room_number,
            room_type: r.room_type,
            floor: r.floor,
            capacity: r.capacity
        });
        // We need to know we are editing, so maybe store the room ID in a separate state or reuse selectedHostel logic? 
        // Simplest: Add 'id' to roomFormData or use a selectedRoom state.
        // Let's use a temporary state or hack: 
        // Better: Add 'id' to roomFormData definition or a new state 'editingRoomId'
        setRoomId(r.id);
        setIsRoomModalOpen(true);
    };



    // State for viewing rooms
    const [isViewRoomsModalOpen, setIsViewRoomsModalOpen] = useState(false);

    const openViewRooms = (h: any) => {
        setSelectedHostel(h);
        setIsViewRoomsModalOpen(true);
    };

    const openViewResidents = (h: any) => {
        setSelectedHostel(h);
        // Filter allocations for this hostel (and room if specified)
        let residents = allocations.filter(a => a.hostel_name === h.name && a.status === 'ACTIVE');
        if (h.roomFilter) {
            residents = residents.filter(a => a.room === h.roomFilter);
        }
        setViewHostelResidents(residents);
        setIsViewResidentsModalOpen(true);
    };

    const openAddRoom = (h: any) => {
        setFilterHostel(h.id.toString());
        setRoomFormData({ hostel: h.id.toString(), room_number: '', room_type: 'DORM', floor: 'Ground', capacity: 4 });
        setIsRoomModalOpen(true);
    };

    const stats = {
        totalHostels: hostels.length,
        totalCapacity: hostels.reduce((acc, h) => acc + (h.capacity || 0), 0),
        totalResidents: allocations.filter(a => a.status === 'ACTIVE').length,
        maintenanceIssues: maintenance.filter(m => m.status === 'PENDING').length
    };



    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            {/* Header section with Stats Bar */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1>Boarding & Hostel Management</h1>
                    <p className="text-secondary text-sm">Institutional residence logistics, safety, and inventory</p>
                </div>
                <div className="flex gap-md no-print">
                    <Button variant="outline" onClick={() => window.print()} icon={<Printer size={18} />}>Reports</Button>
                    <Button onClick={() => setIsAllocationModalOpen(true)} icon={<Plus size={18} />}>New Admission</Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-8">
                <div className="card p-4 flex items-center gap-md border-left-4 border-primary">
                    <Building className="text-primary" size={24} />
                    <div><p className="text-xs text-secondary font-bold uppercase">Hostels</p><h3>{stats.totalHostels}</h3></div>
                </div>
                <div className="card p-4 flex items-center gap-md border-left-4 border-success">
                    <UsersIcon className="text-success" size={24} />
                    <div><p className="text-xs text-secondary font-bold uppercase">Residents</p><h3>{stats.totalResidents}</h3></div>
                </div>
                <div className="card p-4 flex items-center gap-md border-left-4 border-warning">
                    <Layout className="text-warning" size={24} />
                    <div><p className="text-xs text-secondary font-bold uppercase">Occupancy</p><h3>{Math.round((stats.totalResidents / (stats.totalCapacity || 1)) * 100)}%</h3></div>
                </div>
                <div className="card p-4 flex items-center gap-md border-left-4 border-error">
                    <Wrench className="text-error" size={24} />
                    <div><p className="text-xs text-secondary font-bold uppercase">Maintenance</p><h3>{stats.maintenanceIssues}</h3></div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs mb-6 no-print overflow-x-auto">
                <button className={`tab-link ${activeTab === 'registry' ? 'active' : ''}`} onClick={() => setActiveTab('registry')}><Building size={16} /> Registry</button>
                <button className={`tab-link ${activeTab === 'allocations' ? 'active' : ''}`} onClick={() => setActiveTab('allocations')}><Users size={16} /> Allocations</button>
                <button className={`tab-link ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}><Clock size={16} /> Attendance</button>
                <button className={`tab-link ${activeTab === 'discipline' ? 'active' : ''}`} onClick={() => setActiveTab('discipline')}><ShieldAlert size={16} /> Discipline</button>
                <button className={`tab-link ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}><Package size={16} /> Assets</button>
                <button className={`tab-link ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}><Wrench size={16} /> Maintenance</button>
            </div>

            {/* Tab Content */}
            {activeTab === 'registry' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                    {hostels.map(h => (
                        <div key={h.id} className="card p-6 border-top-4 border-primary hover-scale">
                            <div className="flex justify-between items-start mb-4">
                                <div><h3 className="mb-0">{h.name}</h3><span className={`badge ${h.gender_allowed === 'M' ? 'badge-primary' : 'badge-error'}`}>{h.gender_allowed === 'M' ? 'BOYS' : 'GIRLS'}</span></div>
                                <Building className="text-secondary opacity-20" size={40} />
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-secondary">Warden:</span>
                                    <span className="font-semibold text-primary">
                                        {staff.find(s => s.id === h.warden)?.full_name || h.warden_name || 'Not Assigned'}
                                    </span>
                                </div>
                                <div className="flex justify-between"><span className="text-secondary">Type:</span><span className="font-semibold">{h.hostel_type}</span></div>
                                <div className="flex justify-between"><span className="text-secondary">Rooms:</span><span className="font-semibold">{rooms.filter(r => r.hostel === h.id).length} Units</span></div>
                                <div className="w-full bg-secondary-light rounded-full h-2 mt-4">
                                    <div className="bg-primary h-2 rounded-full" style={{ width: `${h.occupancy_rate || 0}%` }}></div>
                                </div>
                                <p className="text-right text-xs font-bold text-primary mt-1">{h.occupancy_rate || 0}% Occupied</p>
                            </div>
                            <div className="flex gap-2 mt-6 pt-4 border-top">
                                <button className="btn btn-sm btn-outline flex-1 gap-1" onClick={() => openViewRooms(h)} title="View Rooms"><BedIcon size={14} /> Rooms</button>
                                <button className="btn btn-sm btn-outline flex-1 gap-2" onClick={() => openEditHostel(h)} title="Edit Details"><Edit size={14} /> Edit</button>
                                <button className="btn btn-sm btn-outline flex-1 gap-2" onClick={() => openViewResidents(h)} title="View Residents"><Users size={14} /> Users</button>
                                <button className="btn btn-sm btn-outline text-error" onClick={(e) => { e.stopPropagation(); handleDeleteHostel(h.id); }} title="Delete Hostel"><Trash2 size={14} /></button>

                            </div>
                        </div>
                    ))}
                    <div className="card p-6 flex flex-col items-center justify-center border-dashed border-2 text-secondary cursor-pointer hover-bg-secondary" onClick={() => setIsHostelModalOpen(true)}>
                        <Plus size={32} className="mb-2" />
                        <p className="font-bold">Add New Hostel</p>
                    </div>
                </div>
            )}

            {/* Allocations Tab */}
            {activeTab === 'allocations' && (
                <div className="table-container fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3>Student Allocations</h3>
                        <div className="flex gap-2 items-center">
                            <span className="text-xs text-secondary font-bold">Sort By:</span>
                            <div className="join">
                                <button className={`join-item btn btn-xs ${allocationSort === 'HOSTEL' ? 'btn-active' : ''}`} onClick={() => setAllocationSort('HOSTEL')}>Hostel</button>
                                <button className={`join-item btn btn-xs ${allocationSort === 'ROOM' ? 'btn-active' : ''}`} onClick={() => setAllocationSort('ROOM')}>Room</button>
                                <button className={`join-item btn btn-xs ${allocationSort === 'STATUS' ? 'btn-active' : ''}`} onClick={() => setAllocationSort('STATUS')}>Status</button>
                            </div>
                            <div className="flex gap-2 ml-4">
                                <button className="btn btn-outline btn-sm" onClick={() => exportToCSV(allocations.map(a => ({
                                    Student: students.find(s => s.id === a.student)?.full_name,
                                    Hostel: hostels.find(h => h.id === rooms.find(r => r.id === a.room)?.hostel)?.name,
                                    Room: rooms.find(r => r.id === a.room)?.room_number,
                                    Bed: beds.find(b => b.id === a.bed)?.bed_number,
                                    Status: a.status
                                })), 'allocations_report')}><UsersIcon size={14} /> CSV</button>
                                <button className="btn btn-outline btn-sm" onClick={() => window.print()}><Printer size={14} /> Print</button>
                            </div>
                            <button className="btn btn-primary btn-sm ml-2" onClick={() => { setAllocationId(null); setIsTransferMode(false); setIsAllocationModalOpen(true); }}><Plus size={14} /> Assign Student</button>
                        </div>
                    </div>
                    <table className="table">
                        <thead><tr><th>Student</th><th>Hostel</th><th>Room</th><th>Bed</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {allocations
                                .sort((a, b) => {
                                    if (allocationSort === 'HOSTEL') return (a.hostel_name || '').localeCompare(b.hostel_name || '');
                                    if (allocationSort === 'ROOM') return (a.room_number || '').localeCompare(b.room_number || '');
                                    return (a.status || '').localeCompare(b.status || '');
                                })
                                .map(a => (
                                    <tr key={a.id}>
                                        <td className="font-bold">{a.student_name || students.find(s => s.id === a.student)?.full_name}</td>
                                        <td>{a.hostel_name || 'N/A'}</td>
                                        <td>{a.room_number || 'N/A'}</td>
                                        <td>{a.bed_number || 'N/A'}</td>
                                        <td><span className={`badge ${a.status === 'ACTIVE' ? 'badge-success' : 'badge-ghost'}`}>{a.status}</span></td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button className="btn btn-sm btn-outline text-info" onClick={() => openTransferModal(a)} title="Transfer Room">Transfer</button>
                                                <button className="btn btn-sm btn-ghost text-primary" onClick={() => handleEditAllocation(a)}><Edit size={14} /></button>
                                                <button className="btn btn-sm btn-ghost text-error" onClick={() => handleDeleteAllocation(a.id)}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Assets Tab */}
            {activeTab === 'assets' && (
                <div className="table-container fade-in">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <div className="flex items-center gap-4">
                            <h3>Hostel Assets</h3>
                            <div className="flex gap-2">
                                <select
                                    className="select select-xs select-bordered"
                                    value={assetSort.field}
                                    onChange={(e) => setAssetSort({ ...assetSort, field: e.target.value })}
                                >
                                    <option value="asset_code">Sort by Code</option>
                                    <option value="asset_type">Sort by Type</option>
                                    <option value="condition">Sort by Condition</option>
                                </select>
                                <button
                                    className="btn btn-xs btn-ghost"
                                    onClick={() => setAssetSort({ ...assetSort, direction: assetSort.direction === 'asc' ? 'desc' : 'asc' })}
                                >
                                    {assetSort.direction === 'asc' ? '↑' : '↓'}
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline btn-sm" onClick={() => exportToCSV(assets, 'hostel_assets')}><UsersIcon size={14} /> CSV</button>
                            <button className="btn btn-outline btn-sm" onClick={() => window.print()}><Printer size={14} /> Print</button>
                            <button className="btn btn-primary btn-sm" onClick={() => { setAssetId(null); setIsAssetModalOpen(true); }}><Plus size={14} /> Add Asset</button>
                        </div>
                    </div>
                    <table className="table">
                        <thead><tr><th>Name</th><th>Type</th><th>Condition</th><th>Hostel</th><th>Value</th><th>Actions</th></tr></thead>
                        <tbody>
                            {assets.length === 0 && <tr><td colSpan={6} className="text-center italic">No assets recorded.</td></tr>}
                            {[...assets].sort((a, b) => {
                                const valA = String(a[assetSort.field] || '');
                                const valB = String(b[assetSort.field] || '');
                                return assetSort.direction === 'asc'
                                    ? valA.localeCompare(valB)
                                    : valB.localeCompare(valA);
                            }).map(a => (
                                <tr key={a.id}>
                                    <td className="font-bold">{a.asset_code}</td>
                                    <td><span className="badge badge-info">{a.asset_type}</span></td>
                                    <td>{a.condition}</td>
                                    <td>{hostels.find(h => h.id === a.hostel)?.name || (a.room ? hostels.find(h => h.id === rooms.find(r => r.id === a.room)?.hostel)?.name : 'General')}</td>
                                    <td>{a.value?.toLocaleString()}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn btn-sm btn-ghost text-primary" onClick={() => handleEditAsset(a)}><Edit size={14} /></button>
                                            <button className="btn btn-sm btn-ghost text-error" onClick={() => handleDeleteAsset(a.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
                <div className="table-container fade-in">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <h3>Hostel Attendance</h3>

                        <div className="flex gap-2 items-center">
                            <span className="text-xs text-secondary font-bold">Sort By:</span>
                            <div className="join mr-4">
                                <button className={`join-item btn btn-xs ${attendanceSort === 'DATE' ? 'btn-active' : ''}`} onClick={() => setAttendanceSort('DATE')}>Date</button>
                                <button className={`join-item btn btn-xs ${attendanceSort === 'HOSTEL' ? 'btn-active' : ''}`} onClick={() => setAttendanceSort('HOSTEL')}>Hostel</button>
                                <button className={`join-item btn btn-xs ${attendanceSort === 'SESSION' ? 'btn-active' : ''}`} onClick={() => setAttendanceSort('SESSION')}>Session</button>
                            </div>

                            <button className="btn btn-outline btn-sm" onClick={() => exportToCSV(attendance.map(a => ({
                                Date: a.date,
                                Session: a.session || 'N/A',
                                Student: students.find(s => s.id === a.student)?.full_name,
                                Hostel: hostels.find(h => h.id === rooms.find(r => r.id === allocations.find(al => al.student === a.student && al.status === 'ACTIVE')?.room)?.hostel)?.name || 'N/A',
                                Status: a.status,
                                Remarks: a.remarks
                            })), 'attendance_report')}><UsersIcon size={14} /> CSV</button>
                            <button className="btn btn-primary btn-sm" onClick={() => { setAttendanceId(null); setIsAttendanceModalOpen(true); }}><Plus size={14} /> Log Attendance</button>
                        </div>
                    </div>
                    <table className="table">
                        <thead><tr><th>Date</th><th>Session</th><th>Student</th><th>Hostel</th><th>Status</th><th>Remarks</th><th>Actions</th></tr></thead>
                        <tbody>
                            {attendance
                                .sort((a, b) => {
                                    if (attendanceSort === 'HOSTEL') return (a.hostel_name || '').localeCompare(b.hostel_name || '');
                                    if (attendanceSort === 'SESSION') return (a.session || '').localeCompare(b.session || '');
                                    // Default Date Sort
                                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                                })
                                .map(a => (
                                    <tr key={a.id}>
                                        <td>{a.date}</td>
                                        <td><span className="badge badge-ghost text-xs">{a.session || 'N/A'}</span></td>
                                        <td className="font-bold">{a.student_name || students.find(s => s.id === a.student)?.full_name}</td>
                                        <td className="text-sm text-secondary">{a.hostel_name || 'N/A'}</td>
                                        <td><span className={`badge ${a.status === 'PRESENT' ? 'badge-success' : a.status === 'ABSENT' ? 'badge-error' : 'badge-info'}`}>{a.status}</span></td>
                                        <td>{a.remarks}</td>
                                        <td className="no-print">
                                            <div className="flex gap-2">
                                                <button className="btn btn-sm btn-ghost text-primary" onClick={() => handleEditAttendance(a)}><Edit size={14} /></button>
                                                <button className="btn btn-sm btn-ghost text-error" onClick={() => handleDeleteAttendance(a.id)}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            )}

            {/* Discipline Tab */}
            {activeTab === 'discipline' && (
                <div className="table-container fade-in">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <h3>Discipline Records</h3>
                        <div className="flex gap-2">
                            <button className="btn btn-outline btn-sm" onClick={() => exportToCSV(discipline.map(d => ({
                                Date: d.date,
                                Student: students.find(s => s.id === d.student)?.full_name,
                                Hostel: hostels.find(h => h.id === rooms.find(r => r.id === allocations.find(al => al.student === d.student && al.status === 'ACTIVE')?.room)?.hostel)?.name || 'N/A',
                                Infraction: d.infraction,
                                Severity: d.severity,
                                Action: d.action_taken
                            })), 'discipline_report')}><UsersIcon size={14} /> CSV</button>
                            <button className="btn btn-outline btn-sm" onClick={() => window.print()}><Printer size={14} /> Print</button>
                            <button className="btn btn-error btn-sm text-white" onClick={() => { setDisciplineId(null); setIsDisciplineModalOpen(true); }}><ShieldAlert size={14} /> Report Incident</button>
                        </div>
                    </div>
                    <table className="table">
                        <thead><tr><th>Date</th><th>Student</th><th>Infraction</th><th>Severity</th><th>Action Taken</th><th>Actions</th></tr></thead>
                        <tbody>
                            {discipline.length === 0 && <tr><td colSpan={6} className="text-center italic">No discipline records.</td></tr>}
                            {discipline.map(d => (
                                <tr key={d.id}>
                                    <td>{d.date || d.incident_date}</td>
                                    <td className="font-bold">{students.find(s => s.id === d.student)?.full_name}</td>
                                    <td>{d.offence}</td>
                                    <td><span className={`badge ${d.severity === 'MAJOR' ? 'badge-error' : 'badge-warning'}`}>{d.severity}</span></td>
                                    <td>{d.action_taken}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn btn-sm btn-ghost text-primary" onClick={() => handleEditDiscipline(d)}><Edit size={14} /></button>
                                            <button className="btn btn-sm btn-ghost text-error" onClick={() => handleDeleteDiscipline(d.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
                <div className="table-container fade-in">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <h3>Hostel Maintenance</h3>
                        <div className="flex gap-2">
                            <button className="btn btn-outline btn-sm" onClick={() => exportToCSV(assets, 'hostel_assets')}><UsersIcon size={14} /> CSV</button>
                            <button className="btn btn-outline btn-sm" onClick={() => window.print()}><Printer size={14} /> Print</button>
                            <button className="btn btn-primary btn-sm" onClick={() => { setMaintenanceId(null); setIsMaintenanceModalOpen(true); }}><Wrench size={14} /> Log Request</button>
                        </div>
                    </div>
                    <table className="table">
                        <thead><tr><th>Date</th><th>Hostel</th><th>Description</th><th>Cost</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {maintenance.length === 0 && <tr><td colSpan={6} className="text-center italic">No maintenance requests.</td></tr>}
                            {maintenance.map(m => (
                                <tr key={m.id}>
                                    <td>{m.date_reported || m.date}</td>
                                    <td className="font-bold">{hostels.find(h => String(h.id) === String(m.hostel))?.name || 'N/A'}</td>
                                    <td>{m.issue}</td>
                                    <td>{m.repair_cost?.toLocaleString()}</td>
                                    <td><span className={`badge ${m.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{m.status}</span></td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn btn-sm btn-ghost text-primary" onClick={() => handleEditMaintenance(m)}><Edit size={14} /></button>
                                            <button className="btn btn-sm btn-ghost text-error" onClick={() => handleDeleteMaintenance(m.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals */}
            {/* Modals */}
            <Modal isOpen={isHostelModalOpen} onClose={() => setIsHostelModalOpen(false)} title={hostelId ? "Edit Hostel" : "Add New Hostel"}>
                <form onSubmit={handleHostelSubmit} className="space-y-4">
                    <div className="form-group"><label className="label">Name</label><input type="text" className="input" value={hostelFormData.name} onChange={e => setHostelFormData({ ...hostelFormData, name: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Type</label><select className="select" value={hostelFormData.hostel_type} onChange={e => setHostelFormData({ ...hostelFormData, hostel_type: e.target.value })}><option value="BOARDING">Boarding</option><option value="DAY">Day Scholar</option></select></div>
                        <div className="form-group"><label className="label">Gender</label><select className="select" value={hostelFormData.gender_allowed} onChange={e => setHostelFormData({ ...hostelFormData, gender_allowed: e.target.value })}><option value="M">Male</option><option value="F">Female</option><option value="MIXED">Mixed</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Capacity</label><input type="number" className="input" value={hostelFormData.capacity} onChange={e => setHostelFormData({ ...hostelFormData, capacity: parseInt(e.target.value) })} required /></div>
                        <div className="form-group">
                            <label className="label">Warden In-Charge</label>
                            <select className="select" value={hostelFormData.warden} onChange={(e) => setHostelFormData({ ...hostelFormData, warden: e.target.value })}>
                                <option value="">Select Warden...</option>
                                {staff.filter(s => s.role === 'WARDEN').map(s => (
                                    <option key={s.id} value={s.id}>{s.user.first_name} {s.user.last_name} ({s.employee_id})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <Button
                            type="submit"
                            className="w-full"
                            loading={isSubmitting}
                            loadingText={hostelId ? "Updating..." : "Creating..."}
                        >
                            {hostelId ? "Update Hostel" : "Create Hostel"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title={roomId ? "Edit Room" : "Add New Room"}>
                <form onSubmit={handleRoomSubmit} className="space-y-4">
                    <div className="form-group"><label className="label">Hostel</label>
                        <select className="select" value={roomFormData.hostel} onChange={e => setRoomFormData({ ...roomFormData, hostel: e.target.value })} required>
                            <option value="">Select Hostel...</option>
                            {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Room Number</label><input type="text" className="input" value={roomFormData.room_number} onChange={e => setRoomFormData({ ...roomFormData, room_number: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Floor</label><input type="text" className="input" value={roomFormData.floor} onChange={e => setRoomFormData({ ...roomFormData, floor: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Type</label><select className="select" value={roomFormData.room_type} onChange={e => setRoomFormData({ ...roomFormData, room_type: e.target.value })}><option value="DORM">Dormitory</option><option value="CUBICLE">Cubicle</option><option value="SINGLE">Single</option></select></div>
                        <div className="form-group"><label className="label">Capacity</label><input type="number" className="input" value={roomFormData.capacity} onChange={e => setRoomFormData({ ...roomFormData, capacity: parseInt(e.target.value) })} required /></div>
                    </div>
                    <div className="modal-footer">
                        <Button
                            type="submit"
                            className="w-full"
                            loading={isSubmitting}
                            loadingText={roomId ? "Updating..." : "Adding..."}
                        >
                            {roomId ? "Update Room" : "Add Room"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isAllocationModalOpen} onClose={() => setIsAllocationModalOpen(false)} title={isTransferMode ? "Transfer Student" : allocationId ? "Edit Allocation" : "Assign Student"}>
                <form onSubmit={handleAllocationSubmit} className="space-y-4">
                    {!isTransferMode && (
                        <SearchableSelect label="Select Student" options={students.map(s => ({ id: String(s.id), label: s.full_name, subLabel: s.admission_number }))} value={String(allocationFormData.student || '')} onChange={(val) => setAllocationFormData({ ...allocationFormData, student: val.toString() })} required />
                    )}
                    {isTransferMode && (
                        <div className="bg-primary-light p-3 rounded mb-4 text-primary font-bold">
                            Moving: {students.find(s => String(s.id) === String(allocationFormData.student))?.full_name}
                        </div>
                    )}


                    <div className="form-group">
                        <label className="label">Hostel</label>
                        <select className="select" value={allocationFormData.hostel} onChange={e => setAllocationFormData({ ...allocationFormData, hostel: e.target.value, room: '', bed: '' })} required>
                            <option value="">Select Hostel...</option>
                            {hostels.map(h => <option key={h.id} value={h.id}>{h.name} ({h.gender_allowed === 'M' ? 'Boys' : h.gender_allowed === 'F' ? 'Girls' : 'Mixed'})</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Room</label>
                            <select className="select" value={allocationFormData.room} onChange={e => setAllocationFormData({ ...allocationFormData, room: e.target.value, bed: '' })} required disabled={!allocationFormData.hostel}>
                                <option value="">Select Room...</option>
                                {rooms
                                    .filter(r => String(r.hostel) === allocationFormData.hostel)
                                    .map(r => <option key={r.id} value={r.id}>{r.room_number} ({r.available_beds || '?'} free)</option>)
                                }
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Bed</label>
                            <select className="select" value={allocationFormData.bed} onChange={e => setAllocationFormData({ ...allocationFormData, bed: e.target.value })} required disabled={!allocationFormData.room}>
                                <option value="">Select Bed...</option>
                                {beds
                                    .filter(b => String(b.room) === allocationFormData.room && (b.status === 'AVAILABLE' || String(b.id) === String(allocationFormData.bed))) // Show available OR currently selected (if editing)
                                    .map(b => <option key={b.id} value={b.id}>{b.bed_number} {b.status !== 'AVAILABLE' ? '(Current)' : ''}</option>)
                                }
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <Button
                            type="submit"
                            className="w-full"
                            loading={isSubmitting}
                            loadingText={isTransferMode ? "Transferring..." : "Saving..."}
                        >
                            {isTransferMode ? "Confirm Transfer" : allocationId ? "Update Allocation" : "Assign Student"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} title={assetId ? "Edit Asset" : "Add Hostel Asset"}>
                <form onSubmit={handleAssetSubmit} className="space-y-4">
                    <div className="form-group"><label className="label">Asset Code/Name</label><input type="text" className="input" value={assetFormData.asset_code} onChange={e => setAssetFormData({ ...assetFormData, asset_code: e.target.value })} placeholder="e.g. BED-001" /></div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Hostel</label><select className="select" value={assetFormData.hostel} onChange={e => {
                            setAssetFormData({ ...assetFormData, hostel: e.target.value, room: '' });
                        }} required><option value="">Select Hostel...</option>{hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
                        <div className="form-group">
                            <label className="label">Room (Optional)</label>
                            <select className="select" value={assetFormData.room} onChange={e => setAssetFormData({ ...assetFormData, room: e.target.value })} disabled={!assetFormData.hostel}>
                                <option value="">General / Store</option>
                                {rooms.filter(r => String(r.hostel) === assetFormData.hostel).map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Type</label><select className="select" value={assetFormData.type} onChange={e => setAssetFormData({ ...assetFormData, type: e.target.value })}><option value="FURNITURE">Furniture</option><option value="ELECTRONIC">Electronic</option><option value="OTHER">Other</option></select></div>
                        <div className="form-group"><label className="label">Condition</label><select className="select" value={assetFormData.condition} onChange={e => setAssetFormData({ ...assetFormData, condition: e.target.value })}><option value="GOOD">Good</option><option value="FAIR">Fair</option><option value="POOR">Poor</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Quantity</label><input type="number" className="input" value={assetFormData.quantity} onChange={e => setAssetFormData({ ...assetFormData, quantity: parseInt(e.target.value) })} min="1" required /></div>
                        <div className="form-group"><label className="label">Value (KES)</label><input type="number" className="input" value={assetFormData.value} onChange={e => setAssetFormData({ ...assetFormData, value: parseFloat(e.target.value) })} /></div>
                    </div>
                    <div className="modal-footer">
                        <Button
                            type="submit"
                            className="w-full"
                            loading={isSubmitting}
                            loadingText={assetId ? "Updating..." : "Adding..."}
                        >
                            {assetId ? "Update Asset" : "Add Asset"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title="Log Attendance">
                <div className="flex gap-4 mb-4 border-b pb-2">
                    <button className={`btn btn-sm ${attendanceMode === 'SINGLE' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAttendanceMode('SINGLE')}>Single Entry</button>
                    <button className={`btn btn-sm ${attendanceMode === 'BULK' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAttendanceMode('BULK')}>Room Roll Call</button>
                </div>

                {attendanceMode === 'SINGLE' ? (
                    <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                        <SearchableSelect label="Student" options={students.map(s => ({ id: String(s.id), label: s.full_name, subLabel: s.admission_number }))} value={String(attendanceFormData.student || '')} onChange={(val) => setAttendanceFormData({ ...attendanceFormData, student: val })} required />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group"><label className="label">Date</label><input type="date" className="input" value={attendanceFormData.date} onChange={e => setAttendanceFormData({ ...attendanceFormData, date: e.target.value })} required /></div>
                            <div className="form-group"><label className="label">Session</label><select className="select" value={attendanceFormData.session} onChange={e => setAttendanceFormData({ ...attendanceFormData, session: e.target.value })} required><option value="MORNING">Morning</option><option value="EVENING">Evening</option><option value="NIGHT">Night</option></select></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group"><label className="label">Status</label><select className="select" value={attendanceFormData.status} onChange={e => setAttendanceFormData({ ...attendanceFormData, status: e.target.value })}><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="PERMITTED">Permitted</option></select></div>
                            <div className="form-group"><label className="label">Remarks</label><input type="text" className="input" value={attendanceFormData.remarks} onChange={e => setAttendanceFormData({ ...attendanceFormData, remarks: e.target.value })} /></div>
                        </div>
                        <div className="modal-footer">
                            <Button
                                type="submit"
                                className="w-full"
                                loading={isSubmitting}
                                loadingText={attendanceId ? "Updating..." : "Logging..."}
                            >
                                {attendanceId ? "Update Attendance" : "Log Attendance"}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* ... (Hostel/Room selects unchanged) ... */}
                            <div className="form-group">
                                <label className="label">Hostel</label>
                                <select className="select" value={filterHostel} onChange={e => {
                                    setFilterHostel(e.target.value);
                                    setBulkAttendanceRoom(null); // Reset room on hostel change
                                    setBulkAttendanceData({});
                                }}>
                                    <option value="">Select Hostel...</option>
                                    {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="label">Room</label>
                                <select className="select" value={bulkAttendanceRoom || ''} onChange={e => {
                                    const rId = parseInt(e.target.value);
                                    setBulkAttendanceRoom(rId);
                                    // Pre-fill bulk data using STRICT ID comparison
                                    const residents = allocations.filter(a => a.room === rId && a.status === 'ACTIVE');
                                    const initialData: any = {};
                                    residents.forEach(r => {
                                        initialData[r.student] = { status: 'PRESENT', remarks: '' };
                                    });
                                    setBulkAttendanceData(initialData);
                                }} disabled={!filterHostel}>
                                    <option value="">Select Room...</option>
                                    {rooms
                                        .filter(r => String(r.hostel) === filterHostel) // Strict Filter
                                        .map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)
                                    }
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="label">Date</label>
                                <input type="date" className="input" value={attendanceFormData.date} onChange={e => setAttendanceFormData({ ...attendanceFormData, date: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="label">Session</label>
                                <select className="select" value={attendanceFormData.session} onChange={e => setAttendanceFormData({ ...attendanceFormData, session: e.target.value })}>
                                    <option value="MORNING">Morning Call</option>
                                    <option value="EVENING">Evening Call</option>
                                    <option value="NIGHT">Night Call</option>
                                </select>
                            </div>
                        </div>

                        {bulkAttendanceRoom && (
                            <div className="overflow-y-auto max-h-[300px] border rounded">
                                <table className="table w-full relative">
                                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                                        <tr><th>Student</th><th>Status</th><th>Remarks</th></tr>
                                    </thead>
                                    <tbody>
                                        {allocations.filter(a => a.room === bulkAttendanceRoom && a.status === 'ACTIVE').map(a => (
                                            <tr key={a.id}>
                                                <td className="text-sm font-medium">
                                                    {students.find(s => s.id === a.student)?.full_name}
                                                    <div className="text-xs text-secondary">{students.find(s => s.id === a.student)?.admission_number}</div>
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        {['PRESENT', 'ABSENT', 'PERMITTED'].map(status => (
                                                            <button
                                                                key={status}
                                                                type="button"
                                                                className={`px-2 py-1 text-[10px] rounded border ${bulkAttendanceData[a.student]?.status === status
                                                                    ? (status === 'PRESENT' ? 'bg-success text-white border-success' : status === 'ABSENT' ? 'bg-error text-white border-error' : 'bg-info text-white border-info')
                                                                    : 'bg-white text-secondary border-gray-200'}`}
                                                                onClick={() => setBulkAttendanceData(prev => ({ ...prev, [a.student]: { ...prev[a.student], status } }))}
                                                            >
                                                                {status === 'PERMITTED' ? 'PERMIT' : status[0]}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="input input-sm w-full"
                                                        placeholder="Note..."
                                                        value={bulkAttendanceData[a.student]?.remarks || ''}
                                                        onChange={e => setBulkAttendanceData(prev => ({ ...prev, [a.student]: { ...prev[a.student], remarks: e.target.value } }))}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="modal-footer">
                            <Button
                                type="button"
                                className="w-full"
                                onClick={handleBulkAttendanceSubmit}
                                disabled={!bulkAttendanceRoom}
                                loading={isSubmitting}
                                loadingText="Saving Roll Call..."
                            >
                                Submit Roll Call ({Object.keys(bulkAttendanceData).length})
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isDisciplineModalOpen} onClose={() => setIsDisciplineModalOpen(false)} title={disciplineId ? "Edit Discipline Record" : "Report Incident"}>
                <form onSubmit={handleDisciplineSubmit} className="space-y-4">
                    <SearchableSelect label="Student" options={students.map(s => ({ id: String(s.id), label: s.full_name, subLabel: s.admission_number }))} value={String(disciplineFormData.student || '')} onChange={(val) => setDisciplineFormData({ ...disciplineFormData, student: val })} required />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Date</label><input type="date" className="input" value={disciplineFormData.date} onChange={e => setDisciplineFormData({ ...disciplineFormData, date: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Severity</label><select className="select" value={disciplineFormData.severity} onChange={e => setDisciplineFormData({ ...disciplineFormData, severity: e.target.value })}><option value="MINOR">Minor</option><option value="MAJOR">Major</option><option value="CRITICAL">Critical</option></select></div>
                    </div>
                    <div className="form-group"><label className="label">Offence</label><input type="text" className="input" value={disciplineFormData.offence} onChange={e => setDisciplineFormData({ ...disciplineFormData, offence: e.target.value })} required placeholder="e.g. Late coming" /></div>
                    <div className="form-group"><label className="label">Description</label><textarea className="input" rows={2} value={disciplineFormData.description} onChange={e => setDisciplineFormData({ ...disciplineFormData, description: e.target.value })} required placeholder="Details of what happened..." /></div>
                    <div className="form-group"><label className="label">Action Taken</label><input type="text" className="input" value={disciplineFormData.action_taken} onChange={e => setDisciplineFormData({ ...disciplineFormData, action_taken: e.target.value })} required /></div>
                    <div className="modal-footer">
                        <Button
                            type="submit"
                            variant="danger"
                            className="w-full text-white"
                            loading={isSubmitting}
                            loadingText="Reporting..."
                        >
                            {disciplineId ? "Update Record" : "Report Incident"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} title={maintenanceId ? "Edit Repair Request" : "Log Maintenance"}>
                <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Hostel</label><select className="select" value={maintenanceFormData.hostel} onChange={e => {
                            setMaintenanceFormData({ ...maintenanceFormData, hostel: e.target.value });
                            setFilterHostel(e.target.value); // Sync filter
                        }} required><option value="">Select Hostel...</option>{hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
                        <div className="form-group">
                            <label className="label">Room (Optional)</label>
                            <select className="select" value={maintenanceFormData.room} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, room: e.target.value })} disabled={!maintenanceFormData.hostel}>
                                <option value="">General Area</option>
                                {rooms.filter(r => String(r.hostel) === maintenanceFormData.hostel).map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Date</label><input type="date" className="input" value={maintenanceFormData.date} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, date: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Cost (KES)</label><input type="number" className="input" value={maintenanceFormData.repair_cost} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, repair_cost: parseFloat(e.target.value) })} /></div>
                    </div>
                    <div className="form-group"><label className="label">Description</label><textarea className="input" rows={3} value={maintenanceFormData.issue} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, issue: e.target.value })} required placeholder="Describe the maintenance issue..."></textarea></div>
                    <div className="form-group"><label className="label">Status</label><select className="select" value={maintenanceFormData.status} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, status: e.target.value })}><option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></select></div>
                    <div className="modal-footer">
                        <Button
                            type="submit"
                            className="w-full bg-amber-600 text-white hover:bg-amber-700"
                            loading={isSubmitting}
                            loadingText="Saving..."
                        >
                            {maintenanceId ? "Update Request" : "Log Request"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Rooms Modal (Read-Only/Quick Actions) */}
            <Modal isOpen={isViewRoomsModalOpen} onClose={() => setIsViewRoomsModalOpen(false)} title={`Rooms: ${selectedHostel?.name || ''}`}>
                <div className="p-1">
                    <div className="flex justify-between items-center mb-4 p-2 bg-secondary-light rounded-lg">
                        <p className="mb-0 text-sm font-bold">Total Rooms: {rooms.filter(r => r.hostel === selectedHostel?.id).length}</p>
                        <Button variant="primary" size="sm" onClick={() => { setIsViewRoomsModalOpen(false); openAddRoom(selectedHostel); }}>+ Add Room</Button>
                    </div>
                    {rooms.filter(r => r.hostel === selectedHostel?.id).length === 0 ? (
                        <p className="text-secondary text-center p-4 italic">No rooms configured.</p>
                    ) : (
                        <div className="overflow-auto max-h-[400px]">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left text-xs uppercase p-2">Room #</th>
                                        <th className="text-left text-xs uppercase p-2">Type</th>
                                        <th className="text-left text-xs uppercase p-2">Capacity</th>
                                        <th className="text-left text-xs uppercase p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rooms.filter(r => r.hostel === selectedHostel?.id).map(r => (
                                        <tr key={r.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2 text-sm font-bold">{r.room_number}</td>
                                            <td className="p-2 text-xs">{r.room_type}</td>
                                            <td className="p-2 text-xs">{r.capacity} Beds</td>
                                            <td className="p-2 flex gap-2">
                                                <button className="btn btn-xs btn-outline" onClick={() => { setIsViewRoomsModalOpen(false); openEditRoom(r); }} title="Edit Room"><Edit size={12} /></button>
                                                <button className="btn btn-xs btn-outline" onClick={() => { setIsViewRoomsModalOpen(false); openViewResidents({ ...selectedHostel, roomFilter: r.id }); }} title="View Students"><Users size={12} /></button>
                                                <button className="btn btn-xs btn-outline text-error" onClick={() => handleDeleteRoom(r.id)} title="Delete Room"><Trash2 size={12} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Modal>

            {/* View Residents Modal */}
            <Modal isOpen={isViewResidentsModalOpen} onClose={() => setIsViewResidentsModalOpen(false)} title={`Residents: ${selectedHostel?.name || ''}`}>
                <div className="p-1">
                    {viewHostelResidents.length === 0 ? (
                        <p className="text-secondary text-center p-4 italic">No active residents in this hostel.</p>
                    ) : (
                        <div className="overflow-auto max-h-[400px]">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left text-xs uppercase p-2">Student</th>
                                        <th className="text-left text-xs uppercase p-2">Room/Bed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewHostelResidents.map(r => (
                                        <tr key={r.id} className="border-b">
                                            <td className="p-2 text-sm font-bold">{r.student_name}</td>
                                            <td className="p-2 text-xs font-mono">{r.room_number} / Bed {r.bed_number}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Modal>



            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white; color: black; }
                }

                .print-only { display: none; }
                .tab-link { 
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border-bottom: 2px solid transparent;
                    color: var(--text-secondary);
                    font-weight: 700;
                    transition: all 0.2s;
                    white-space: nowrap;
                    background: none;
                    border-top: none;
                    border-left: none;
                    border-right: none;
                    cursor: pointer;
                }
                .tab-link.active { 
                    border-bottom-color: var(--primary);
                    color: var(--primary);
                    background: rgba(30, 60, 114, 0.05);
                }
                .avatar-sm { 
                    width: 2rem;
                    height: 2rem;
                    border-radius: 9999px;
                    background: var(--primary);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.75rem;
                }
                .status-badge.success { 
                    background: var(--success-light);
                    color: var(--success);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .status-badge.secondary { 
                    background: var(--bg-secondary);
                    color: var(--text-secondary);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
            `}</style>
        </div >
    );
};

export default Hostels;

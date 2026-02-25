import React, { useEffect, useState } from 'react';
import {
    Plus, Building, Edit, Trash2, Users, Users as UsersIcon, Printer, Wrench, Bed as BedIcon,
    Layout, ShieldAlert, Search
} from 'lucide-react';
import { hostelAPI, studentsAPI, staffAPI } from '../api/api';
import { exportToCSV } from '../utils/export';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { StatCard } from '../components/Card';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';
import PremiumDateInput from '../components/common/DatePicker';

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
    const [assetFormData, setAssetFormData] = useState<any>({ asset_code: '', asset_type: 'FURNITURE', type: 'FURNITURE', condition: 'GOOD', value: 0, quantity: 1, hostel: '', room: '' });
    const [attendanceFormData, setAttendanceFormData] = useState<any>({ student: '', date: new Date().toISOString().split('T')[0], status: 'PRESENT', session: 'EVENING', remarks: '' });
    const [disciplineFormData, setDisciplineFormData] = useState({ student: '', offence: '', description: '', date: new Date().toISOString().split('T')[0], action_taken: '', severity: 'MINOR' });
    const [maintenanceFormData, setMaintenanceFormData] = useState({ hostel: '', room: '', issue: '', repair_cost: 0, status: 'PENDING', date: new Date().toISOString().split('T')[0] });

    // Filter States for Modals (Strict Cascading)
    const [filterHostel, setFilterHostel] = useState<string>(''); // Used across modals to drive Room dropdown


    const [selectedHostel, setSelectedHostel] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewHostelResidents, setViewHostelResidents] = useState<any[]>([]);
    const [isViewResidentsModalOpen, setIsViewResidentsModalOpen] = useState(false);

    // Pagination state for large tables
    const HOSTEL_PAGE_SIZE = 25;
    const [allocPage, setAllocPage] = useState(1);
    const [allocTotal, setAllocTotal] = useState(0);
    const [discPage, setDiscPage] = useState(1);
    const [discTotal, setDiscTotal] = useState(0);

    const [stats, setStats] = useState({
        totalHostels: 0,
        totalCapacity: 0,
        totalResidents: 0,
        maintenanceIssues: 0
    });

    // Unified Search & Page Reset Effect
    useEffect(() => {
        const handler = setTimeout(() => {
            // Only trigger server-side search for paginated tabs
            if (activeTab === 'allocations') {
                setAllocPage(1);
                loadAllocations();
            } else if (activeTab === 'discipline') {
                setDiscPage(1);
                loadDiscipline();
            }
        }, 400);
        return () => clearTimeout(handler);
    }, [searchTerm, activeTab]); // Trigger when tab changes too, to catch existing search term

    useEffect(() => {
        if (activeTab === 'allocations') loadAllocations();
    }, [allocPage]);

    useEffect(() => {
        if (activeTab === 'discipline') loadDiscipline();
    }, [discPage]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Phase 1: Core Essentials (Quickest & Most Important)
            const [hostelsRes, statsRes, studentsRes] = await Promise.all([
                hostelAPI.hostels.getAll(),
                hostelAPI.hostels.getStats(),
                studentsAPI.getAll({ page_size: 500 })
            ]);

            const d = (r: any) => r?.data?.results ?? r?.data ?? [];
            setHostels(d(hostelsRes));
            setStats(statsRes.data);
            setStudents(d(studentsRes));

            // Phase 2: Tab-Specific & Background Data
            // We fire these and let them finish ASAP
            const backgroundPromises = [
                hostelAPI.rooms.getAll({ page_size: 500 }),
                hostelAPI.beds.getAll({ page_size: 1000 }),
                staffAPI.getAll({ page_size: 100 }),
                hostelAPI.attendance.getAll({ page_size: 300, ordering: '-date' }),
                hostelAPI.assets.getAll({ page_size: 500 }),
                hostelAPI.maintenance.getAll({ page_size: 200 })
            ];

            const [roomsRes, bedsRes, staffRes, attendanceRes, assetsRes, maintenanceRes] = await Promise.all(backgroundPromises);

            setRooms(d(roomsRes));
            setBeds(d(bedsRes));
            setStaff(d(staffRes));
            setAttendance(d(attendanceRes));
            setAssets(d(assetsRes));
            setMaintenance(d(maintenanceRes));

            // Paginated data initialized separately by side-effects
            if (activeTab !== 'allocations') loadAllocations();
            if (activeTab !== 'discipline') loadDiscipline();

        } catch (error) {
            console.error('Error loading hostel data:', error);
            toastError("Modular data synchronization lag detected. Please refresh if issues persist.");
        } finally {
            setLoading(false);
        }
    };

    const loadAllocations = async () => {
        const params: any = { page: allocPage, page_size: HOSTEL_PAGE_SIZE };
        if (searchTerm) params.search = searchTerm;
        const res = await hostelAPI.allocations.getAll(params);
        setAllocations(res.data?.results ?? res.data ?? []);
        setAllocTotal(res.data?.count ?? 0);
    };

    const loadDiscipline = async () => {
        const params: any = { page: discPage, page_size: HOSTEL_PAGE_SIZE };
        if (searchTerm) params.search = searchTerm;
        const res = await hostelAPI.discipline.getAll(params);
        setDiscipline(res.data?.results ?? res.data ?? []);
        setDiscTotal(res.data?.count ?? 0);
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
    const handleEditHostel = (h: any) => {
        setHostelId(h.id);
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
    const openEditRoom = (r: any) => { setRoomId(r.id); setRoomFormData({ ...r, hostel: String(r.hostel) }); setIsRoomModalOpen(true); };
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
                console.error(`Failed for student ${studentId}`, err);
                const msg = err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message;
                errors.push(`Student ${studentId}: ${msg} `);
            }
        }

        loadData();
        setIsAttendanceModalOpen(false);
        setBulkAttendanceRoom(null);
        setBulkAttendanceData({});

        if (successCount === studentIds.length) {
            success(`Roll call complete.Processed ${successCount}/${studentIds.length} students successfully.`);
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

    // using stats from state



    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

    return (
        <div className="fade-in px-4">
            {/* Header section with Stats Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="w-full lg:w-auto">
                    <h1 className="text-3xl font-black tracking-tight">Boarding & Hostel Management</h1>
                    <p className="text-secondary text-sm font-medium">Institutional residence logistics, safety, and inventory</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-start lg:justify-end no-print">
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => window.print()} icon={<Printer size={18} />}>Reports</Button>
                    <Button variant="primary" size="sm" className="flex-1 sm:flex-none" onClick={() => setIsAllocationModalOpen(true)} icon={<Plus size={18} />}>New Admission</Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-md mb-8">
                <StatCard title="Hostels" value={stats.totalHostels} icon={<Building />} gradient="linear-gradient(135deg, #0f172a, #1e293b)" />
                <StatCard title="Residents" value={stats.totalResidents} icon={<UsersIcon />} gradient="linear-gradient(135deg, #10b981, #059669)" />
                <StatCard title="Occupancy" value={`${Math.round((stats.totalResidents / (stats.totalCapacity || 1)) * 100)}%`} icon={<Layout />} gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
                <StatCard title="Maintenance" value={stats.maintenanceIssues} icon={<Wrench />} gradient="linear-gradient(135deg, #ef4444, #dc2626)" />
            </div>

            {/* Tabs Navigation */}
            <div className="nav-tab-container no-print">
                <button className={`nav-tab ${activeTab === 'registry' ? 'active' : ''}`} onClick={() => setActiveTab('registry')}>Registry</button>
                <button className={`nav-tab ${activeTab === 'allocations' ? 'active' : ''}`} onClick={() => setActiveTab('allocations')}>Allocations</button>
                <button className={`nav-tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>Attendance</button>
                <button className={`nav-tab ${activeTab === 'discipline' ? 'active' : ''}`} onClick={() => setActiveTab('discipline')}>Discipline</button>
                <button className={`nav-tab ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}>Assets</button>
                <button className={`nav-tab ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>Maintenance</button>
            </div>

            {/* Search & Actions Area */}
            <div className="card mb-6 no-print p-4">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="relative flex-grow w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-50" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            className="input pl-10 h-11 bg-slate-50 border-transparent focus:bg-white"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Top sort removed as requested to eliminate redundancy */}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'registry' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                    {hostels.length > 0 ? (
                        hostels.filter(h =>
                            !searchTerm ||
                            h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (h.warden_name || '').toLowerCase().includes(searchTerm.toLowerCase())
                        ).map(h => (
                            <div key={h.id} className="card p-6 border-top-4 border-primary hover-scale">
                                <div className="flex justify-between items-start mb-4">
                                    <div><h3 className="mb-0">{h.name}</h3><span className={`badge ${h.gender_allowed === 'M' ? 'badge-primary' : 'badge-error'}`}>{h.gender_allowed === 'M' ? 'BOYS' : 'GIRLS'}</span></div>
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
                                <div className="flex gap-2 mt-6 pt-4 border-top">
                                    <button className="btn btn-sm btn-outline flex-1 gap-1" onClick={() => openViewRooms(h)} title="View Rooms"><BedIcon size={14} /> Rooms</button>
                                    <button className="btn btn-sm btn-outline flex-1 gap-2" onClick={() => handleEditHostel(h)} title="Edit Details"><Edit size={14} /> Edit</button>
                                    <button className="btn btn-sm btn-outline flex-1 gap-2" onClick={() => openViewResidents(h)} title="View Residents"><Users size={14} /> Users</button>
                                    <button className="btn btn-sm btn-outline text-error" onClick={(e) => { e.stopPropagation(); handleDeleteHostel(h.id); }} title="Delete Hostel"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center opacity-40">
                            <Building size={48} className="mx-auto mb-2" />
                            <p className="font-medium italic">No hostels registered.</p>
                        </div>
                    )}
                    <div className="card p-6 flex flex-col items-center justify-center border-dashed border-2 text-secondary cursor-pointer hover-bg-secondary" onClick={() => setIsHostelModalOpen(true)}>
                        <Plus size={32} className="mb-2" />
                        <p className="font-bold">Add New Hostel</p>
                    </div>
                </div>
            )
            }

            {/* Allocations Tab */}
            {
                activeTab === 'allocations' && (
                    <div className="table-container fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3>Student Allocations</h3>
                            <div className="flex gap-2 items-center">
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
                                {allocations.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10">
                                            <div className="flex flex-col items-center opacity-40">
                                                <UsersIcon size={40} className="mb-2" />
                                                <p className="font-medium">No student allocations found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {allocations.map((a: any) => (
                                    <tr key={a.id}>
                                        <td className="font-bold">
                                            {a.student_name || students.find(s => String(s.id) === String(a.student))?.full_name || `ID: ${a.student}`}
                                        </td>
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
                        {/* Allocations Pagination */}
                        {allocTotal > HOSTEL_PAGE_SIZE && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <span className="text-sm text-secondary">
                                    Showing {((allocPage - 1) * HOSTEL_PAGE_SIZE) + 1}–{Math.min(allocPage * HOSTEL_PAGE_SIZE, allocTotal)} of {allocTotal} allocations
                                </span>
                                <div className="flex gap-2">
                                    <button className="btn btn-outline btn-sm" onClick={() => setAllocPage(p => Math.max(1, p - 1))} disabled={allocPage === 1}>← Prev</button>
                                    <span className="btn btn-ghost btn-sm pointer-events-none">Page {allocPage} / {Math.ceil(allocTotal / HOSTEL_PAGE_SIZE)}</span>
                                    <button className="btn btn-outline btn-sm" onClick={() => setAllocPage(p => p + 1)} disabled={allocPage * HOSTEL_PAGE_SIZE >= allocTotal}>Next →</button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Assets Tab */}
            {
                activeTab === 'assets' && (
                    <div className="table-container fade-in">
                        <div className="flex items-center gap-4">
                            <h3>Hostel Assets</h3>
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
                                {[...assets].filter(a =>
                                    !searchTerm ||
                                    (a.asset_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (a.asset_type || '').toLowerCase().includes(searchTerm.toLowerCase())
                                ).map(a => (
                                    <tr key={a.id}>
                                        <td className="font-bold">{a.asset_code}</td>
                                        <td><span className="badge badge-info">{a.asset_type}</span></td>
                                        <td>{a.condition}</td>
                                        <td>{hostels.find(h => String(h.id) === String(a.hostel))?.name || (a.room ? hostels.find(h => String(h.id) === String(rooms.find(r => String(r.id) === String(a.room))?.hostel))?.name : 'General')}</td>
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
                )
            }

            {/* Attendance Tab */}
            {
                activeTab === 'attendance' && (
                    <div className="table-container fade-in">
                        <div className="flex justify-between items-center mb-4 no-print">
                            <h3>Hostel Attendance</h3>

                            <div className="flex gap-2 items-center">

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
                                {attendance.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 opacity-40 italic">
                                            No attendance records for the selected period.
                                        </td>
                                    </tr>
                                )}
                                {attendance
                                    .filter(a =>
                                        !searchTerm ||
                                        (a.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (a.date || '').includes(searchTerm) ||
                                        (a.session || '').toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map(a => (
                                        <tr key={a.id}>
                                            <td>{a.date}</td>
                                            <td><span className="badge badge-ghost text-xs">{a.session || 'N/A'}</span></td>
                                            <td className="font-bold">{a.student_name || students.find(s => String(s.id) === String(a.student))?.full_name}</td>
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
                )
            }

            {/* Discipline Tab */}
            {
                activeTab === 'discipline' && (
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
                                {discipline.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 opacity-40 italic">
                                            No discipline records found.
                                        </td>
                                    </tr>
                                )}
                                {discipline.map((d: any) => (
                                    <tr key={d.id}>
                                        <td>{d.date || d.incident_date}</td>
                                        <td className="font-bold">{students.find(s => String(s.id) === String(d.student))?.full_name}</td>
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
                        {/* Discipline Pagination */}
                        {discTotal > HOSTEL_PAGE_SIZE && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <span className="text-sm text-secondary">
                                    Showing {((discPage - 1) * HOSTEL_PAGE_SIZE) + 1}–{Math.min(discPage * HOSTEL_PAGE_SIZE, discTotal)} of {discTotal} records
                                </span>
                                <div className="flex gap-2">
                                    <button className="btn btn-outline btn-sm" onClick={() => setDiscPage(p => Math.max(1, p - 1))} disabled={discPage === 1}>← Prev</button>
                                    <span className="btn btn-ghost btn-sm pointer-events-none">Page {discPage} / {Math.ceil(discTotal / HOSTEL_PAGE_SIZE)}</span>
                                    <button className="btn btn-outline btn-sm" onClick={() => setDiscPage(p => p + 1)} disabled={discPage * HOSTEL_PAGE_SIZE >= discTotal}>Next →</button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Maintenance Tab */}
            {
                activeTab === 'maintenance' && (
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
                                {maintenance.filter(m =>
                                    !searchTerm ||
                                    (hostels.find(h => String(h.id) === String(m.hostel))?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (m.issue || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (m.status || '').toLowerCase().includes(searchTerm.toLowerCase())
                                ).map(m => (
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
                )
            }

            {/* Modals */}
            {/* Modals */}
            <Modal isOpen={isHostelModalOpen} onClose={() => setIsHostelModalOpen(false)} title={hostelId ? "Edit Hostel" : "Add New Hostel"}>
                <form onSubmit={handleHostelSubmit} className="space-y-4">
                    <div className="form-group"><label className="label">Name</label><input type="text" className="input" value={hostelFormData.name} onChange={e => setHostelFormData({ ...hostelFormData, name: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Type</label>
                            <SearchableSelect
                                options={[
                                    { id: 'BOARDING', label: 'Boarding' },
                                    { id: 'DAY', label: 'Day Scholar' }
                                ]}
                                value={hostelFormData.hostel_type}
                                onChange={(val) => setHostelFormData({ ...hostelFormData, hostel_type: val.toString() })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Gender</label>
                            <SearchableSelect
                                options={[
                                    { id: 'M', label: 'Male' },
                                    { id: 'F', label: 'Female' },
                                    { id: 'MIXED', label: 'Mixed' }
                                ]}
                                value={hostelFormData.gender_allowed}
                                onChange={(val) => setHostelFormData({ ...hostelFormData, gender_allowed: val.toString() })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Capacity</label><input type="number" className="input" value={hostelFormData.capacity} onChange={e => setHostelFormData({ ...hostelFormData, capacity: parseInt(e.target.value) })} required /></div>
                        <div className="form-group">
                            <label className="label">Warden In-Charge</label>
                            <SearchableSelect
                                label="Warden In-Charge"
                                placeholder="Search Warden..."
                                options={staff.filter(s => s.role === 'WARDEN').map(s => ({
                                    id: String(s.id),
                                    label: `${s.user.first_name} ${s.user.last_name}`,
                                    subLabel: s.employee_id
                                }))}
                                value={String(hostelFormData.warden)}
                                onChange={(val) => setHostelFormData({ ...hostelFormData, warden: val.toString() })}
                            />
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
                    <SearchableSelect
                        label="Hostel"
                        placeholder="Select Hostel..."
                        options={hostels.map(h => ({ id: h.id.toString(), label: h.name }))}
                        value={roomFormData.hostel}
                        onChange={(val) => setRoomFormData({ ...roomFormData, hostel: val.toString() })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Room Number</label><input type="text" className="input" value={roomFormData.room_number} onChange={e => setRoomFormData({ ...roomFormData, room_number: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Floor</label><input type="text" className="input" value={roomFormData.floor} onChange={e => setRoomFormData({ ...roomFormData, floor: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Type</label>
                            <SearchableSelect
                                options={[
                                    { id: 'DORM', label: 'Dormitory' },
                                    { id: 'CUBICLE', label: 'Cubicle' },
                                    { id: 'SINGLE', label: 'Single' }
                                ]}
                                value={roomFormData.room_type}
                                onChange={(val) => setRoomFormData({ ...roomFormData, room_type: val.toString() })}
                            />
                        </div>
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
                        <SearchableSelect
                            label="Hostel"
                            placeholder="Select Hostel..."
                            options={hostels.map(h => ({
                                id: String(h.id),
                                label: h.name,
                                subLabel: h.gender_allowed === 'M' ? 'Boys' : h.gender_allowed === 'F' ? 'Girls' : 'Mixed'
                            }))}
                            value={String(allocationFormData.hostel)}
                            onChange={(val) => setAllocationFormData({ ...allocationFormData, hostel: val.toString(), room: '', bed: '' })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <SearchableSelect
                                label="Room"
                                placeholder="Select Room..."
                                options={rooms
                                    .filter(r => String(r.hostel) === allocationFormData.hostel)
                                    .map(r => ({
                                        id: String(r.id),
                                        label: r.room_number,
                                        subLabel: `${r.available_beds || '?'} free beds`
                                    }))}
                                value={String(allocationFormData.room)}
                                onChange={(val) => setAllocationFormData({ ...allocationFormData, room: val.toString(), bed: '' })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <SearchableSelect
                                label="Bed"
                                placeholder="Select Bed..."
                                options={beds
                                    .filter(b => String(b.room) === allocationFormData.room && (b.status === 'AVAILABLE' || String(b.id) === String(allocationFormData.bed)))
                                    .map(b => ({
                                        id: String(b.id),
                                        label: b.bed_number,
                                        subLabel: b.status !== 'AVAILABLE' ? 'Current' : 'Available'
                                    }))}
                                value={String(allocationFormData.bed)}
                                onChange={(val) => setAllocationFormData({ ...allocationFormData, bed: val.toString() })}
                                required
                            />
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
                </form >
            </Modal >

            <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} title={assetId ? "Edit Asset" : "Add Hostel Asset"}>
                <form onSubmit={handleAssetSubmit} className="space-y-4">
                    <div className="form-group"><label className="label">Asset Code/Name</label><input type="text" className="input" value={assetFormData.asset_code} onChange={e => setAssetFormData({ ...assetFormData, asset_code: e.target.value })} placeholder="e.g. BED-001" /></div>

                    <div className="grid grid-cols-2 gap-4">
                        <SearchableSelect
                            label="Hostel"
                            placeholder="Select Hostel..."
                            options={hostels.map(h => ({ id: h.id.toString(), label: h.name }))}
                            value={String(assetFormData.hostel)}
                            onChange={(val) => setAssetFormData({ ...assetFormData, hostel: val.toString(), room: '' })}
                            required
                        />
                        <SearchableSelect
                            label="Room (Optional)"
                            placeholder="General / Store"
                            options={rooms.filter(r => String(r.hostel) === assetFormData.hostel).map(r => ({ id: r.id.toString(), label: r.room_number }))}
                            value={String(assetFormData.room)}
                            onChange={(val) => setAssetFormData({ ...assetFormData, room: val.toString() })}
                            disabled={!assetFormData.hostel}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Type</label>
                            <SearchableSelect
                                options={[
                                    { id: 'FURNITURE', label: 'Furniture' },
                                    { id: 'ELECTRONIC', label: 'Electronic' },
                                    { id: 'OTHER', label: 'Other' }
                                ]}
                                value={assetFormData.type}
                                onChange={(val) => setAssetFormData({ ...assetFormData, type: val.toString() })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Condition</label>
                            <SearchableSelect
                                options={[
                                    { id: 'GOOD', label: 'Good' },
                                    { id: 'FAIR', label: 'Fair' },
                                    { id: 'POOR', label: 'Poor' }
                                ]}
                                value={assetFormData.condition}
                                onChange={(val) => setAssetFormData({ ...assetFormData, condition: val.toString() })}
                            />
                        </div>
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
                            <div className="form-group pb-2">
                                <PremiumDateInput
                                    label="Date"
                                    value={attendanceFormData.date}
                                    onChange={(val) => setAttendanceFormData({ ...attendanceFormData, date: val })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Session</label>
                                <SearchableSelect
                                    options={[
                                        { id: 'MORNING', label: 'Morning' },
                                        { id: 'EVENING', label: 'Evening' },
                                        { id: 'NIGHT', label: 'Night' }
                                    ]}
                                    value={attendanceFormData.session}
                                    onChange={(val) => setAttendanceFormData({ ...attendanceFormData, session: val.toString() })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="label">Status</label>
                                <SearchableSelect
                                    options={[
                                        { id: 'PRESENT', label: 'Present' },
                                        { id: 'ABSENT', label: 'Absent' },
                                        { id: 'PERMITTED', label: 'Permitted' }
                                    ]}
                                    value={attendanceFormData.status}
                                    onChange={(val) => setAttendanceFormData({ ...attendanceFormData, status: val.toString() })}
                                />
                            </div>
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
                            <SearchableSelect
                                label="Hostel"
                                placeholder="Select Hostel..."
                                options={hostels.map(h => ({ id: h.id.toString(), label: h.name }))}
                                value={filterHostel}
                                onChange={(val) => {
                                    setFilterHostel(val.toString());
                                    setBulkAttendanceRoom(null);
                                    setBulkAttendanceData({});
                                }}
                            />

                            <SearchableSelect
                                label="Room"
                                placeholder="Select Room..."
                                options={rooms.filter(r => String(r.hostel) === filterHostel).map(r => ({ id: r.id.toString(), label: r.room_number }))}
                                value={String(bulkAttendanceRoom || '')}
                                onChange={(val) => {
                                    const rId = parseInt(val.toString());
                                    setBulkAttendanceRoom(rId);
                                    const residents = allocations.filter(a => a.room === rId && a.status === 'ACTIVE');
                                    const initialData: any = {};
                                    residents.forEach(r => {
                                        initialData[r.student] = { status: 'PRESENT', remarks: '' };
                                    });
                                    setBulkAttendanceData(initialData);
                                }}
                                disabled={!filterHostel}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group pb-2">
                                <PremiumDateInput
                                    label="Date"
                                    value={attendanceFormData.date}
                                    onChange={(val) => setAttendanceFormData({ ...attendanceFormData, date: val })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Session</label>
                                <SearchableSelect
                                    options={[
                                        { id: 'MORNING', label: 'Morning Call' },
                                        { id: 'EVENING', label: 'Evening Call' },
                                        { id: 'NIGHT', label: 'Night Call' }
                                    ]}
                                    value={attendanceFormData.session}
                                    onChange={(val) => setAttendanceFormData({ ...attendanceFormData, session: val.toString() })}
                                />
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
                    <SearchableSelect label="Student" options={students.map(s => ({ id: String(s.id), label: s.full_name, subLabel: s.admission_number }))} value={String(disciplineFormData.student || '')} onChange={(val) => setDisciplineFormData({ ...disciplineFormData, student: String(val) })} required />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group pb-2">
                            <PremiumDateInput
                                label="Date"
                                value={disciplineFormData.date}
                                onChange={(val) => setDisciplineFormData({ ...disciplineFormData, date: val })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Severity</label>
                            <SearchableSelect
                                options={[
                                    { id: 'MINOR', label: 'Minor' },
                                    { id: 'MAJOR', label: 'Major' },
                                    { id: 'CRITICAL', label: 'Critical' }
                                ]}
                                value={disciplineFormData.severity}
                                onChange={(val) => setDisciplineFormData({ ...disciplineFormData, severity: val.toString() })}
                            />
                        </div>
                    </div>
                    <div className="form-group"><label className="label">Offence</label><input type="text" className="input" value={disciplineFormData.offence} onChange={e => setDisciplineFormData({ ...disciplineFormData, offence: e.target.value })} placeholder="e.g. Late coming" /></div>
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
                        <SearchableSelect
                            label="Hostel"
                            placeholder="Select Hostel..."
                            options={hostels.map(h => ({ id: h.id.toString(), label: h.name }))}
                            value={maintenanceFormData.hostel}
                            onChange={(val) => {
                                setMaintenanceFormData({ ...maintenanceFormData, hostel: val.toString() });
                                setFilterHostel(val.toString());
                            }}
                            required
                        />
                        <SearchableSelect
                            label="Room (Optional)"
                            placeholder="General Area"
                            options={rooms.filter(r => String(r.hostel) === maintenanceFormData.hostel).map(r => ({ id: r.id.toString(), label: r.room_number }))}
                            value={maintenanceFormData.room}
                            onChange={(val) => setMaintenanceFormData({ ...maintenanceFormData, room: val.toString() })}
                            disabled={!maintenanceFormData.hostel}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group pb-2">
                            <PremiumDateInput
                                label="Date"
                                value={maintenanceFormData.date}
                                onChange={(val) => setMaintenanceFormData({ ...maintenanceFormData, date: val })}
                                required
                            />
                        </div>
                        <div className="form-group"><label className="label">Cost (KES)</label><input type="number" className="input" value={maintenanceFormData.repair_cost} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, repair_cost: parseFloat(e.target.value) })} /></div>
                    </div>
                    <div className="form-group"><label className="label">Description</label><textarea className="input" rows={3} value={maintenanceFormData.issue} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, issue: e.target.value })} required placeholder="Describe the maintenance issue..."></textarea></div>
                    <div className="form-group">
                        <label className="label">Status</label>
                        <SearchableSelect
                            options={[
                                { id: 'PENDING', label: 'Pending' },
                                { id: 'IN_PROGRESS', label: 'In Progress' },
                                { id: 'COMPLETED', label: 'Completed' }
                            ]}
                            value={maintenanceFormData.status}
                            onChange={(val) => setMaintenanceFormData({ ...maintenanceFormData, status: val.toString() })}
                        />
                    </div>
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
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={12} /></Button>
                            <Button variant="outline" size="sm" onClick={() => exportToCSV(rooms.filter(r => r.hostel === selectedHostel?.id), `${selectedHostel?.name}_rooms`)} icon={<Layout size={12} />}>CSV</Button>
                        </div>
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
                                    {rooms.filter(r => String(r.hostel) === String(selectedHostel?.id)).map(r => (
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
                        <>
                            <div className="p-2 mb-4 bg-slate-50 flex justify-between items-center rounded-xl">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer size={12} />}>Print</Button>
                                    <Button variant="outline" size="sm" onClick={() => exportToCSV(viewHostelResidents, `${selectedHostel?.name}_residents`)} icon={<UsersIcon size={12} />}>Export</Button>
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-400">Total: {viewHostelResidents.length} Residents</span>
                            </div>
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
                        </>
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

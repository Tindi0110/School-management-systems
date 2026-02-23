import React, { useEffect, useState } from 'react';
import {
    Plus, Building, Edit, Trash2, Users, Users as UsersIcon, Package, Wrench, Bed as BedIcon,
    Layout, Clock, ShieldAlert, Search
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
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 50;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success, error: toastError } = useToast();
    const { confirm } = useConfirm();


    // Modal & Form States
    // ID States for Edit
    const [hostelId, setHostelId] = useState<number | null>(null);

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

    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

    // Form Data
    const [hostelFormData, setHostelFormData] = useState({ name: '', gender_allowed: 'M', hostel_type: 'BOARDING', capacity: 100, warden: '' });

    const [allocationFormData, setAllocationFormData] = useState({ student: '', hostel: '', room: '', bed: '', status: 'ACTIVE' }); // Added hostel for cascading
    const [isTransferMode, setIsTransferMode] = useState(false); // New State
    const [allocationSort, setAllocationSort] = useState<'HOSTEL' | 'ROOM' | 'STATUS'>('HOSTEL'); // New State
    const [attendanceSort, setAttendanceSort] = useState<'DATE' | 'HOSTEL' | 'SESSION'>('DATE'); // New State
    const [assetFormData, setAssetFormData] = useState<any>({ asset_code: '', asset_type: 'FURNITURE', type: 'FURNITURE', condition: 'GOOD', value: 0, quantity: 1, hostel: '', room: '' });
    const [attendanceFormData, setAttendanceFormData] = useState<any>({ student: '', date: new Date().toISOString().split('T')[0], status: 'PRESENT', session: 'EVENING', remarks: '' });
    const [_assetSort, _setAssetSort] = useState({ field: 'asset_code', direction: 'asc' });
    const [disciplineFormData, setDisciplineFormData] = useState({ student: '', offence: '', description: '', date: new Date().toISOString().split('T')[0], action_taken: '', severity: 'MINOR' });
    const [maintenanceFormData, setMaintenanceFormData] = useState({ hostel: '', room: '', issue: '', repair_cost: 0, status: 'PENDING', date: new Date().toISOString().split('T')[0] });

    // Filter States for Modals (Strict Cascading)
    const [_filterHostel, _setFilterHostel] = useState<string>(''); // Used across modals to drive Room dropdown


    const [selectedHostel, setSelectedHostel] = useState<any>(null);
    const [viewHostelResidents, setViewHostelResidents] = useState<any[]>([]);
    const [isViewResidentsModalOpen, setIsViewResidentsModalOpen] = useState(false);

    useEffect(() => {
        setPage(1);
        loadData();
    }, [activeTab]);

    useEffect(() => {
        loadData();
    }, [page]);

    // Debounced search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (page !== 1) setPage(1);
            else loadData();
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = { page, page_size: pageSize, search: searchTerm };

            if (activeTab === 'registry') {
                const res = await hostelAPI.hostels.getAll(params);
                setHostels(res?.data?.results ?? res?.data ?? []);
                setTotalItems(res?.data?.count ?? (res?.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'allocations') {
                const res = await hostelAPI.allocations.getAll(params);
                setAllocations(res?.data?.results ?? res?.data ?? []);
                setTotalItems(res?.data?.count ?? (res?.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'attendance') {
                const res = await hostelAPI.attendance.getAll(params);
                setAttendance(res?.data?.results ?? res?.data ?? []);
                setTotalItems(res?.data?.count ?? (res?.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'discipline') {
                const res = await hostelAPI.discipline.getAll(params);
                setDiscipline(res?.data?.results ?? res?.data ?? []);
                setTotalItems(res?.data?.count ?? (res?.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'assets') {
                const res = await hostelAPI.assets.getAll(params);
                setAssets(res?.data?.results ?? res?.data ?? []);
                setTotalItems(res?.data?.count ?? (res?.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'maintenance') {
                const res = await hostelAPI.maintenance.getAll(params);
                setMaintenance(res?.data?.results ?? res?.data ?? []);
                setTotalItems(res?.data?.count ?? (res?.data?.results ? res.data.results.length : 0));
            }

            // Always fetch dependent data for dropdowns (usually small enough for 100)
            if (['allocations', 'assets', 'maintenance'].includes(activeTab)) {
                if (hostels.length === 0) {
                    const hRes = await hostelAPI.hostels.getAll({ page_size: 100 });
                    setHostels(hRes?.data?.results ?? hRes?.data ?? []);
                }
                if (rooms.length === 0) {
                    const rRes = await hostelAPI.rooms.getAll({ page_size: 500 });
                    setRooms(rRes?.data?.results ?? rRes?.data ?? []);
                }
            }
            if (activeTab === 'allocations' && beds.length === 0) {
                const bRes = await hostelAPI.beds.getAll({ page_size: 1000 });
                setBeds(bRes?.data?.results ?? bRes?.data ?? []);
            }
            if (students.length === 0) {
                const sRes = await studentsAPI.minimalSearch();
                setStudents(sRes?.data?.results ?? sRes?.data ?? []);
            }
            if (staff.length === 0) {
                const stRes = await staffAPI.getAll({ page_size: 200 });
                setStaff(stRes?.data?.results ?? stRes?.data ?? []);
            }

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


    const [isViewRoomsModalOpen, setIsViewRoomsModalOpen] = useState(false);

    const openViewRooms = (h: any) => {
        setSelectedHostel(h);
        setIsViewRoomsModalOpen(true);
    };

    const openViewResidents = (h: any) => {
        setSelectedHostel(h);
        const residents = allocations.filter(a => a.hostel_name === h.name && a.status === 'ACTIVE');
        setViewHostelResidents(residents);
        setIsViewResidentsModalOpen(true);
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
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1>Boarding & Hostel Management</h1>
                    <p className="text-secondary text-sm">Institutional residence logistics, safety, and inventory</p>
                </div>
                <div className="flex-grow max-w-md mx-6 no-print">
                    <div className="search-container">
                        <Search className="search-icon" size={16} />
                        <input
                            type="text"
                            className="input search-input text-xs"
                            placeholder="Search residents, assets, or attendance..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2 no-print">
                    <Button size="sm" onClick={() => setIsAllocationModalOpen(true)} icon={<Plus size={16} />}>New Admission</Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-md mb-8">
                <StatCard title="Hostels" value={stats.totalHostels} icon={<Building />} gradient="linear-gradient(135deg, #0f172a, #1e293b)" />
                <StatCard title="Residents" value={stats.totalResidents} icon={<UsersIcon />} gradient="linear-gradient(135deg, #10b981, #059669)" />
                <StatCard title="Occupancy" value={`${Math.round((stats.totalResidents / (stats.totalCapacity || 1)) * 100)}%`} icon={<Layout />} gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
                <StatCard title="Maintenance" value={stats.maintenanceIssues} icon={<Wrench />} gradient="linear-gradient(135deg, #ef4444, #dc2626)" />
            </div>

            <div className="nav-tab-container mb-6 no-print">
                <button className={`nav-tab ${activeTab === 'registry' ? 'active' : ''}`} onClick={() => setActiveTab('registry')}><Building size={16} /> Registry</button>
                <button className={`nav-tab ${activeTab === 'allocations' ? 'active' : ''}`} onClick={() => setActiveTab('allocations')}><Users size={16} /> Allocations</button>
                <button className={`nav-tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}><Clock size={16} /> Attendance</button>
                <button className={`nav-tab ${activeTab === 'discipline' ? 'active' : ''}`} onClick={() => setActiveTab('discipline')}><ShieldAlert size={16} /> Discipline</button>
                <button className={`nav-tab ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}><Package size={16} /> Assets</button>
                <button className={`nav-tab ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}><Wrench size={16} /> Maintenance</button>
            </div>

            {activeTab === 'registry' && (
                <div className="fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                        {hostels.map(h => (
                            <div key={h.id} className="card border-top-4 border-primary hover-scale">
                                <div className="flex justify-between items-start mb-4">
                                    <div><h3 className="mb-0">{h.name}</h3><span className={`badge ${h.gender_allowed === 'M' ? 'badge-primary' : 'badge-error'}`}>{h.gender_allowed === 'M' ? 'BOYS' : 'GIRLS'}</span></div>
                                    <Building className="text-secondary opacity-20" size={40} />
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span className="text-secondary">Warden:</span><span className="font-semibold text-primary">{staff.find(s => s.id === h.warden)?.full_name || h.warden_name || 'Not Assigned'}</span></div>
                                    <div className="flex justify-between"><span className="text-secondary">Type:</span><span className="font-semibold">{h.hostel_type}</span></div>
                                    <div className="flex justify-between"><span className="text-secondary">Rooms:</span><span className="font-semibold">{rooms.filter(r => r.hostel === h.id).length} Units</span></div>
                                    <div className="w-full bg-secondary-light rounded-full h-2 mt-4 overflow-hidden">
                                        <div className="progress-fill bg-primary" style={{ width: `${h.occupancy_rate || 0}%` }}></div>
                                    </div>
                                    <p className="text-right text-xs font-bold text-primary mt-1">{h.occupancy_rate || 0}% Occupied</p>
                                </div>
                                <div className="flex gap-2 mt-6 pt-4 border-top">
                                    <button className="btn btn-sm btn-outline flex-1 gap-1" onClick={() => openViewRooms(h)}><BedIcon size={14} /> Rooms</button>
                                    <button className="btn btn-sm btn-outline flex-1 gap-2" onClick={() => handleEditHostel(h)}><Edit size={14} /> Edit</button>
                                    <button className="btn btn-sm btn-outline flex-1 gap-2" onClick={() => openViewResidents(h)}><Users size={14} /> Users</button>
                                    <button className="btn btn-sm btn-outline text-error" onClick={(e) => { e.stopPropagation(); handleDeleteHostel(h.id); }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                        <div className="card flex flex-col items-center justify-center border-dashed border-2 text-secondary cursor-pointer hover-bg-secondary" onClick={() => setIsHostelModalOpen(true)}>
                            <Plus size={32} className="mb-2" />
                            <p className="font-bold">Add New Hostel</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100 no-print">
                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest">
                            Showing {Math.min((page - 1) * pageSize + 1, totalItems)} - {Math.min(page * pageSize, totalItems)} of {totalItems} Hostels
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="font-black text-[10px] uppercase">Previous</Button>
                            <Button variant="primary" size="sm" disabled={page * pageSize >= totalItems} onClick={() => setPage(page + 1)} className="font-black text-[10px] uppercase">Next Page</Button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'allocations' && (
                <div className="table-wrapper fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3>Student Allocations</h3>
                        <div className="flex gap-2 items-center">
                            <select className="select select-sm bg-white min-w-[120px]" value={allocationSort} onChange={(e) => setAllocationSort(e.target.value as any)}>
                                <option value="HOSTEL">Hostel</option>
                                <option value="ROOM">Room</option>
                                <option value="STATUS">Status</option>
                            </select>
                            <button className="btn btn-outline btn-sm" onClick={() => exportToCSV(allocations, 'allocations')}><UsersIcon size={14} /> CSV</button>
                            <button className="btn btn-primary btn-sm ml-2" onClick={() => { setAllocationId(null); setIsTransferMode(false); setIsAllocationModalOpen(true); }}><Plus size={14} /> Assign Student</button>
                        </div>
                    </div>
                    <table className="table">
                        <thead><tr><th>Student</th><th>Hostel</th><th>Room</th><th>Bed</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {allocations.map(a => (
                                <tr key={a.id}>
                                    <td className="font-bold">{a.student_name || students.find(s => s.id === a.student)?.full_name}</td>
                                    <td>{a.hostel_name || 'N/A'}</td>
                                    <td>{a.room_number || 'N/A'}</td>
                                    <td>{a.bed_number || 'N/A'}</td>
                                    <td><span className={`badge ${a.status === 'ACTIVE' ? 'badge-success' : 'badge-ghost'}`}>{a.status}</span></td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn btn-sm btn-outline text-info" onClick={() => openTransferModal(a)}>Transfer</button>
                                            <button className="btn btn-sm btn-ghost text-primary" onClick={() => handleEditAllocation(a)}><Edit size={14} /></button>
                                            <button className="btn btn-sm btn-ghost text-error" onClick={() => handleDeleteAllocation(a.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-between items-center mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100 no-print">
                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest">
                            Showing {Math.min((page - 1) * pageSize + 1, totalItems)} - {Math.min(page * pageSize, totalItems)} of {totalItems} Allocations
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="font-black text-[10px] uppercase">Previous</Button>
                            <Button variant="primary" size="sm" disabled={page * pageSize >= totalItems} onClick={() => setPage(page + 1)} className="font-black text-[10px] uppercase">Next Page</Button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="table-wrapper fade-in">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <h3>Hostel Attendance</h3>
                        <div className="flex gap-2 items-center">
                            <select className="select select-sm bg-white min-w-[140px]" value={attendanceSort} onChange={(e) => setAttendanceSort(e.target.value as any)}>
                                <option value="DATE">Date</option>
                                <option value="HOSTEL">Hostel</option>
                                <option value="SESSION">Session</option>
                            </select>
                            <button className="btn btn-primary btn-sm" onClick={() => { setAttendanceId(null); setIsAttendanceModalOpen(true); }}><Plus size={14} /> Log Attendance</button>
                        </div>
                    </div>
                    <table className="table">
                        <thead><tr><th>Date</th><th>Session</th><th>Student</th><th>Hostel</th><th>Status</th><th>Remarks</th><th>Actions</th></tr></thead>
                        <tbody>
                            {attendance.map(a => (
                                <tr key={a.id}>
                                    <td>{a.date}</td>
                                    <td><span className="badge badge-ghost text-xs">{a.session || 'N/A'}</span></td>
                                    <td className="font-bold">{a.student_name || students.find(s => s.id === a.student)?.full_name}</td>
                                    <td className="text-sm text-secondary">{a.hostel_name || 'N/A'}</td>
                                    <td><span className={`badge ${a.status === 'PRESENT' ? 'badge-success' : a.status === 'ABSENT' ? 'badge-error' : 'badge-info'}`}>{a.status}</span></td>
                                    <td>{a.remarks}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn btn-sm btn-ghost text-primary" onClick={() => handleEditAttendance(a)}><Edit size={14} /></button>
                                            <button className="btn btn-sm btn-ghost text-error" onClick={() => handleDeleteAttendance(a.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-between items-center mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100 no-print">
                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest">
                            Showing {Math.min((page - 1) * pageSize + 1, totalItems)} - {Math.min(page * pageSize, totalItems)} of {totalItems} Records
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="font-black text-[10px] uppercase">Previous</Button>
                            <Button variant="primary" size="sm" disabled={page * pageSize >= totalItems} onClick={() => setPage(page + 1)} className="font-black text-[10px] uppercase">Next Page</Button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'discipline' && (
                <div className="table-wrapper fade-in">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <h3>Discipline Records</h3>
                        <button className="btn btn-error btn-sm text-white" onClick={() => { setDisciplineId(null); setIsDisciplineModalOpen(true); }}><ShieldAlert size={14} /> Report Incident</button>
                    </div>
                    <table className="table">
                        <thead><tr><th>Date</th><th>Student</th><th>Infraction</th><th>Severity</th><th>Action Taken</th><th>Actions</th></tr></thead>
                        <tbody>
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
                    <div className="flex justify-between items-center mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100 no-print">
                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest">
                            Showing {Math.min((page - 1) * pageSize + 1, totalItems)} - {Math.min(page * pageSize, totalItems)} of {totalItems} Incidents
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="font-black text-[10px] uppercase">Previous</Button>
                            <Button variant="primary" size="sm" disabled={page * pageSize >= totalItems} onClick={() => setPage(page + 1)} className="font-black text-[10px] uppercase">Next Page</Button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'assets' && (
                <div className="table-wrapper fade-in">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <h3>Hostel Assets</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => { setAssetId(null); setIsAssetModalOpen(true); }}><Plus size={14} /> Add Asset</button>
                    </div>
                    <table className="table">
                        <thead><tr><th>Name</th><th>Type</th><th>Condition</th><th>Value</th><th>Actions</th></tr></thead>
                        <tbody>
                            {assets.map(a => (
                                <tr key={a.id}>
                                    <td className="font-bold">{a.asset_code}</td>
                                    <td><span className="badge badge-info">{a.asset_type}</span></td>
                                    <td>{a.condition}</td>
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
                    <div className="flex justify-between items-center mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100 no-print">
                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest">
                            Showing {Math.min((page - 1) * pageSize + 1, totalItems)} - {Math.min(page * pageSize, totalItems)} of {totalItems} Assets
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="font-black text-[10px] uppercase">Previous</Button>
                            <Button variant="primary" size="sm" disabled={page * pageSize >= totalItems} onClick={() => setPage(page + 1)} className="font-black text-[10px] uppercase">Next Page</Button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'maintenance' && (
                <div className="table-wrapper fade-in">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <h3>Hostel Maintenance</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => { setMaintenanceId(null); setIsMaintenanceModalOpen(true); }}><Wrench size={14} /> Log Request</button>
                    </div>
                    <table className="table">
                        <thead><tr><th>Date</th><th>Hostel</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {maintenance.map(m => (
                                <tr key={m.id}>
                                    <td>{m.date_reported || m.date}</td>
                                    <td className="font-bold">{hostels.find(h => String(h.id) === String(m.hostel))?.name || 'N/A'}</td>
                                    <td>{m.issue}</td>
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
                    <div className="flex justify-between items-center mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100 no-print">
                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest">
                            Showing {Math.min((page - 1) * pageSize + 1, totalItems)} - {Math.min(page * pageSize, totalItems)} of {totalItems} Requests
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="font-black text-[10px] uppercase">Previous</Button>
                            <Button variant="primary" size="sm" disabled={page * pageSize >= totalItems} onClick={() => setPage(page + 1)} className="font-black text-[10px] uppercase">Next Page</Button>
                        </div>
                    </div>
                </div>
            )}

            <Modal isOpen={isHostelModalOpen} onClose={() => setIsHostelModalOpen(false)} title={hostelId ? "Edit Hostel" : "Add New Hostel"}>
                <form onSubmit={handleHostelSubmit} className="space-y-4 form-container-md mx-auto">
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
                                {staff.filter(s => s.role === 'WARDEN').map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer"><Button type="submit" className="w-full" loading={isSubmitting}>{hostelId ? "Update Hostel" : "Create Hostel"}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={isAllocationModalOpen} onClose={() => setIsAllocationModalOpen(false)} title={isTransferMode ? "Transfer Student" : allocationId ? "Edit Allocation" : "New Admission"}>
                <form onSubmit={handleAllocationSubmit} className="space-y-4 form-container-md mx-auto">
                    {!isTransferMode && <SearchableSelect label="Student" options={students.map(s => ({ id: String(s.id), label: s.full_name, subLabel: s.admission_number }))} value={String(allocationFormData.student ?? '')} onChange={(val) => setAllocationFormData({ ...allocationFormData, student: val as string })} required />}
                    {isTransferMode && <div className="bg-primary-light p-3 rounded mb-4 text-primary font-bold">Moving: {students.find(s => String(s.id) === String(allocationFormData.student))?.full_name}</div>}
                    <div className="form-group">
                        <label className="label">Hostel</label>
                        <select className="select" value={allocationFormData.hostel} onChange={e => setAllocationFormData({ ...allocationFormData, hostel: e.target.value, room: '', bed: '' })} required>
                            <option value="">Select Hostel...</option>
                            {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Room</label>
                            <select className="select" value={allocationFormData.room} onChange={e => setAllocationFormData({ ...allocationFormData, room: e.target.value, bed: '' })} required disabled={!allocationFormData.hostel}>
                                <option value="">Select Room...</option>
                                {rooms.filter(r => String(r.hostel) === allocationFormData.hostel).map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Bed</label>
                            <select className="select" value={allocationFormData.bed} onChange={e => setAllocationFormData({ ...allocationFormData, bed: e.target.value })} required disabled={!allocationFormData.room}>
                                <option value="">Select Bed...</option>
                                {beds.filter(b => String(b.room) === allocationFormData.room && (b.status === 'AVAILABLE' || String(b.id) === String(allocationFormData.bed))).map(b => <option key={b.id} value={b.id}>{b.bed_number}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer"><Button type="submit" className="w-full" loading={isSubmitting}>{isTransferMode ? "Confirm Transfer" : allocationId ? "Update" : "Assign"}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} title={assetId ? "Edit Asset" : "Add Asset"}>
                <form onSubmit={handleAssetSubmit} className="space-y-4 form-container-md mx-auto">
                    <div className="form-group"><label className="label">Asset Name</label><input type="text" className="input" value={assetFormData.asset_code} onChange={e => setAssetFormData({ ...assetFormData, asset_code: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Hostel</label><select className="select" value={assetFormData.hostel} onChange={e => setAssetFormData({ ...assetFormData, hostel: e.target.value, room: '' })} required><option value="">Select Hostel...</option>{hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
                        <div className="form-group"><label className="label">Room</label><select className="select" value={assetFormData.room} onChange={e => setAssetFormData({ ...assetFormData, room: e.target.value })} disabled={!assetFormData.hostel}><option value="">General Area</option>{rooms.filter(r => String(r.hostel) === assetFormData.hostel).map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)}</select></div>
                    </div>
                    <div className="modal-footer"><Button type="submit" className="w-full" loading={isSubmitting}>{assetId ? "Update" : "Add"}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title="Attendance">
                <div className="flex gap-4 mb-4 border-b pb-2">
                    <button className={`btn btn-sm ${attendanceMode === 'SINGLE' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAttendanceMode('SINGLE')}>Single</button>
                    <button className={`btn btn-sm ${attendanceMode === 'BULK' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAttendanceMode('BULK')}>Bulk</button>
                </div>
                {attendanceMode === 'SINGLE' ? (
                    <form onSubmit={handleAttendanceSubmit} className="space-y-4 form-container-md mx-auto">
                        <SearchableSelect label="Student" options={students.map(s => ({ id: String(s.id), label: s.full_name, subLabel: s.admission_number }))} value={String(attendanceFormData.student || '')} onChange={(val) => setAttendanceFormData({ ...attendanceFormData, student: val })} required />
                        <PremiumDateInput
                            label="Attendance Date"
                            value={attendanceFormData.date}
                            onChange={(val) => setAttendanceFormData({ ...attendanceFormData, date: val })}
                            minDate={new Date().toISOString().split('T')[0]}
                            required
                        />
                        <div className="modal-footer"><Button type="submit" className="w-full" loading={isSubmitting}>Log Attendance</Button></div>
                    </form>
                ) : (
                    <div className="space-y-4 form-container-md mx-auto">
                        <div className="form-group">
                            <label className="label">Room</label>
                            <select className="select" value={bulkAttendanceRoom || ''} onChange={e => setBulkAttendanceRoom(Number(e.target.value))}>
                                <option value="">Select Room...</option>
                                {rooms.map(r => <option key={r.id} value={r.id}>{r.room_number} ({hostels.find(h => h.id === r.hostel)?.name})</option>)}
                            </select>
                        </div>
                        <div className="modal-footer"><Button type="button" className="w-full" onClick={handleBulkAttendanceSubmit} disabled={!bulkAttendanceRoom}>Submit Bulk</Button></div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isDisciplineModalOpen} onClose={() => setIsDisciplineModalOpen(false)} title="Discipline">
                <form onSubmit={handleDisciplineSubmit} className="space-y-4 form-container-md mx-auto">
                    <SearchableSelect label="Student" options={students.map(s => ({ id: String(s.id), label: s.full_name, subLabel: s.admission_number }))} value={String(disciplineFormData.student ?? '')} onChange={(val) => setDisciplineFormData({ ...disciplineFormData, student: val as string })} required />
                    <PremiumDateInput
                        label="Occurrence Date"
                        value={disciplineFormData.date}
                        onChange={(val) => setDisciplineFormData({ ...disciplineFormData, date: val })}
                        minDate={new Date().toISOString().split('T')[0]}
                        required
                    />
                    <div className="form-group"><label className="label">Offence</label><input type="text" className="input" value={disciplineFormData.offence} onChange={e => setDisciplineFormData({ ...disciplineFormData, offence: e.target.value })} required /></div>
                    <div className="modal-footer"><Button type="submit" className="w-full" loading={isSubmitting}>Report</Button></div>
                </form>
            </Modal>

            <Modal isOpen={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} title="Maintenance">
                <form onSubmit={handleMaintenanceSubmit} className="space-y-4 form-container-md mx-auto">
                    <div className="form-group"><label className="label">Hostel</label><select className="select" value={maintenanceFormData.hostel} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, hostel: e.target.value })} required><option value="">Select Hostel...</option>{hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
                    <PremiumDateInput
                        label="Date Reported"
                        value={maintenanceFormData.date}
                        onChange={(val) => setMaintenanceFormData({ ...maintenanceFormData, date: val })}
                        minDate={new Date().toISOString().split('T')[0]}
                        required
                    />
                    <div className="modal-footer"><Button type="submit" className="w-full" loading={isSubmitting}>Log Request</Button></div>
                </form>
            </Modal>

            <Modal isOpen={isViewRoomsModalOpen} onClose={() => setIsViewRoomsModalOpen(false)} title={`Rooms: ${selectedHostel?.name}`}>
                <div className="p-4">
                    <table className="table">
                        <thead><tr><th>Room #</th><th>Type</th><th>Capacity</th></tr></thead>
                        <tbody>
                            {rooms.filter(r => r.hostel === selectedHostel?.id).map(r => (
                                <tr key={r.id}><td>{r.room_number}</td><td>{r.room_type}</td><td>{r.capacity}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Modal>

            <Modal isOpen={isViewResidentsModalOpen} onClose={() => setIsViewResidentsModalOpen(false)} title={`Residents: ${selectedHostel?.name}`}>
                <div className="p-4">
                    <table className="table">
                        <thead><tr><th>Student</th><th>Room/Bed</th></tr></thead>
                        <tbody>
                            {viewHostelResidents.map(r => (
                                <tr key={r.id}><td>{r.student_name}</td><td>{r.room_number} / {r.bed_number}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Modal>

            <style>{`
                .nav-tab-container { display: flex; gap: 1rem; border-bottom: 2px solid #e2e8f0; }
                .nav-tab { padding: 0.75rem 1rem; font-weight: 700; color: #64748b; border: none; background: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
                .nav-tab.active { color: #1e3c72; border-bottom: 2px solid #1e3c72; background: rgba(30,60,114,0.05); }
                .fade-in { animation: fadeIn 0.3s ease-in; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default Hostels;

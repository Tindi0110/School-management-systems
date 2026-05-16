import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Edit, Trash2, User as UserIcon,
    UserCheck, MapPin, Printer, TrendingUp, Download, ArrowRight
} from 'lucide-react';
import { studentsAPI, academicsAPI, statsAPI } from '../api/api';
import { useSelector } from 'react-redux';
import Modal from '../components/Modal';
import { StatCard } from '../components/Card';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { exportToCSV } from '../utils/export';
import Button from '../components/common/Button';
import CountryCodeSelect from '../components/CountryCodeSelect';
import SearchableSelect from '../components/SearchableSelect';
import PremiumDateInput from '../components/common/DatePicker';
import Skeleton from '../components/common/Skeleton';

const Students = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: any) => state.auth);
    const { success, error: errorToast, info } = useToast();
    const { confirm } = useConfirm();
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [institutionalTotal, setInstitutionalTotal] = useState(0);
    const [activeCount, setActiveCount] = useState(0);
    const [suspendedCount, setSuspendedCount] = useState(0);
    const [boarderCount, setBoarderCount] = useState(0);
    const [dayScholarCount, setDayScholarCount] = useState(0);
    const [pageSize] = useState(25);

    // Consolidated Form Data
    const [formData, setFormData] = useState({
        admission_number: '',
        full_name: '',
        gender: 'M',
        date_of_birth: '',
        category: 'DAY',
        status: 'ACTIVE',
        current_class: '',
        guardian_name: '',
        guardian_phone: '',
        country_code: '+254',
        guardian_email: '',
        is_active: true
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

    useEffect(() => {
        loadData();
    }, [page, selectedClassId, statusFilter]);

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
            const params: any = {
                page,
                page_size: pageSize,
                search: searchTerm,
            };
            
            if (statusFilter !== 'ALL') {
                params.status = statusFilter;
            }
            
            if (selectedClassId) {
                params.current_class = selectedClassId;
            }

            const [studentsRes, classesRes, statsRes] = await Promise.allSettled([
                studentsAPI.getAll(params),
                academicsAPI.classes.getAll({ page_size: 100 }),
                statsAPI.getDashboard()
            ]);

            if (studentsRes.status === 'fulfilled') {
                setStudents(studentsRes.value.data?.results ?? studentsRes.value.data ?? []);
                setTotalItems(studentsRes.value.data?.count ?? (studentsRes.value.data?.results ? studentsRes.value.data.results.length : 0));
            }

            if (classesRes.status === 'fulfilled') {
                setClasses(classesRes.value.data?.results ?? classesRes.value.data ?? []);
            }

            if (statsRes.status === 'fulfilled') {
                const counts = statsRes.value.data?.counts || {};
                setInstitutionalTotal(counts.total_students || 0);
                setActiveCount(counts.active_students || 0);
                setSuspendedCount(counts.suspended_students || 0);
                setBoarderCount(counts.boarder_count || 0);
                setDayScholarCount(counts.day_scholar_count || 0);
            }

        } catch (error) {
            console.error("Critical error loading student registry:", error);
            errorToast("Failed to load students. Please check your connection or contact admin.");
        } finally {
            setLoading(false);
        }
    };

    const reloadStudentsOnly = async () => {
        try {
            const studentsRes = await studentsAPI.getAll({ page_size: 50 });
            setStudents(studentsRes.data?.results ?? studentsRes.data ?? []);
        } catch (error) {
            // silent
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Enforce country code formatting
            let phone = formData.guardian_phone.trim();
            if (phone && !phone.startsWith('+')) {
                phone = `${formData.country_code}${phone.startsWith('0') ? phone.slice(1) : phone}`;
            }

            if (!phone.startsWith('+')) {
                errorToast("Phone number must include a country code (e.g., +254)");
                setIsSubmitting(false);
                return;
            }

            // clear payload of non-model fields
            const { country_code, ...modelData } = formData;

            const payload = {
                ...modelData,
                guardian_phone: phone,
                // Ensure class is sent as integer if selected, or null/undefined if empty
                current_class: formData.current_class ? parseInt(formData.current_class.toString()) : null,
                // Ensure Admission Number is present (Auto-gen if empty)
                admission_number: formData.admission_number || ""
            };



            let response;
            if (editingStudent) {
                response = await studentsAPI.update(editingStudent.id, payload);
            } else {
                // Atomic Creation (Backend handles Parent & Hostel via Signal)

                response = await studentsAPI.create(payload);
                // const newStudentId = response.data.id;

                // No need for separate Parent/Hostel API calls anymore!
                // Backend handles:
                // 1. Student creation
                // 2. Parent creation & linking (if guardian info provided)
                // 3. Hostel allocation (via signal if category=BOARDING)


            }

            await reloadStudentsOnly();
            closeModal();
            if (!editingStudent) {
                success('Admission Successful! Redirecting to profile...');
                
                // Identify the new student ID robustly
                const resAny = response as any;
                let studentId = resAny?.data?.id || resAny?.id;
                
                if (!studentId && resAny?.data) {
                    // Try nested data just in case
                    studentId = resAny.data.data?.id || resAny.data.student?.id;
                }
                
                if (studentId) {
                    setTimeout(() => navigate(`/students/${studentId}`), 1000);
                } else {
                    // Fallback: fetch the most recent student
                    console.warn("ID not found in response, fetching newest student");
                    try {
                        const latestRes = await studentsAPI.getAll({ page_size: 1, ordering: '-id' });
                        const latestId = latestRes?.data?.results?.[0]?.id;
                        if (latestId) {
                            setTimeout(() => navigate(`/students/${latestId}`), 1000);
                            return;
                        }
                    } catch (e) {
                        console.error("Failed to fetch latest student", e);
                    }
                    navigate('/students');
                }
            } else {
                success('Student updated successfully!');
            }

        } catch (error: any) {
            const errorMsg = error.response?.data
                ? JSON.stringify(error.response.data).replace(/[\{\}\"\[\]]/g, ' ').trim()
                : 'Failed to save record.';
            errorToast(`Save Failed: ${errorMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteStudent = async (id: number) => {
        if (!await confirm('Are you sure you want to permanently delete this student? This action cannot be undone.', { type: 'danger' })) return;
        try {
            await studentsAPI.delete(id);
            success('Student deleted successfully.');
            reloadStudentsOnly();
        } catch (error: any) {
            errorToast('Failed to delete student. They may have linked records (fees, exams).');
        }
    };

    const openModal = (student?: any) => {
        if (student) {
            setEditingStudent(student);

            // Extract primary parent if exists to auto-populate guardian details
            const primaryParent = student.parents_detail?.find((p: any) => p.is_primary) || student.parents_detail?.[0];
            const autoGuardianName = student.guardian_name || primaryParent?.full_name || '';
            const autoGuardianPhone = student.guardian_phone || primaryParent?.phone || '';
            const autoGuardianEmail = student.guardian_email || primaryParent?.email || '';

            setFormData({
                admission_number: student.admission_number,
                full_name: student.full_name,
                gender: student.gender,
                date_of_birth: student.date_of_birth,
                category: student.category || 'DAY',
                status: student.status || 'ACTIVE',
                current_class: student.current_class?.id?.toString() || student.current_class?.toString() || '',
                guardian_name: autoGuardianName,
                guardian_phone: autoGuardianPhone,
                country_code: (autoGuardianPhone || '').startsWith('+') ? autoGuardianPhone.slice(0, 4) : '+254',
                guardian_email: autoGuardianEmail,
                is_active: student.is_active
            });
        } else {
            setEditingStudent(null);
            setFormData({
                admission_number: '',
                full_name: '',
                gender: 'M',
                date_of_birth: '',
                category: 'DAY',
                status: 'ACTIVE',
                current_class: '',
                guardian_name: '',
                guardian_phone: '',
                country_code: '+254',
                guardian_email: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingStudent(null); };

    const filteredStudents = students; // Logic moved to server-side


    const renderSkeletonStats = () => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-8 no-print">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="card p-6 bg-white border border-gray-100 rounded-2xl">
                    <Skeleton variant="text" width="60%" className="mb-2" />
                    <Skeleton variant="rect" height="32px" width="40%" />
                </div>
            ))}
        </div>
    );

    const renderSkeletonTable = () => (
        <div className="table-wrapper">
            <table className="table">
                <thead>
                    <tr>
                        <th>Identity</th>
                        <th>Class / Unit</th>
                        <th>Financials</th>
                        <th>Adherence</th>
                        <th>Presence</th>
                        <th className="no-print">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {[1, 2, 3, 4, 5].map(i => (
                        <tr key={i}>
                            <td>
                                <div className="flex items-center gap-3">
                                    <Skeleton variant="circle" width="40px" height="40px" />
                                    <div className="flex flex-col gap-1 flex-1">
                                        <Skeleton variant="text" width="120px" />
                                        <Skeleton variant="text" width="80px" />
                                    </div>
                                </div>
                            </td>
                            <td><Skeleton variant="text" width="100px" /><Skeleton variant="text" width="60px" /></td>
                            <td><Skeleton variant="text" width="80px" /></td>
                            <td><Skeleton variant="rect" width="60px" height="20px" /></td>
                            <td><Skeleton variant="text" width="50px" /></td>
                            <td><Skeleton variant="rect" width="100px" height="30px" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="fade-in">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 no-print">

                <div className="w-full lg:w-auto">
                    <h1 className="text-3xl font-black tracking-tight uppercase">Institutional Registry</h1>
                    <p className="text-secondary text-[10px] font-black uppercase tracking-[0.2em] opacity-60">SIS Management Center | Enrollment: {institutionalTotal}</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-start lg:justify-end">
                    <Button variant="ghost" className="text-[10px] font-black uppercase" onClick={() => exportToCSV(students, 'student_registry')} icon={<Download size={16} />}>
                        Export
                    </Button>
                    <Button
                        variant="ghost"
                        className="text-[10px] font-black uppercase"
                        onClick={() => {
                            document.title = "Student_Registry_Report";
                            window.print();
                        }}
                        icon={<Printer size={16} />}
                    >
                        Report
                    </Button>
                    {(user?.role === 'ADMIN' || user?.role === 'REGISTRAR') && (
                        <Button variant="primary" className="text-[10px] font-black uppercase shadow-lg shadow-primary/20" onClick={() => openModal()} icon={<Plus size={16} />}>
                            Admission
                        </Button>
                    )}
                </div>
            </div>

            {/* Dashboard Stats */}
            {loading ? renderSkeletonStats() : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-md mb-8 no-print">
                    <StatCard title="Active Enrollment" value={activeCount.toString()} icon={<UserCheck size={18} />} gradient="linear-gradient(135deg, #0ba360, #3cba92)" />
                    <StatCard title="Suspended" value={suspendedCount.toString()} icon={<UserIcon size={18} />} gradient="linear-gradient(135deg, #f43f5e, #e11d48)" />
                    <StatCard title="Boarders" value={boarderCount.toString()} icon={<MapPin size={18} />} gradient="var(--info)" />
                    <StatCard title="Day Scholars" value={dayScholarCount.toString()} icon={<UserIcon size={18} />} gradient="var(--secondary)" />
                    <StatCard title="Enrolled Capacity" value={`${classes.length > 0 ? Math.round((activeCount / classes.reduce((sum, c) => sum + (c.capacity || 40), 0)) * 100) : 0}%`} icon={<TrendingUp size={18} />} gradient="linear-gradient(135deg, #0f172a, #1e293b)" />
                </div>
            )}

            {/* Premium Search & Actions Bar */}
            <div className="card mb-8 no-print p-4 bg-white border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="search-container flex-grow max-w-2xl w-full relative">
                        <Search className="search-icon text-primary" size={20} />
                        <input
                            type="text"
                            className="input search-input pl-12 pr-24 py-6 text-base font-medium bg-white border border-slate-100 shadow-inner rounded-xl w-full"
                            placeholder="Find by name or admission number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadData()}
                        />
                        <button 
                            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary flex items-center gap-2 h-10 min-h-0 px-4"
                            onClick={() => loadData()}
                        >
                            <Search size={16} />
                            Search
                        </button>
                    </div>
                    {/* Status Filter Tabs */}
                    <div className="nav-tab-container no-print shrink-0">
                        {(['ACTIVE', 'ALL', 'ALUMNI', 'SUSPENDED'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => { setStatusFilter(s); setPage(1); }}
                                className={`nav-tab ${statusFilter === s ? 'active' : ''}`}
                            >
                                {s === 'ALL' ? '🌐 All' : s}
                            </button>
                        ))}
                    </div>
                </div>
                {statusFilter !== 'ACTIVE' && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        <span className={`px-2 py-0.5 rounded text-white ${
                            statusFilter === 'ALUMNI' ? 'bg-blue-600' :
                            statusFilter === 'SUSPENDED' ? 'bg-red-600' : 'bg-slate-700'
                        }`}>⚠ Viewing: {statusFilter} Students</span>
                        <button onClick={() => { setStatusFilter('ACTIVE'); setPage(1); }} className="text-slate-400 hover:text-slate-700 underline">Switch to Active</button>
                    </div>
                )}
            </div>

            {/* Registry Navigator / Table */}
            <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 overflow-hidden">
                {!selectedClassId ? (
                    <div className="p-10">
                        <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-black uppercase text-slate-800 mb-1">Registry Navigator</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select an academic unit to manage records</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {classes.sort((a, b) => `${a.name}${a.stream}`.localeCompare(`${b.name}${b.stream}`)).map(c => (
                                <div
                                    key={c.id}
                                    className="group relative bg-white/60 hover:bg-white transition-all cursor-pointer p-6 rounded-2xl border border-slate-100 hover:border-primary/30 shadow-sm hover:shadow-xl hover:shadow-primary/10"
                                    onClick={() => setSelectedClassId(c.id)}
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{c.name}</span>
                                            <span className="text-lg font-black text-slate-800">{c.stream}</span>
                                        </div>
                                        <span className="bg-primary/5 text-primary text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-primary/10">
                                            {c.student_count || 0} Records
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-primary group-hover:translate-x-1 transition-transform flex items-center gap-2 uppercase">
                                            Enter Registry <ArrowRight size={14} />
                                        </span>
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-slate-100">
                                            <UserIcon size={18} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {classes.length === 0 && <div className="col-span-full py-20 text-center italic text-slate-400 font-bold uppercase text-[10px]">No active classes found in registry metadata.</div>}
                        </div>
                    </div>
                ) : (
                    <div className="fade-in">
                        <div className="p-4 bg-slate-50/50 backdrop-blur-sm border-b border-slate-100 flex justify-between items-center px-8">
                            <div className="flex items-center gap-6">
                                <button onClick={() => setSelectedClassId(null)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
                                    <ArrowRight size={14} className="rotate-180" /> Back to Navigator
                                </button>
                                <div className="h-4 w-[1px] bg-slate-200"></div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Unit:</span>
                                    <span className="bg-slate-800 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                                        {classes.find(c => c.id === selectedClassId)?.name} {classes.find(c => c.id === selectedClassId)?.stream}
                                    </span>
                                </div>
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {totalItems} Students Enrolled
                            </div>
                        </div>

                        <div className="table-container border-none shadow-none p-0">
                            {loading ? renderSkeletonTable() : (
                                <div className="table-wrapper">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Identity</th>
                                                <th>Academic Unit</th>
                                                <th>Financial Status</th>
                                                <th>Conduct</th>
                                                <th>Attendance</th>
                                                <th className="no-print text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map((s) => (
                                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-black text-xs border border-primary/10 shadow-sm">
                                                                {(s.full_name || '??').split(' ').map((n: any) => n[0]).join('').slice(0, 2)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800 text-sm">{s.full_name}</span>
                                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{s.admission_number}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-700 text-sm">{s.class_name || 'Unassigned'}</span>
                                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{s.category}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <span className={`font-black text-xs ${Number(s.fee_balance || 0) <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {Number(s.fee_balance || 0) <= 0 ? 'CLEARED' : `KES ${Number(s.fee_balance).toLocaleString()}`}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Balance</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                            s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                            s.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                            'bg-blue-50 text-blue-600 border border-blue-100'
                                                        }`}>
                                                            {s.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-grow bg-slate-100 h-1.5 rounded-full overflow-hidden w-20">
                                                                <div 
                                                                    className={`h-full rounded-full ${s.attendance_percentage >= 90 ? 'bg-emerald-500' : s.attendance_percentage >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                                    style={{ width: `${s.attendance_percentage || 0}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-500">{s.attendance_percentage || 0}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right no-print">
                                                        <div className="flex gap-2 justify-end">
                                                            <button 
                                                                className={`btn btn-sm ${s.user ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm border-none' : 'btn-ghost text-primary opacity-50'}`} 
                                                                onClick={async () => {
                                                                    if (s.user) {
                                                                        info(`User Account Linked: ID #${s.user}`);
                                                                    } else {
                                                                        if (await confirm(`Generate User Account for ${s.full_name}?`)) {
                                                                            try { 
                                                                                await studentsAPI.linkUser(s.id); 
                                                                                success('User account generated and linked successfully'); 
                                                                                loadData(); 
                                                                            }
                                                                            catch (e) { errorToast('Account linking failed. Ensure student has an admission number.'); }
                                                                        }
                                                                    }
                                                                }} 
                                                                title={s.user ? "User Linked & Active" : "Generate User Account"}
                                                            >
                                                                {s.user ? <UserCheck size={14} className="font-bold" /> : <UserIcon size={14} />}
                                                            </button>
                                                            <button className="btn btn-sm btn-outline px-3" onClick={() => openModal(s)} title="Edit Student"><Edit size={14} /></button>
                                                            <button className="btn btn-sm btn-primary px-3" onClick={() => navigate(`/students/${s.id}`)} title="View Profile"><UserIcon size={14} /></button>
                                                            <button className="btn btn-sm btn-ghost text-error px-2" onClick={() => deleteStudent(s.id)} title="Archive Student"><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            <div className="flex justify-between items-center mt-8 px-6 py-6 bg-slate-50/50 backdrop-blur-sm rounded-3xl border border-slate-100">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Showing {Math.min((page - 1) * pageSize + 1, totalItems)} - {Math.min(page * pageSize, totalItems)} of {totalItems} Records
                                </div>
                                <div className="flex gap-3">
                                    <button disabled={page === 1} onClick={() => setPage(page - 1)} className="modern-btn modern-btn-secondary px-6">PREVIOUS</button>
                                    <button disabled={page * pageSize >= totalItems} onClick={() => setPage(page + 1)} className="modern-btn modern-btn-primary px-6">NEXT PAGE</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                title={editingStudent ? 'Update Student Profile' : 'Student Admission Form'} 
                size="lg"
            >
                <form id="student-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Enrollment Strategy Toggle */}
                    <div className="flex bg-slate-50/80 p-5 rounded-2xl border border-slate-100 justify-between items-center mb-6">
                        <div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">{editingStudent ? 'Current Status' : 'Enrollment Mode'}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase italic">Affects financial structure and accommodation</p>
                        </div>
                        <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 shadow-inner">
                            <button type="button"
                                className={`px-6 py-2.5 rounded-lg text-[10px] font-black transition-all ${formData.category === 'DAY' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                onClick={() => setFormData({ ...formData, category: 'DAY' })}>
                                DAY SCHOLAR
                            </button>
                            <button type="button"
                                className={`px-6 py-2.5 rounded-lg text-[10px] font-black transition-all ${formData.category === 'BOARDING' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                onClick={() => setFormData({ ...formData, category: 'BOARDING' })}>
                                BOARDER
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {/* Section 1: Identity */}
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-secondary uppercase border-b pb-2 tracking-widest">Identity Details</h5>
                            <div className="form-group">
                                <label className="label text-[11px] font-bold uppercase text-slate-500">Full Name *</label>
                                <input type="text" className="input" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required placeholder="Surname, First Middle" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="label text-[11px] font-bold uppercase text-slate-500">ADM No.</label>
                                    <input type="text" className="input font-mono" value={formData.admission_number} onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })} placeholder="YY/XXXX (Auto-gen)" />
                                </div>
                                <div className="form-group">
                                    <label className="label text-[11px] font-bold uppercase text-slate-500">Gender *</label>
                                    <SearchableSelect
                                        options={[
                                            { id: 'M', label: 'Male' },
                                            { id: 'F', label: 'Female' }
                                        ]}
                                        value={formData.gender}
                                        onChange={(val) => setFormData({ ...formData, gender: val.toString() })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group pb-2">
                                <PremiumDateInput
                                    label="Date of Birth"
                                    value={formData.date_of_birth}
                                    onChange={(val) => setFormData({ ...formData, date_of_birth: val })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Section 2: Academic & Status */}
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-secondary uppercase border-b pb-2 tracking-widest">Academic Placement</h5>
                            <div className="form-group">
                                <label className="label text-[11px] font-bold uppercase text-slate-500">Class / Grade *</label>
                                <SearchableSelect
                                    placeholder="Select Class"
                                    options={classes.map(c => ({ id: c.id.toString(), label: `${c.name} ${c.stream}` }))}
                                    value={formData.current_class}
                                    onChange={(val) => setFormData({ ...formData, current_class: val.toString() })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="label text-[11px] font-bold uppercase text-slate-500">Status</label>
                                <SearchableSelect
                                    options={[
                                        { id: 'ACTIVE', label: 'Active Student' },
                                        { id: 'SUSPENDED', label: 'Suspended' },
                                        { id: 'WITHDRAWN', label: 'Withdrawn' },
                                        { id: 'ALUMNI', label: 'Alumni' }
                                    ]}
                                    value={formData.status}
                                    onChange={(val) => setFormData({ ...formData, status: val.toString() })}
                                />
                            </div>
                        </div>

                        {/* Section 3: Guardian */}
                        <div className="space-y-4 col-span-1 md:col-span-2">
                            <h5 className="text-[10px] font-black text-secondary uppercase border-b pb-2 tracking-widest">Guardian / Contact Info</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="form-group">
                                    <label className="label text-[11px] font-bold uppercase text-slate-500">Guardian Name *</label>
                                    <input type="text" className="input" value={formData.guardian_name} onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="label text-[11px] font-bold uppercase text-slate-500">Phone Contact *</label>
                                    <div className="flex gap-2">
                                        <CountryCodeSelect
                                            value={formData.country_code}
                                            onChange={(val) => setFormData({ ...formData, country_code: val })}
                                        />
                                        <input
                                            type="tel"
                                            className="input flex-grow"
                                            value={formData.guardian_phone}
                                            onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                                            required
                                            placeholder="712345678"
                                        />
                                    </div>
                                    <p className="text-[9px] text-secondary mt-1">Select country code and enter mobile number without leading 0</p>
                                </div>
                                <div className="form-group">
                                    <label className="label text-[11px] font-bold uppercase text-slate-500">Email Address</label>
                                    <input type="email" className="input" value={formData.guardian_email} onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })} placeholder="Optional" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer mt-8 pt-6 border-t flex justify-end gap-3">
                        <Button variant="outline" type="button" onClick={closeModal}>Discard Changes</Button>
                        <Button
                            type="submit"
                            className="px-12 font-black shadow-lg"
                            loading={isSubmitting}
                            loadingText={editingStudent ? "UPDATING..." : "ADMITTING..."}
                        >
                            {editingStudent ? 'UPDATE RECORD' : 'COMPLETE ADMISSION'}
                        </Button>
                    </div>
                </form>
            </Modal>

        </div>
    );
};

export default Students;

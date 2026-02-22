import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Edit, Trash2, User as UserIcon,
    UserCheck, MapPin, Printer, TrendingUp, Download
} from 'lucide-react';
import { studentsAPI, academicsAPI } from '../api/api';
import { useSelector } from 'react-redux';
import Modal from '../components/Modal';
import { StatCard } from '../components/Card';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { exportToCSV } from '../utils/export';
import Button from '../components/common/Button';

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
    const [groupBy, setGroupBy] = useState<'NONE' | 'CLASS' | 'CATEGORY' | 'STATUS'>('NONE');
    const [autoAssignHostel, setAutoAssignHostel] = useState(true);

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
        guardian_email: '',
        is_active: true
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [studentsRes, classesRes] = await Promise.all([
                studentsAPI.getAll({ page_size: 50 }),
                academicsAPI.classes.getAll({ page_size: 50 }),
            ]);
            // Handle both paginated { results: [] } and plain array responses
            const studentsData = studentsRes.data?.results ?? studentsRes.data ?? [];
            const classesData = classesRes.data?.results ?? classesRes.data ?? [];
            setStudents(studentsData);
            setClasses(classesData);
        } catch (error) {
            // Error handled by Toast in some cases or just silent
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
            // clear payload of non-model fields
            const { guardian_email, ...modelData } = formData;

            const payload = {
                ...modelData,
                // Ensure class is sent as integer if selected, or null/undefined if empty
                current_class: formData.current_class ? parseInt(formData.current_class.toString()) : null,
                // Ensure Admission Number is present (Auto-gen if empty)
                admission_number: formData.admission_number || `ADM-${Math.floor(10000 + Math.random() * 90000)}`
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
                // Ensure ID is valid before redirecting
                if (response?.data?.id) {
                    setTimeout(() => navigate(`/students/${response.data.id}`), 1000);
                } else {
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
            setFormData({
                admission_number: student.admission_number,
                full_name: student.full_name,
                gender: student.gender,
                date_of_birth: student.date_of_birth,
                category: student.category || 'DAY',
                status: student.status || 'ACTIVE',
                current_class: student.current_class?.toString() || '',
                guardian_name: student.guardian_name || '',
                guardian_phone: student.guardian_phone || '',
                guardian_email: student.guardian_email || '',
                is_active: student.is_active
            });
        } else {
            setEditingStudent(null);
            setFormData({
                admission_number: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
                full_name: '',
                gender: 'M',
                date_of_birth: '',
                category: 'DAY',
                status: 'ACTIVE',
                current_class: '',
                guardian_name: '',
                guardian_phone: '',
                guardian_email: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingStudent(null); };

    const filteredStudents = React.useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return students.filter(s =>
            (s.full_name || '').toLowerCase().includes(lowerSearch) ||
            (s.admission_number || '').toLowerCase().includes(lowerSearch) ||
            (s.class_name || '').toLowerCase().includes(lowerSearch)
        );
    }, [students, searchTerm]);

    // Reusable Table Render
    const renderTable = (list: any[]) => (
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
                    {list.map((s) => (
                        <tr key={s.id} className="hover-bg-secondary transition-all">
                            <td>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs shadow-sm">
                                        {(s.full_name || '??').split(' ').map((n: any) => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-primary text-sm">{s.full_name}</span>
                                        <span className="text-xs text-secondary font-semibold uppercase tracking-wider">{s.admission_number} | <span className={s.category === 'BOARDING' ? 'text-info font-black' : 'text-secondary'}>{s.category}</span></span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm">{s.class_name || 'Unassigned'}</span>
                                    <span className="text-xs text-secondary font-black uppercase">{s.class_stream || 'General'}</span>
                                </div>
                            </td>
                            <td>
                                <div className="flex flex-col">
                                    <span className={`font-black text-xs ${Number(s.fee_balance || 0) === 0 ? 'text-success' : Number(s.fee_balance || 0) < 0 ? 'text-info' : 'text-error'}`}>
                                        {Number(s.fee_balance || 0) === 0 ? 'CLEARED' : (Number(s.fee_balance || 0) < 0 ? `CREDIT: KES ${Math.abs(Number(s.fee_balance)).toLocaleString()}` : `KES ${Number(s.fee_balance).toLocaleString()}`)}
                                    </span>
                                    <span className="text-[10px] text-secondary font-bold uppercase">Balance</span>
                                </div>
                            </td>
                            <td>
                                <span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : s.status === 'SUSPENDED' ? 'badge-error' : 'badge-info'}`}>
                                    {s.status}
                                </span>
                            </td>
                            <td>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-secondary">
                                    <div className={`w-2 h-2 rounded-full ${s.attendance_percentage >= 90 ? 'bg-success' : s.attendance_percentage >= 75 ? 'bg-warning' : 'bg-error'}`}></div> {s.attendance_percentage || 0}% Rate
                                </div>
                            </td>
                            <td className="no-print">
                                <div className="flex gap-2">
                                    <button className="btn btn-sm btn-ghost text-primary" onClick={async () => {
                                        if (s.user) {
                                            info(`User Account Active: ${s.user}`);
                                        } else {
                                            if (await confirm(`Generate User Account for ${s.full_name}?`)) {
                                                try { await studentsAPI.linkUser(s.id); success('User generated successfully'); loadData(); }
                                                catch (e) { errorToast('Linking failed'); }
                                            }
                                        }
                                    }} title={s.user ? "User Linked" : "Generate User Account"}>
                                        {s.user ? <UserCheck size={14} className="text-success" /> : <UserIcon size={14} className="opacity-50" />}
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
    );

    const groupedData = filteredStudents.reduce((groups: any, s) => {
        let key = 'ALL RECORDS';
        if (groupBy === 'CLASS') key = s.class_name ? `Class: ${s.class_name} - ${s.class_stream || 'General'}` : 'Unassigned Units';
        else if (groupBy === 'CATEGORY') key = s.category === 'BOARDING' ? 'Boarding Students' : 'Day Scholars';
        else if (groupBy === 'STATUS') key = `Status: ${s.status}`;

        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
        return groups;
    }, {});

    if (loading) return <div className="flex items-center justify-center p-12 spinner-container"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 no-print">

                <div className="w-full lg:w-auto">
                    <h1 className="text-3xl font-black tracking-tight">Institutional Registry</h1>
                    <p className="text-secondary font-bold uppercase text-[10px] tracking-widest opacity-70">SIS Management | Enrollment: {students.length}</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-start lg:justify-end">
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => exportToCSV(students, 'student_registry')} icon={<Download size={16} />}>
                        Export
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 sm:flex-none"
                        onClick={() => {
                            document.title = "Student_Registry_Report";
                            window.print();
                        }}
                        icon={<Printer size={16} />}
                    >
                        Report
                    </Button>
                    {(user?.role === 'ADMIN' || user?.role === 'REGISTRAR') && (
                        <Button className="flex-1 sm:flex-none" onClick={() => openModal()} icon={<Plus size={16} />}>
                            Admission
                        </Button>
                    )}
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-8 no-print">
                <StatCard title="Active Enrollment" value={students.filter(s => s.status === 'ACTIVE').length.toString()} icon={<UserCheck size={18} />} gradient="linear-gradient(135deg, #0ba360, #3cba92)" />
                <StatCard title="Boarders" value={students.filter(s => s.category === 'BOARDING').length.toString()} icon={<MapPin size={18} />} gradient="var(--info)" />
                <StatCard title="Day Scholars" value={students.filter(s => s.category === 'DAY').length.toString()} icon={<UserIcon size={18} />} gradient="var(--secondary)" />
                <StatCard title="Enrolled Capacity" value={`${classes.length > 0 ? Math.round((students.filter(s => s.status === 'ACTIVE').length / classes.reduce((sum, c) => sum + (c.capacity || 40), 0)) * 100) : 0}%`} icon={<TrendingUp size={18} />} gradient="linear-gradient(135deg, #1e3c72, #2a5298)" />
            </div>

            {/* Content & Filters */}
            <div className="card mb-6 no-print p-6">
                <div className="flex flex-wrap gap-lg items-center">
                    <div className="search-container flex-grow min-w-[300px]">
                        <Search className="search-icon" size={18} />
                        <input type="text" className="input search-input" placeholder="Search by name, identity, or unit..."
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-sm">
                        <span className="text-xs font-black text-secondary uppercase mr-2">Group By:</span>
                        <div className="flex bg-secondary-light p-1 rounded-lg border">
                            {(['NONE', 'CLASS', 'CATEGORY', 'STATUS'] as const).map(g => (
                                <button key={g}
                                    className={`px-4 py-2 rounded-md text-[10px] font-black transition-all ${groupBy === g ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:bg-white'}`}
                                    onClick={() => setGroupBy(g)}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Render Data */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {groupBy === 'NONE' ? (
                    <div className="table-container border-none shadow-none">
                        {renderTable(filteredStudents)}
                        {filteredStudents.length === 0 && <div className="text-center py-16 text-secondary font-bold uppercase text-xs">No matches found in institutional database</div>}
                    </div>
                ) : (
                    <div className="space-y-8 p-6">
                        {Object.keys(groupedData).sort().map(groupKey => (
                            <div key={groupKey} className="table-container shadow-md border border-primary">
                                <div className="p-4 bg-secondary-light flex justify-between items-center border-bottom">
                                    <h3 className="mb-0 text-xs font-black uppercase text-primary tracking-widest">{groupKey}</h3>
                                    <span className="badge badge-info">{groupedData[groupKey].length} Students</span>
                                </div>
                                {renderTable(groupedData[groupKey])}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit/Create Modal - Professional Form */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingStudent ? 'Update Student Record' : 'New Student Admission'} size="md">
                <form onSubmit={handleSubmit} className="p-2">
                    <div className="bg-secondary-light p-4 rounded-lg border mb-6 flex justify-between items-center">
                        <div>
                            <h4 className="text-sm font-black text-primary uppercase mb-1">{editingStudent ? 'Editing Record' : 'New Enrollment'}</h4>
                            <p className="text-xs text-secondary mb-0">Complete all required fields marked with (*)</p>
                        </div>
                        {/* Boarding Toggle Switch */}
                        <div className="flex bg-white p-1 rounded-lg border shadow-sm">
                            <button type="button"
                                className={`px-4 py-2 rounded-md text-xs font-black transition-all ${formData.category === 'DAY' ? 'bg-primary text-white shadow-sm' : 'text-secondary'}`}
                                onClick={() => setFormData({ ...formData, category: 'DAY' })}>
                                DAY SCHOLAR
                            </button>
                            <button type="button"
                                className={`px-4 py-2 rounded-md text-xs font-black transition-all ${formData.category === 'BOARDING' ? 'bg-primary text-white shadow-sm' : 'text-secondary'}`}
                                onClick={() => setFormData({ ...formData, category: 'BOARDING' })}>
                                BOARDING
                            </button>
                        </div>
                    </div>
                    {/* Auto-Hostel Assignment Option */}
                    {formData.category === 'BOARDING' && !editingStudent && (
                        <div className="bg-info-light p-3 rounded-lg border border-info mb-6 flex items-center gap-3 animate-pulse-once">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-primary"
                                checked={autoAssignHostel}
                                onChange={(e) => setAutoAssignHostel(e.target.checked)}
                            />
                            <div>
                                <p className="text-xs font-bold text-primary mb-0">Auto-Assign Hostel Bed</p>
                                <p className="text-[10px] text-secondary mb-0">System will automatically find the first vacant bed and assign it.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Column 1: Identity */}
                        <div className="space-y-4">
                            <h5 className="text-xs font-bold text-secondary uppercase border-bottom pb-2">Identity Details</h5>
                            <div className="form-group">
                                <label className="label">Full Name *</label>
                                <input type="text" className="input" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required placeholder="Surname, First Middle" />
                            </div>
                            <div className="form-group">
                                <label className="label">Admission Number</label>
                                <input type="text" className="input font-mono" value={formData.admission_number} onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })} placeholder="Auto-generated if empty" />
                            </div>
                            <div className="form-group">
                                <label className="label">Date of Birth *</label>
                                <input type="date" className="input" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="label">Gender *</label>
                                <select className="select" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} required>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </div>
                        </div>

                        {/* Column 2: Academic */}
                        <div className="space-y-4">
                            <h5 className="text-xs font-bold text-secondary uppercase border-bottom pb-2">Academic Unit</h5>
                            <div className="form-group">
                                <label className="label">Class / Grade *</label>
                                <select className="select" value={formData.current_class} onChange={(e) => setFormData({ ...formData, current_class: e.target.value })} required>
                                    <option value="">Select Class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.stream}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Status</label>
                                <select className="select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="ACTIVE">Active Student</option>
                                    <option value="SUSPENDED">Suspended</option>
                                    <option value="WITHDRAWN">Withdrawn</option>
                                    <option value="ALUMNI">Alumni</option>
                                </select>
                            </div>
                            <div className="card bg-info-light p-4 border-none mt-8">
                                <p className="text-xs font-bold text-info mb-1">Note:</p>
                                <p className="text-[10px] text-info opacity-80 mb-0">Assigning a class automatically links the student to the class subjects and fee structure.</p>
                            </div>
                        </div>

                        {/* Column 3: Guardian */}
                        <div className="space-y-4">
                            <h5 className="text-xs font-bold text-secondary uppercase border-bottom pb-2">Guardian Contact</h5>
                            <div className="form-group">
                                <label className="label">Guardian Name *</label>
                                <input type="text" className="input" value={formData.guardian_name} onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="label">Phone Contact *</label>
                                <input type="tel" className="input" value={formData.guardian_phone} onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })} required placeholder="+254..." />
                            </div>
                            <div className="form-group">
                                <label className="label">Email Address</label>
                                <input type="email" className="input" value={formData.guardian_email} onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })} placeholder="Optional" />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer mt-8 pt-6 border-top flex justify-end gap-md">
                        <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
                        <Button
                            type="submit"
                            className="px-8 font-black shadow-lg"
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

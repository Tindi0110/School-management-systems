import React, { useEffect, useState } from 'react';
import { Search, Plus, Download, Printer, Filter, UserCheck, MapPin, User as UserIcon, TrendingUp, ShieldAlert } from 'lucide-react';
import { studentsAPI, academicsAPI } from '../api/api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import CountryCodeSelect from '../components/CountryCodeSelect';
import { exportToCSV } from '../utils/exportUtils';

// Modular Components
import StudentTable from '../components/students/StudentTable';
import StudentDetails from '../components/students/StudentDetails';
import { StudentStatsSkeleton, StudentTableSkeleton } from '../components/students/StudentSkeletons';

const StatCard = ({ title, value, icon, gradient }: { title: string, value: string, icon: React.ReactNode, gradient: string }) => (
    <div className="card p-6 border-0 shadow-lg relative overflow-hidden group hover-scale" style={{ background: 'white' }}>
        <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity" style={{ background: gradient, borderRadius: '50%' }}></div>
        <div className="flex items-start justify-between relative z-10">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{title}</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl" style={{ background: gradient }}>
                {icon}
            </div>
        </div>
    </div>
);

const Students = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ACTIVE');
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [activeCount, setActiveCount] = useState(0);
    const [boarderCount, setBoarderCount] = useState(0);
    const [dayScholarCount, setDayScholarCount] = useState(0);
    const [institutionalTotal, setInstitutionalTotal] = useState(0);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { success, error: toastError } = useToast();
    const { confirm } = useConfirm();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        admission_number: '',
        current_class: '',
        date_of_birth: '',
        gender: 'M',
        category: 'DAY',
        guardian_name: '',
        guardian_phone: '',
        guardian_email: '',
        address: '',
        country_code: '+254',
        status: 'ACTIVE'
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const params: any = {
                page,
                page_size: 20,
                search: searchTerm,
            };
            
            if (statusFilter !== 'ALL') {
                params.status = statusFilter;
            }
            
            if (selectedClassId) {
                params.current_class = selectedClassId;
            }

            const [res, classRes, statsRes] = await Promise.all([
                studentsAPI.getAll(params),
                academicsAPI.classes.getAll({ nopage: 'true' }),
                studentsAPI.getStats()
            ]);

            setStudents(res.data.results || []);
            setTotal(res.data.count || 0);
            setClasses(classRes.data || []);
            
            const stats = statsRes.data;
            setActiveCount(stats.active_count || 0);
            setBoarderCount(stats.boarder_count || 0);
            setDayScholarCount(stats.day_scholar_count || 0);
            setInstitutionalTotal(stats.total_count || 0);
        } catch (err) {
            toastError("Failed to load student data. Check connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            loadData();
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm, statusFilter, selectedClassId, page]);

    const openModal = (student: any = null) => {
        if (student) {
            setEditingStudent(student);
            setFormData({
                first_name: student.first_name || '',
                last_name: student.last_name || '',
                admission_number: student.admission_number || '',
                current_class: student.current_class?.id || student.current_class || '',
                date_of_birth: student.date_of_birth || '',
                gender: student.gender || 'M',
                category: student.category || 'DAY',
                guardian_name: student.guardian_name || '',
                guardian_phone: student.guardian_phone || '',
                guardian_email: student.guardian_email || '',
                address: student.address || '',
                country_code: student.country_code || '+254',
                status: student.status || 'ACTIVE'
            });
        } else {
            setEditingStudent(null);
            setFormData({
                first_name: '',
                last_name: '',
                admission_number: '',
                current_class: '',
                date_of_birth: '',
                gender: 'M',
                category: 'DAY',
                guardian_name: '',
                guardian_phone: '',
                guardian_email: '',
                address: '',
                country_code: '+254',
                status: 'ACTIVE'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingStudent) {
                await studentsAPI.update(editingStudent.id, formData);
                success("Student records updated successfully.");
            } else {
                await studentsAPI.create(formData);
                success("New student admitted successfully.");
            }
            setIsModalOpen(false);
            loadData();
        } catch (err: any) {
            toastError(err.message || "Failed to save student record.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (await confirm("Are you sure? This will archive the student record.")) {
            try {
                await studentsAPI.delete(id);
                success("Student record archived.");
                loadData();
            } catch (err) {
                toastError("Failed to delete record.");
            }
        }
    };

    const viewDetails = (student: any) => {
        setSelectedStudent(student);
        setIsDetailsOpen(true);
    };

    const renderSkeletonStats = () => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-8">
            {[1, 2, 3, 4].map(i => <StudentStatsSkeleton key={i} />)}
        </div>
    );

    return (
        <div className="fade-in">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 no-print">

                <div className="w-full lg:w-auto">
                    <h1 className="text-3xl font-black tracking-tight">Institutional Registry</h1>
                    <p className="text-secondary font-bold uppercase text-[10px] tracking-widest opacity-70">SIS Management | Enrollment: {institutionalTotal}</p>
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
            {loading ? renderSkeletonStats() : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-8 no-print">
                    <StatCard title="Active Enrollment" value={activeCount.toString()} icon={<UserCheck size={18} />} gradient="linear-gradient(135deg, #0ba360, #3cba92)" />
                    <StatCard title="Boarders" value={boarderCount.toString()} icon={<MapPin size={18} />} gradient="var(--info)" />
                    <StatCard title="Day Scholars" value={dayScholarCount.toString()} icon={<UserIcon size={18} />} gradient="var(--secondary)" />
                    <StatCard title="Enrolled Capacity" value={`${classes.length > 0 ? Math.round((activeCount / classes.reduce((sum, c) => sum + (c.capacity || 40), 0)) * 100) : 0}%`} icon={<TrendingUp size={18} />} gradient="linear-gradient(135deg, #0f172a, #1e293b)" />
                </div>
            )}

            {/* Registry Status Tabs */}
            <div className="nav-tab-container no-print mb-8">
                <button 
                    className={`nav-tab ${statusFilter === 'ACTIVE' ? 'active' : ''}`} 
                    onClick={() => { setStatusFilter('ACTIVE'); setPage(1); }}
                >
                    <UserCheck size={16} /> Active Students
                </button>
                <button 
                    className={`nav-tab ${statusFilter === 'ALL' ? 'active' : ''}`} 
                    onClick={() => { setStatusFilter('ALL'); setPage(1); }}
                >
                    <Users size={16} /> All Records
                </button>
                <button 
                    className={`nav-tab ${statusFilter === 'ALUMNI' ? 'active' : ''}`} 
                    onClick={() => { setStatusFilter('ALUMNI'); setPage(1); }}
                >
                    <TrendingUp size={16} /> Alumni/Graduated
                </button>
                <button 
                    className={`nav-tab ${statusFilter === 'SUSPENDED' ? 'active' : ''}`} 
                    onClick={() => { setStatusFilter('SUSPENDED'); setPage(1); }}
                >
                    <ShieldAlert size={16} /> Suspended
                </button>
            </div>

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
                            onKeyDown={(e) => e.key === "Enter" && loadData()}
                        />
                        <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary flex items-center gap-2 h-10 min-h-0 px-4"
                            onClick={() => loadData()}
                        >
                            <Search size={16} />
                            Search
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="primary" 
                            onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}
                            icon={<Plus size={18} />}
                        >
                            ADMIT STUDENT
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => exportToCSV(students, 'Student_Registry')}
                            icon={<Download size={18} />}
                        >
                            EXPORT
                        </Button>
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
                                    className="group relative bg-white/60 hover:bg-white transition-all cursor-pointer p-6 rounded-2xl border border-slate-100 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                                    onClick={() => setSelectedClassId(c.id)}
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{c.name}</span>
                                            <span className="text-lg font-black text-slate-800">{c.stream}</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                            <TrendingUp size={14} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-slate-400">
                                        <Users size={12} />
                                        <span>{c.student_count || 0} / {c.capacity || 40} Seats</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-0">
                        <div className="bg-slate-50/80 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedClassId(null)}
                                    className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-primary transition-all border border-transparent hover:border-slate-100"
                                >
                                    <Filter size={18} />
                                </button>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                        {classes.find(c => c.id === selectedClassId)?.name} {classes.find(c => c.id === selectedClassId)?.stream}
                                    </h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Showing {students.length} of {total} records</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => setSelectedClassId(null)}>CLOSE CLASS</Button>
                            </div>
                        </div>

                        {loading ? <StudentTableSkeleton /> : (
                            <StudentTable
                                students={students}
                                onEdit={openModal}
                                onDelete={handleDelete}
                                onView={viewDetails}
                                page={page}
                                setPage={setPage}
                                total={total}
                                pageSize={20}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <StudentDetails
                student={selectedStudent}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingStudent ? "Update Student Records" : "New Student Admission"}
                footer={
                    <>
                        <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" form="student-form" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "Processing..." : (editingStudent ? "Update Record" : "Confirm Admission")}
                        </button>
                    </>
                }
            >
                <form id="student-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label>First Name</label>
                            <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label>Admission Number</label>
                            <input type="text" value={formData.admission_number} onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })} required placeholder="e.g. 2024/001" />
                        </div>
                        <div className="form-group">
                            <label>Class/Form</label>
                            <SearchableSelect
                                options={classes.map(c => ({ id: c.id.toString(), label: `${c.name} - ${c.stream}` }))}
                                value={formData.current_class}
                                onChange={(val) => setFormData({ ...formData, current_class: val.toString() })}
                                required
                                placeholder="Select Class"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Gender</label>
                            <SearchableSelect
                                options={[{ id: 'M', label: 'Male' }, { id: 'F', label: 'Female' }]}
                                value={formData.gender}
                                onChange={(val) => setFormData({ ...formData, gender: val.toString() })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label>Category</label>
                            <SearchableSelect
                                options={[{ id: 'DAY', label: 'Day Scholar' }, { id: 'BOARDING', label: 'Boarding' }]}
                                value={formData.category}
                                onChange={(val) => setFormData({ ...formData, category: val.toString() })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <SearchableSelect
                                options={[
                                    { id: 'ACTIVE', label: 'Active' },
                                    { id: 'ALUMNI', label: 'Alumni/Graduated' },
                                    { id: 'SUSPENDED', label: 'Suspended' },
                                    { id: 'WITHDRAWN', label: 'Withdrawn' }
                                ]}
                                value={formData.status}
                                onChange={(val) => setFormData({ ...formData, status: val.toString() })}
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Guardian Information</h4>
                        <div className="form-group mb-4">
                            <label>Guardian Name</label>
                            <input type="text" value={formData.guardian_name} onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })} required />
                        </div>
                        
                        <div className="form-group mb-4">
                            <label>Phone Number</label>
                            <div className="flex gap-2">
                                <CountryCodeSelect
                                    value={formData.country_code}
                                    onChange={(val) => setFormData({ ...formData, country_code: val })}
                                />
                                <input
                                    type="tel"
                                    className="flex-grow"
                                    value={formData.guardian_phone}
                                    onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                                    required
                                    placeholder="712345678"
                                />
                            </div>
                        </div>

                        <div className="form-group col-span-2">
                            <label>Email Address</label>
                            <input type="email" value={formData.guardian_email} onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })} placeholder="Optional for notifications" />
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Students;

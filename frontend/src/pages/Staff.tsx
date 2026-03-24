import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Briefcase, Printer, Download, LayoutGrid, RefreshCcw, Check, X, UserCheck } from 'lucide-react';
import { staffAPI, authAPI } from '../api/api';
import { exportToCSV } from '../utils/export';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';
import PremiumDateInput from '../components/common/DatePicker';
import { useSelector } from 'react-redux';
import { StaffTableSkeleton } from './staff/StaffSkeletons';

const Staff = () => {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [groupBy, setGroupBy] = useState<'NONE' | 'ROLE' | 'DEPARTMENT' | 'PENDING'>('NONE');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();
    const { confirm } = useConfirm();
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [departments, setDepartments] = useState<any[]>([]);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [pendingStaff, setPendingStaff] = useState<any[]>([]);
    const [isProcessingApproval, setIsProcessingApproval] = useState<number | null>(null);
    const pageSize = 50;

    const { user } = useSelector((state: any) => state.auth);
    const isAdminOrRegistrar = user?.role === 'ADMIN' || user?.role === 'REGISTRAR';

    const ROLE_DEPT_MAP: Record<string, string> = {
        'TEACHER': 'Academics',
        'PRINCIPAL': 'Administration',
        'DEPUTY': 'Administration',
        'DOS': 'Academics',
        'REGISTRAR': 'Administration',
        'WARDEN': 'Hostels',
        'NURSE': 'Medical',
        'ACCOUNTANT': 'Finance',
        'LIBRARIAN': 'Library',
        'DRIVER': 'Transport',
        'ADMIN': 'Administration',
    };

    const [formData, setFormData] = useState({
        employee_id: '',
        full_name: '',
        email: '',
        department: '',
        role: 'TEACHER',
        qualifications: '',
        date_joined: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        loadData();
        loadDepartments();
        if (isAdminOrRegistrar) loadPendingStaff();
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
            const res = await staffAPI.getAll({
                page,
                page_size: pageSize,
                search: searchTerm
            });
            setStaff(res.data?.results ?? res.data ?? []);
            setTotalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
        } catch (error) {
            console.error('Error loading staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDepartments = async () => {
        try {
            const res = await staffAPI.departments.getAll();
            setDepartments(res.data?.results ?? res.data ?? []);
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    };

    const loadPendingStaff = async () => {
        try {
            const res = await authAPI.staffApproval.getPending();
            setPendingStaff(res.data || []);
        } catch (error) {
            console.error('Error loading pending staff:', error);
        }
    };

    const handleApprove = async (userId: number) => {
        setIsProcessingApproval(userId);
        try {
            await authAPI.staffApproval.approve(userId);
            toast.success('Staff member approved successfully');
            loadPendingStaff();
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to approve staff');
        } finally {
            setIsProcessingApproval(null);
        }
    };

    const handleReject = async (userId: number) => {
        if (!await confirm('Are you sure you want to reject and delete this registration?')) return;
        setIsProcessingApproval(userId);
        try {
            await authAPI.staffApproval.reject(userId);
            toast.success('Registration rejected and removed');
            loadPendingStaff();
        } catch (error: any) {
            toast.error(error.message || 'Failed to reject registration');
        } finally {
            setIsProcessingApproval(null);
        }
    };

    const handleResendVerification = async (userId: number) => {
        setIsProcessingApproval(userId);
        try {
            await authAPI.staffApproval.resendVerification(userId);
            toast.success('Verification email resent successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend verification email');
        } finally {
            setIsProcessingApproval(null);
        }
    };

    const handleCreateDept = async () => {
        if (!newDeptName.trim()) return;
        setIsSubmitting(true);
        try {
            await staffAPI.departments.create({ name: newDeptName });
            toast.success('Department created successfully');
            setNewDeptName('');
            setShowDeptModal(false);
            loadDepartments();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create department');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const submissionData = {
            ...formData,
            write_full_name: formData.full_name,
            write_role: formData.role
        };
        try {
            if (editingStaff) {
                await staffAPI.update(editingStaff.id, submissionData);
                toast.success('Staff member updated successfully');
            } else {
                await staffAPI.create(submissionData);
                toast.success('Staff member registered successfully');
            }
            loadData();
            closeModal();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to save staff member');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!await confirm('Are you sure you want to remove this staff member?')) return;
        try {
            await staffAPI.delete(id);
            toast.success('Staff member removed successfully.');
            loadData();
        } catch (error: any) {
            console.error('Delete failed:', error);
            toast.error(error.response?.data?.detail || 'Failed to delete staff member. They may be assigned as Class Teacher or Warden.');
        }
    };

    const handleSyncStaff = async () => {
        setIsSubmitting(true);
        try {
            const res = await staffAPI.sync();
            toast.success(res.data?.detail || 'Staff profiles synchronized successfully');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to sync staff profiles');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadCSV = () => {
        exportToCSV(staffList, 'Staff_Directory');
    };

    const openModal = (member?: any) => {
        if (member) {
            setEditingStaff(member);
            setFormData({
                employee_id: member.employee_id,
                full_name: member.full_name || '',
                email: member.email || '',
                department: member.department || '',
                role: member.role || 'TEACHER',
                qualifications: member.qualifications,
                date_joined: member.date_joined || new Date().toISOString().split('T')[0],
            });
        } else {
            setEditingStaff(null);
            setFormData({
                employee_id: '',
                full_name: '',
                email: '',
                department: '',
                role: 'TEACHER',
                qualifications: '',
                date_joined: new Date().toISOString().split('T')[0],
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStaff(null);
    };

    const handleRoleChange = (role: string) => {
        const deptName = ROLE_DEPT_MAP[role];
        let deptId = '';
        if (deptName) {
            const dept = departments.find(d => d.name.toLowerCase() === deptName.toLowerCase());
            if (dept) deptId = dept.id.toString();
        }
        setFormData({ ...formData, role, department: deptId });
    };

    const staffList = staff; 


    const renderStaffTable = (staffList: any[]) => (
        <div className="table-wrapper">
            <table className="table">
                <thead>
                    <tr>
                        <th>Staff Member</th>
                        <th>Department</th>
                        <th>Role</th>
                        <th>Date Joined</th>
                        <th className="no-print">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {staffList.map((member) => (
                        <tr key={member.id}>
                            <td className="cursor-pointer hover:bg-slate-50/50" onClick={() => openModal(member)}>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-primary">{member.full_name || member.username}</span>
                                    <span className="text-[10px] font-bold text-secondary uppercase tracking-tight">ID: {member.employee_id}</span>
                                </div>
                            </td>
                            <td>{member.department_name || 'General'}</td>
                            <td><span className={`badge ${member.role === 'ADMIN' ? 'badge-error' : member.role === 'TEACHER' ? 'badge-primary' : 'badge-info'}`}>{member.role}</span></td>
                            <td>{new Date(member.date_joined).toLocaleDateString()}</td>
                            <td className="no-print">
                                <div className="flex gap-sm">
                                    <Button variant="outline" size="sm" onClick={() => openModal(member)} title="Edit" icon={<Edit size={14} />} />
                                    <Button variant="danger" size="sm" onClick={() => handleDelete(member.id)} title="Delete" icon={<Trash2 size={14} />} />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const groupedStaff = React.useMemo(() => {
        return staffList.reduce((groups: any, member: any) => {
            let key = 'ALL';
            if (groupBy === 'ROLE') {
                key = member.role || 'Unassigned';
            } else if (groupBy === 'DEPARTMENT') {
                key = member.department_name || 'General Administration';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(member);
            return groups;
        }, {});
    }, [staffList, groupBy]);

    return (
        <div className="fade-in px-4 pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 no-print">
                <div className="w-full lg:w-auto">
                    <h1 className="text-3xl font-black tracking-tight uppercase">Staff Directory</h1>
                    <p className="text-secondary text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Faculty & Support Staff Management</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto mt-2 lg:mt-0">
                    {isAdminOrRegistrar && (
                        <>
                            <Button variant="ghost" className="text-[10px] font-black uppercase" onClick={handleDownloadCSV} icon={<Download size={16} />}>Export</Button>
                            <Button variant="ghost" className="text-[10px] font-black uppercase" onClick={handlePrint} icon={<Printer size={16} />}>Print</Button>
                            <Button variant="outline" className="text-[10px] font-black uppercase" onClick={handleSyncStaff} loading={isSubmitting} icon={<RefreshCcw size={16} />}>Sync Profiles</Button>
                            <Button variant="outline" className="text-primary border-primary/20 text-[10px] font-black uppercase" onClick={() => setShowDeptModal(true)} icon={<Plus size={16} />}>Add Dept</Button>
                            <Button variant="primary" className="text-[10px] font-black uppercase shadow-lg shadow-primary/25" onClick={() => openModal()} icon={<Plus size={16} />}>Add StaffMember</Button>
                        </>
                    )}
                </div>
            </div>

            {/* Premium Search & Tabs Bar */}
            <div className="card mb-8 no-print p-4 bg-white border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
                    <div className="search-container flex-grow max-w-2xl w-full">
                        <Search className="search-icon text-primary" size={20} />
                        <input
                            type="text"
                            className="input search-input pl-12 py-6 text-base font-medium bg-white/80 border-none shadow-inner ring-0 focus:ring-2 focus:ring-primary/20 transition-all"
                            placeholder="Search by name, employee ID, role, or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="nav-tab-container bg-slate-100/50 p-1.5 rounded-2xl flex-shrink-0">
                        {(['NONE', 'DEPARTMENT', 'ROLE'] as const).map((mode) => (
                            <button
                                key={mode}
                                className={`nav-tab px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${groupBy === mode ? 'active bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                                onClick={() => setGroupBy(mode)}
                            >
                                {mode === 'NONE' ? 'Overview' : mode === 'DEPARTMENT' ? 'Depts' : 'Roles'}
                            </button>
                        ))}
                        {isAdminOrRegistrar && (
                            <button
                                className={`nav-tab px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${groupBy === 'PENDING' ? 'active bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                                onClick={() => setGroupBy('PENDING')}
                            >
                                <span className="flex items-center gap-2">
                                    Pending 
                                    {pendingStaff.length > 0 && <span className="bg-danger text-white text-[9px] px-1.5 py-0.5 rounded-full">{pendingStaff.length}</span>}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {loading ? <StaffTableSkeleton /> : (
                <div className="space-y-6">
                    {groupBy === 'NONE' ? (
                        <div className="table-container shadow-md">
                            {renderStaffTable(staffList)}
                            {staffList.length === 0 && <div className="text-center py-12 text-secondary">No matching staff records found</div>}
                        </div>
                    ) : groupBy === 'PENDING' ? (
                        <div className="table-container shadow-md border-left-4 border-warning">
                            <div className="card-header border-bottom py-4 px-6 flex justify-between items-center">
                                <h3 className="mb-0 text-warning flex items-center gap-sm font-black uppercase tracking-wider text-sm">
                                    <UserCheck size={18} />
                                    Pending Staff Registrations
                                </h3>
                                <div className="badge badge-warning font-black uppercase tracking-widest text-[10px]">{pendingStaff.length} Awaiting Approval</div>
                            </div>
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>User Info</th>
                                            <th>Requested Role</th>
                                            <th>Verification</th>
                                            <th className="no-print">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingStaff.length > 0 ? pendingStaff.map((u) => (
                                            <tr key={u.id}>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-primary">{u.username}</span>
                                                        <span className="text-[10px] text-secondary">{u.email}</span>
                                                    </div>
                                                </td>
                                                <td><span className="badge badge-info">{u.role}</span></td>
                                                <td>
                                                    {u.is_email_verified ? (
                                                        <span className="text-[10px] font-bold text-success flex items-center gap-1"><Check size={12}/> Email Verified</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-danger flex items-center gap-1"><X size={12}/> Unverified</span>
                                                    )}
                                                </td>
                                                <td className="no-print">
                                                    <div className="flex gap-2">
                                                        {u.is_email_verified ? (
                                                            <Button 
                                                                variant="primary" 
                                                                size="sm" 
                                                                loading={isProcessingApproval === u.id}
                                                                onClick={() => handleApprove(u.id)}
                                                                icon={<Check size={14} />}
                                                                title="Approve"
                                                            />
                                                        ) : (
                                                            <Button 
                                                                variant="primary" 
                                                                size="sm" 
                                                                loading={isProcessingApproval === u.id}
                                                                onClick={() => handleResendVerification(u.id)}
                                                                title="Resend Email"
                                                                className="whitespace-nowrap font-bold text-[10px]"
                                                            >
                                                                Resend
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="danger" 
                                                            size="sm" 
                                                            loading={isProcessingApproval === u.id}
                                                            onClick={() => handleReject(u.id)}
                                                            icon={<X size={14} />}
                                                            title="Reject"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="text-center py-12 text-secondary">No pending registrations found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {Object.keys(groupedStaff).sort().map(groupKey => (
                                <div key={groupKey} className="table-container overflow-visible border-left-4 border-primary shadow-md">
                                    <div className="card-header border-bottom py-4 px-6 flex justify-between items-center">
                                        <h3 className="mb-0 text-primary flex items-center gap-sm font-black uppercase tracking-wider text-sm">
                                            {groupBy === 'DEPARTMENT' ? <LayoutGrid size={18} /> : <Briefcase size={18} />}
                                            {groupKey}
                                        </h3>
                                        <div className="flex items-center gap-4">
                                            {groupBy === 'DEPARTMENT' && isAdminOrRegistrar && groupKey !== 'General Administration' && (
                                                <div className="flex gap-2 mr-4">
                                                    <Button variant="outline" size="sm" onClick={() => {
                                                        const dept = departments.find(d => d.name === groupKey);
                                                        if (dept) {
                                                            setNewDeptName(dept.name);
                                                            setShowDeptModal(true);
                                                        }
                                                    }} icon={<Edit size={12} />} />
                                                    <Button variant="danger" size="sm" onClick={async () => {
                                                        const dept = departments.find(d => d.name === groupKey);
                                                        if (dept && await confirm(`Delete ${dept.name} department?`)) {
                                                            try {
                                                                await staffAPI.departments.delete(dept.id);
                                                                toast.success('Department deleted');
                                                                loadDepartments();
                                                            } catch (e) {
                                                                toast.error('Failed to delete department (might have staff assigned)');
                                                            }
                                                        }
                                                    }} icon={<Trash2 size={12} />} />
                                                </div>
                                            )}
                                            <div className="badge badge-primary font-black uppercase tracking-widest text-[10px]">{groupedStaff[groupKey].length} Staff</div>
                                        </div>
                                    </div>
                                    {renderStaffTable(groupedStaff[groupKey])}
                                </div>
                            ))}
                            {Object.keys(groupedStaff).length === 0 && <div className="card text-center py-12 text-secondary">No records found for current criteria</div>}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalItems > pageSize && groupBy !== 'PENDING' && (
                        <div className="flex justify-between items-center mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100 no-print">
                            <div className="text-[10px] font-black text-secondary uppercase tracking-widest">
                                Showing {Math.min((page - 1) * pageSize + 1, totalItems)} - {Math.min(page * pageSize, totalItems)} of {totalItems} Staff Members
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="font-black text-[10px] uppercase">Previous</Button>
                                <Button variant="primary" size="sm" disabled={page * pageSize >= totalItems} onClick={() => setPage(page + 1)} className="font-black text-[10px] uppercase">Next Page</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingStaff ? 'Edit Staff Member' : 'Register New Staff Member'} size="md">
                <form onSubmit={handleSubmit} className="form-container-md mx-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="form-group">
                            <label className="label">Employee ID *</label>
                            <input type="text" className="input" value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="label">Full Name *</label>
                            <input type="text" className="input" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="label">Email Address *</label>
                            <input type="email" className="input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="label flex justify-between">
                                <span>Department *</span>
                                <button type="button" onClick={() => setShowDeptModal(true)} className="text-[10px] font-bold text-primary hover:underline">+ New Dept</button>
                            </label>
                            <SearchableSelect
                                placeholder="Select Department"
                                options={departments.map(d => ({ id: d.id.toString(), label: d.name }))}
                                value={formData.department}
                                onChange={(val) => setFormData({ ...formData, department: val.toString() })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Role *</label>
                            <SearchableSelect
                                options={[
                                    { id: 'TEACHER', label: 'Teacher' },
                                    { id: 'PRINCIPAL', label: 'Principal' },
                                    { id: 'DEPUTY', label: 'Deputy Principal' },
                                    { id: 'DOS', label: 'Director of Studies' },
                                    { id: 'REGISTRAR', label: 'Admissions Registrar' },
                                    { id: 'WARDEN', label: 'Hostel Warden' },
                                    { id: 'NURSE', label: 'Nurse' },
                                    { id: 'ACCOUNTANT', label: 'Bursar' },
                                    { id: 'LIBRARIAN', label: 'Librarian' },
                                    { id: 'DRIVER', label: 'Driver' },
                                    { id: 'ADMIN', label: 'System Admin' },
                                    { id: 'SUPPORT', label: 'Support Staff' }
                                ]}
                                value={formData.role}
                                onChange={(val) => handleRoleChange(val.toString())}
                                required
                            />
                        </div>
                        <div className="form-group pb-2">
                            <PremiumDateInput
                                label="Date Joined"
                                value={formData.date_joined}
                                onChange={(val) => setFormData({ ...formData, date_joined: val })}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="label">Qualifications</label>
                        <textarea className="textarea" placeholder="List degrees, certifications, etc." value={formData.qualifications} onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })} rows={3} />
                    </div>
                    <div className="modal-footer pt-6 border-top mt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                        <Button type="submit" variant="primary" className="px-8 font-black shadow-lg" loading={isSubmitting} loadingText={editingStaff ? 'UPDATING...' : 'REGISTERING...'}>
                            {editingStaff ? 'SAVE CHANGES' : 'REGISTER STAFF'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Quick Add Department Modal */}
            <Modal isOpen={showDeptModal} onClose={() => setShowDeptModal(false)} title="Add New Department" size="sm">
                <div className="p-4 space-y-4">
                    <div className="form-group">
                        <label className="label">Department Name</label>
                        <input 
                            type="text" 
                            className="input" 
                            placeholder="Enter name..." 
                            value={newDeptName} 
                            onChange={(e) => setNewDeptName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCreateDept();
                                }
                            }}
                        />
                    </div>
                    <div className="flex justify-end gap-2 text-sm pt-2">
                        <Button variant="outline" size="sm" onClick={() => setShowDeptModal(false)}>Cancel</Button>
                        <Button 
                            variant="primary" 
                            size="sm" 
                            disabled={!newDeptName.trim()} 
                            loading={isSubmitting}
                            onClick={handleCreateDept}
                        >
                            Save Dept
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Staff;

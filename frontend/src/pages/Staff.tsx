import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Briefcase, Printer, Download, LayoutGrid, RefreshCcw } from 'lucide-react';
import { staffAPI } from '../api/api';
import { exportToCSV } from '../utils/export';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';
import PremiumDateInput from '../components/common/DatePicker';

const Staff = () => {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [groupBy, setGroupBy] = useState<'NONE' | 'ROLE' | 'DEPARTMENT'>('NONE');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();
    const { confirm } = useConfirm();
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 50;

    const [formData, setFormData] = useState({
        employee_id: '',
        full_name: '',
        department: '',
        role: 'TEACHER',
        qualifications: '',
        date_joined: new Date().toISOString().split('T')[0],
    });

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
        exportToCSV(filteredStaff, 'Staff_Directory');
    };

    const openModal = (member?: any) => {
        if (member) {
            setEditingStaff(member);
            setFormData({
                employee_id: member.employee_id,
                full_name: member.full_name || '',
                department: member.department,
                role: member.role || 'TEACHER',
                qualifications: member.qualifications,
                date_joined: member.date_joined || new Date().toISOString().split('T')[0],
            });
        } else {
            setEditingStaff(null);
            setFormData({
                employee_id: '',
                full_name: '',
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

    const filteredStaff = staff; // Client-side search moved to server

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
                            <td>{member.department || 'General'}</td>
                            <td><span className="badge badge-info">{member.role}</span></td>
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
        return filteredStaff.reduce((groups: any, member) => {
            let key = 'ALL';
            if (groupBy === 'ROLE') {
                key = member.role || 'Unassigned';
            } else if (groupBy === 'DEPARTMENT') {
                key = member.department || 'General Administration';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(member);
            return groups;
        }, {});
    }, [filteredStaff, groupBy]);

    if (loading) {
        return <div className="flex items-center justify-center p-12 spinner-container"><div className="spinner"></div></div>;
    }

    return (
        <div className="fade-in">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 no-print">
                <div className="w-full lg:w-auto">
                    <h1 className="text-3xl font-black tracking-tight">Staff Management</h1>
                    <p className="text-secondary text-sm font-medium">Official faculty and support staff directory</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-start lg:justify-end">
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleDownloadCSV} icon={<Download size={18} />}>
                        Export
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={handlePrint} icon={<Printer size={18} />}>
                        Print
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleSyncStaff} loading={isSubmitting} icon={<RefreshCcw size={18} />}>
                        Sync Profiles
                    </Button>
                    <Button variant="primary" className="flex-1 sm:flex-none" onClick={() => openModal()} icon={<Plus size={18} />}>
                        Add Staff
                    </Button>
                </div>
            </div>

            {/* Premium Search & Tabs Bar */}
            <div className="card mb-8 no-print p-4 bg-white/50 backdrop-blur-md border-slate-200/60 shadow-xl">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
                    <div className="search-container flex-grow max-w-2xl w-full">
                        <Search className="search-icon text-primary" size={20} />
                        <input
                            type="text"
                            className="input search-input pl-12 py-6 text-base font-medium bg-white/80 border-none shadow-inner"
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
                    </div>
                </div>
            </div>


            {groupBy === 'NONE' ? (
                <div className="table-container shadow-md">
                    {renderStaffTable(filteredStaff)}
                    {filteredStaff.length === 0 && <div className="text-center py-12 text-secondary">No matching staff records found</div>}
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
                                <div className="badge badge-primary font-black uppercase tracking-widest text-[10px]">{groupedStaff[groupKey].length} Staff</div>
                            </div>
                            {renderStaffTable(groupedStaff[groupKey])}
                        </div>
                    ))}
                    {Object.keys(groupedStaff).length === 0 && <div className="card text-center py-12 text-secondary">No records found for current criteria</div>}
                </div>
            )}

            {/* Pagination */}
            {totalItems > pageSize && (
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
                            <label className="label">Department *</label>
                            <input type="text" className="input" placeholder="e.g. Science, Administration" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required />
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
                                onChange={(val) => setFormData({ ...formData, role: val.toString() })}
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

        </div>
    );
};

export default Staff;

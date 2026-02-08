import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Briefcase, Printer, Download, List, LayoutGrid } from 'lucide-react';
import { staffAPI } from '../api/api';
import { exportToCSV } from '../utils/export';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';

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
    }, []);

    const loadData = async () => {
        try {
            const res = await staffAPI.getAll();
            setStaff(res.data);
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
                date_joined: member.date_joined,
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

    const filteredStaff = staff.filter(s =>
        (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderStaffTable = (staffList: any[]) => (
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
                        <td>
                            <div className="flex flex-col">
                                <span className="font-semibold">{member.full_name || member.username}</span>
                                <span className="text-sm text-secondary">ID: {member.employee_id}</span>
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
    );

    const groupedStaff = filteredStaff.reduce((groups: any, member) => {
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

    if (loading) {
        return <div className="flex items-center justify-center p-12 spinner-container"><div className="spinner"></div></div>;
    }

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-6 no-print">
                <div>
                    <h1>Staff Management</h1>
                    <p className="text-secondary">Official faculty and support staff directory</p>
                </div>
                <div className="flex gap-md">
                    <Button variant="outline" onClick={handleDownloadCSV} icon={<Download size={18} />}>
                        Save CSV
                    </Button>
                    <Button variant="outline" onClick={handlePrint} icon={<Printer size={18} />}>
                        Print Record
                    </Button>
                    <Button variant="primary" onClick={() => openModal()} icon={<Plus size={18} />}>
                        Add Staff Member
                    </Button>
                </div>
            </div>

            <div className="card mb-6 no-print">
                <div className="flex gap-lg items-center">
                    <div className="search-container flex-grow">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            className="input search-input"
                            placeholder="Search by name, ID, role, or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-sm">
                        <span className="text-sm font-semibold text-secondary">View By:</span>
                        <div className="flex bg-secondary-light p-1 rounded-lg">
                            <button
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${groupBy === 'NONE' ? 'bg-primary text-white shadow-sm' : 'text-secondary opacity-70 hover:opacity-100'}`}
                                onClick={() => setGroupBy('NONE')}
                            >
                                <List size={14} className="inline mr-1" /> General
                            </button>
                            <button
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${groupBy === 'DEPARTMENT' ? 'bg-primary text-white shadow-sm' : 'text-secondary opacity-70 hover:opacity-100'}`}
                                onClick={() => setGroupBy('DEPARTMENT')}
                            >
                                <LayoutGrid size={14} className="inline mr-1" /> Department
                            </button>
                            <button
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${groupBy === 'ROLE' ? 'bg-primary text-white shadow-sm' : 'text-secondary opacity-70 hover:opacity-100'}`}
                                onClick={() => setGroupBy('ROLE')}
                            >
                                <Briefcase size={14} className="inline mr-1" /> Role
                            </button>
                        </div>
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
                            <div className="card-header bg-secondary-light py-3 px-6 flex justify-between items-center">
                                <h3 className="mb-0 text-primary flex items-center gap-sm">
                                    {groupBy === 'DEPARTMENT' ? <LayoutGrid size={18} /> : <Briefcase size={18} />}
                                    {groupKey}
                                </h3>
                                <span className="badge badge-primary">{groupedStaff[groupKey].length} Staff</span>
                            </div>
                            {renderStaffTable(groupedStaff[groupKey])}
                        </div>
                    ))}
                    {Object.keys(groupedStaff).length === 0 && <div className="card text-center py-12 text-secondary">No records found for current criteria</div>}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingStaff ? 'Edit Staff Member' : 'Register New Staff Member'}>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-md">
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
                            <select className="select" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required>
                                <option value="TEACHER">Teacher</option>
                                <option value="WARDEN">Hostel Warden</option>
                                <option value="NURSE">Nurse</option>
                                <option value="ACCOUNTANT">Accountant</option>
                                <option value="ADMIN">Admin/Principal</option>
                                <option value="SUPPORT">Support Staff</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Date Joined *</label>
                            <input type="date" className="input" value={formData.date_joined} onChange={(e) => setFormData({ ...formData, date_joined: e.target.value })} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="label">Qualifications</label>
                        <textarea className="textarea" value={formData.qualifications} onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })} rows={3} />
                    </div>
                    <div className="modal-footer pt-4 border-top mt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={isSubmitting} loadingText={editingStaff ? 'Updating...' : 'Registering...'}>
                            {editingStaff ? 'Update Record' : 'Register Staff'}
                        </Button>
                    </div>
                </form>
            </Modal>

        </div>
    );
};

export default Staff;

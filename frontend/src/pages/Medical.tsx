import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, User as UserIcon, Activity, Printer, Download } from 'lucide-react';
import { medicalAPI, studentsAPI } from '../api/api';
import { exportToCSV } from '../utils/export';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';

const Medical = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [formData, setFormData] = useState({
        student: '',
        diagnosis: '',
        treatment_given: '',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();
    const { confirm } = useConfirm();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [recordsRes, studentsRes] = await Promise.all([
                medicalAPI.getAll(),
                studentsAPI.getAll(),
            ]);
            setRecords(recordsRes.data?.results ?? recordsRes.data ?? []);
            setStudents(studentsRes.data?.results ?? studentsRes.data ?? []);
        } catch (error) {
            console.error('Error loading medical records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingRecord) {
                await medicalAPI.update(editingRecord.id, formData);
                toast.success('Medical record updated successfully');
            } else {
                await medicalAPI.create(formData);
                toast.success('Medical record created successfully');
            }
            loadData();
            closeModal();
        } catch (error: any) {
            console.error('Error saving medical record:', error);
            toast.error(error.response?.data?.detail || 'Failed to save medical record');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (await confirm('Are you sure you want to delete this medical record?')) {
            try {
                await medicalAPI.delete(id);
                toast.success('Medical record deleted successfully');
                loadData();
            } catch (error) {
                console.error('Error deleting medical record:', error);
                toast.error('Failed to delete medical record');
            }
        }
    };

    const openModal = (record?: any) => {
        if (record) {
            setEditingRecord(record);
            setFormData({
                student: record.student,
                diagnosis: record.diagnosis,
                treatment_given: record.treatment_given,
                notes: record.notes || '',
            });
        } else {
            setEditingRecord(null);
            setFormData({ student: '', diagnosis: '', treatment_given: '', notes: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRecord(null);
    };

    const filteredRecords = React.useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return records.filter(r =>
            (r.student_name || '').toLowerCase().includes(lowerSearch) ||
            (r.diagnosis || '').toLowerCase().includes(lowerSearch)
        );
    }, [records, searchTerm]);

    const studentOptions = React.useMemo(() => students.map(s => ({
        id: s.id,
        label: s.full_name,
        subLabel: `ID: ${s.admission_number}`
    })), [students]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner"></div></div>;
    }

    return (
        <div className="fade-in">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="w-full lg:w-auto">
                    <h1 className="text-3xl font-black tracking-tight">Medical Records</h1>
                    <p className="text-secondary text-sm font-medium">Official school health and infirmary logs</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-start lg:justify-end no-print">
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => window.print()} icon={<Printer size={18} />}>
                        Reports
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => exportToCSV(records, 'Medical_Records')} icon={<Download size={18} />}>
                        Export
                    </Button>
                    <Button variant="primary" className="flex-1 sm:flex-none" onClick={() => openModal()} icon={<Plus size={18} />}>
                        New Record
                    </Button>
                </div>
            </div>

            <div className="card mb-4">
                <div className="search-container">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        className="input search-input"
                        placeholder="Search by student name or diagnosis..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Visit Date</th>
                            <th>Student</th>
                            <th>Diagnosis</th>
                            <th>Treatment</th>
                            <th>Medical Personnel</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.length === 0 ? (
                            <tr><td colSpan={6} className="text-center text-secondary">No health records found</td></tr>
                        ) : (
                            filteredRecords.map((record) => (
                                <tr key={record.id}>
                                    <td>
                                        <div className="flex items-center gap-sm">
                                            <Calendar size={14} className="text-secondary" />
                                            {new Date(record.date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-md">
                                            <div className="p-2 bg-secondary rounded-full">
                                                <UserIcon size={16} className="text-secondary" />
                                            </div>
                                            <span className="font-semibold">{record.student_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-error bg-error-light">
                                            {record.diagnosis}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-sm text-sm">
                                            <Activity size={14} className="text-secondary" />
                                            {record.treatment_given}
                                        </div>
                                    </td>
                                    <td className="text-sm">{record.nurse_name || 'System'}</td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <Button variant="ghost" size="sm" onClick={() => openModal(record)} icon={<Edit size={14} />} title="Edit" />
                                            <Button variant="danger" size="sm" onClick={() => handleDelete(record.id)} icon={<Trash2 size={14} />} title="Delete" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingRecord ? 'Edit Health Entry' : 'Log Infirmary Visit'}>
                <form onSubmit={handleSubmit}>
                    <SearchableSelect
                        label="Student *"
                        options={studentOptions}
                        value={formData.student}
                        onChange={(val) => setFormData({ ...formData, student: val.toString() })}
                        placeholder="Select student by name or ID..."
                        required
                    />

                    <div className="form-group">
                        <label className="label">Diagnosis / Reason for Visit *</label>
                        <input type="text" className="input" placeholder="e.g. Headache, Malaria, Routine Checkup" value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label className="label">Treatment Given *</label>
                        <textarea className="textarea" placeholder="Describe clinical actions taken..." value={formData.treatment_given} onChange={(e) => setFormData({ ...formData, treatment_given: e.target.value })} required rows={3} />
                    </div>

                    <div className="form-group">
                        <label className="label">Clinical Notes</label>
                        <textarea className="textarea" placeholder="Any additional observations or follow-ups needed..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
                    </div>

                    <div className="modal-footer">
                        <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={isSubmitting} loadingText={editingRecord ? 'Updating...' : 'Saving...'}>
                            {editingRecord ? 'Update Log' : 'Save Record'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Medical;

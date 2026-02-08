import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Heart, Calendar, User as UserIcon, Activity } from 'lucide-react';
import { medicalAPI, studentsAPI } from '../api/api';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';

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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [recordsRes, studentsRes] = await Promise.all([
                medicalAPI.getAll(),
                studentsAPI.getAll(),
            ]);
            setRecords(recordsRes.data);
            setStudents(studentsRes.data);
        } catch (error) {
            console.error('Error loading medical records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRecord) {
                await medicalAPI.update(editingRecord.id, formData);
            } else {
                await medicalAPI.create(formData);
            }
            loadData();
            closeModal();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to save medical record');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this medical record?')) return;
        try {
            await medicalAPI.delete(id);
            loadData();
        } catch (error) {
            alert('Failed to delete medical record');
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

    const filteredRecords = records.filter(r =>
        (r.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const studentOptions = students.map(s => ({
        id: s.id,
        label: s.full_name,
        subLabel: `ID: ${s.admission_number}`
    }));

    if (loading) {
        return <div className="flex items-center justify-center" style={{ height: '400px' }}><div className="spinner"></div></div>;
    }

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1>Medical Records</h1>
                    <p className="text-secondary">Official school health and infirmary logs</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    New Health Record
                </button>
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

            <div className="table-container">
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
                                            <div style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: '50%' }}>
                                                <UserIcon size={16} className="text-secondary" />
                                            </div>
                                            <span className="font-semibold">{record.student_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-error" style={{ background: 'rgba(231, 76, 60, 0.1)', color: 'var(--error)' }}>
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
                                            <button className="btn btn-sm btn-outline" onClick={() => openModal(record)} title="Edit">
                                                <Edit size={14} />
                                            </button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(record.id)} title="Delete">
                                                <Trash2 size={14} />
                                            </button>
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
                        <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingRecord ? 'Update Log' : 'Save Record'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Medical;

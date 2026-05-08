import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, User as UserIcon, Activity, Printer, Download } from 'lucide-react';
import { medicalAPI, studentsAPI } from '../api/api';
import { exportToCSV } from '../utils/export';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';
import { MedicalTableSkeleton } from './medical/MedicalSkeletons';

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
        status: 'COMPLETED',
        height: '',
        weight: '',
        temperature: '',
        blood_pressure: '',
        pulse: '',
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
                studentsAPI.getAll({ page_size: 1000 }),
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
            const payload = {
                ...formData,
                height: formData.height ? parseFloat(formData.height) : null,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                temperature: formData.temperature ? parseFloat(formData.temperature) : null,
            };
            if (editingRecord) {
                await medicalAPI.update(editingRecord.id, payload);
                toast.success('Medical record updated successfully');
            } else {
                await medicalAPI.create(payload);
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
                student: record.student?.id?.toString() || record.student?.toString() || '',
                diagnosis: record.diagnosis || '',
                treatment_given: record.treatment_given || '',
                notes: record.notes || '',
                status: record.status || 'COMPLETED',
                height: record.height?.toString() || '',
                weight: record.weight?.toString() || '',
                temperature: record.temperature?.toString() || '',
                blood_pressure: record.blood_pressure || '',
                pulse: record.pulse?.toString() || '',
            });
        } else {
            setEditingRecord(null);
            setFormData({
                student: '',
                diagnosis: '',
                treatment_given: '',
                notes: '',
                status: 'COMPLETED',
                height: '',
                weight: '',
                temperature: '',
                blood_pressure: '',
                pulse: '',
            });
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

    return (
        <div className="fade-in px-4 pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="w-full lg:w-auto">
                    <h1 className="text-3xl font-black tracking-tight uppercase">Medical Center</h1>
                    <p className="text-secondary text-[10px] font-black uppercase tracking-[0.2em] opacity-60">School health and infirmary records</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto mt-2 lg:mt-0 no-print">
                    <Button variant="ghost" className="text-[10px] font-black uppercase" onClick={() => window.print()} icon={<Printer size={16} />}>Reports</Button>
                    <Button variant="ghost" className="text-[10px] font-black uppercase" onClick={() => exportToCSV(records, 'Medical_Records')} icon={<Download size={16} />}>Export</Button>
                    <Button variant="primary" className="text-[10px] font-black uppercase shadow-lg shadow-primary/25" onClick={() => openModal()} icon={<Plus size={16} />}>New Record</Button>
                </div>
            </div>

            <div className="card mb-8 no-print p-4 bg-white border-slate-200 shadow-sm">
                <div className="search-container max-w-2xl">
                    <Search className="search-icon text-primary" size={20} />
                    <input
                        type="text"
                        className="input search-input pl-12 py-6 text-base font-medium bg-white/80 border-none shadow-inner ring-0 focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Search by student name or diagnosis..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? <MedicalTableSkeleton /> : (
                <div className="table-wrapper shadow-md">
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
                                <tr><td colSpan={6} className="text-center text-secondary py-12">No health records found</td></tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id}>
                                        <td>
                                            <div className="flex items-center gap-sm">
                                                <Calendar size={14} className="text-secondary opacity-60" />
                                                <span className="font-medium">{new Date(record.date_visited).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-md">
                                                <div className="p-2 bg-slate-100 rounded-lg">
                                                    <UserIcon size={16} className="text-primary" />
                                                </div>
                                                <span className="font-semibold text-primary">{record.student_name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-error bg-red-50 text-red-600 border-red-100 font-bold uppercase text-[9px]">
                                                {record.diagnosis}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-sm text-sm">
                                                <Activity size={14} className="text-secondary opacity-60" />
                                                <span className="text-xs font-medium">{record.treatment_given || record.reason}</span>
                                            </div>
                                        </td>
                                        <td className="text-[11px] font-bold text-secondary uppercase italic">{record.nurse_name || 'Clinic System'}</td>
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
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingRecord ? 'Edit Health Entry' : 'Log Infirmary Visit'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-6 form-container-md mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SearchableSelect
                            label="Student *"
                            options={studentOptions}
                            value={formData.student}
                            onChange={(val) => {
                                const selectedStudent = students.find((s: any) => s.id.toString() === val.toString());
                                const hr = selectedStudent?.health_record;
                                setFormData({ 
                                    ...formData, 
                                    student: val.toString(),
                                    height: hr?.height ? hr.height.toString() : formData.height,
                                    weight: hr?.weight ? hr.weight.toString() : formData.weight,
                                    temperature: hr?.temperature ? hr.temperature.toString() : formData.temperature,
                                    blood_pressure: hr?.blood_pressure ? hr.blood_pressure.toString() : formData.blood_pressure
                                });
                            }}
                            placeholder="Select student..."
                            required
                        />
                        <div className="form-group">
                            <label className="label text-[10px] font-black uppercase">Visit Status</label>
                            <SearchableSelect
                                options={[
                                    { id: 'COMPLETED', label: 'Completed' },
                                    { id: 'REFERRED', label: 'Referred' },
                                    { id: 'PENDING', label: 'Pending Follow-up' }
                                ]}
                                value={(formData as any).status || 'COMPLETED'}
                                onChange={(val) => setFormData({ ...formData, status: val.toString() } as any)}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <h4 className="text-[10px] font-black uppercase text-secondary mb-4 tracking-widest flex items-center gap-2">
                            <Activity size={14} className="text-info" /> Vital Signs (Optional)
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="form-group">
                                <label className="label text-[9px] font-black uppercase">Height (cm)</label>
                                <input type="number" step="0.1" className="input text-xs" value={(formData as any).height || ''} onChange={e => setFormData({ ...formData, height: e.target.value } as any)} />
                            </div>
                            <div className="form-group">
                                <label className="label text-[9px] font-black uppercase">Weight (kg)</label>
                                <input type="number" step="0.1" className="input text-xs" value={(formData as any).weight || ''} onChange={e => setFormData({ ...formData, weight: e.target.value } as any)} />
                            </div>
                            <div className="form-group">
                                <label className="label text-[9px] font-black uppercase">Temp (°C)</label>
                                <input type="number" step="0.1" className="input text-xs" value={(formData as any).temperature || ''} onChange={e => setFormData({ ...formData, temperature: e.target.value } as any)} />
                            </div>
                            <div className="form-group">
                                <label className="label text-[9px] font-black uppercase">BP (s/d)</label>
                                <input type="text" className="input text-xs" placeholder="120/80" value={(formData as any).blood_pressure || ''} onChange={e => setFormData({ ...formData, blood_pressure: e.target.value } as any)} />
                            </div>
                            <div className="form-group">
                                <label className="label text-[9px] font-black uppercase">Pulse (bpm)</label>
                                <input type="number" className="input text-xs" value={(formData as any).pulse_rate || ''} onChange={e => setFormData({ ...formData, pulse_rate: e.target.value } as any)} />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase text-primary">Diagnosis / Clinical Impression *</label>
                        <input type="text" className="input" placeholder="e.g. Acute Malaria, Severe Migraine" value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} required />
                    </div>

                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase text-primary">Treatment & Prescriptions *</label>
                        <textarea className="textarea" placeholder="List medications dispensed or actions taken..." value={formData.treatment_given} onChange={(e) => setFormData({ ...formData, treatment_given: e.target.value })} required rows={3} />
                    </div>

                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase text-secondary">Clinical Notes</label>
                        <textarea className="textarea" placeholder="Internal notes for medical staff..." value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
                    </div>

                    <div className="modal-footer pt-4">
                        <Button type="button" variant="outline" className="font-black uppercase" onClick={closeModal}>Discard</Button>
                        <Button type="submit" variant="primary" className="font-black uppercase shadow-lg px-8" loading={isSubmitting} loadingText="Saving Record...">
                            {editingRecord ? 'Update Registry' : 'Finalize Visit Log'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Medical;

import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Trash2, Edit, User, Printer, Download } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { timetableAPI, classesAPI, subjectsAPI, staffAPI } from '../api/api';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import Button from '../components/common/Button';
import { exportToCSV } from '../utils/export';
import { useSelector } from 'react-redux';
import Skeleton from '../components/common/Skeleton';

const Timetable = () => {
    const { user } = useSelector((state: any) => state.auth);
    const [slots, setSlots] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const toast = useToast();
    const { confirm } = useConfirm();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState<any>(null);
    const [slotForm, setSlotForm] = useState({
        class_assigned: '',
        day: 'MON',
        start_time: '08:00',
        end_time: '09:00',
        subject: '',
        teacher: ''
    });

    const canEdit = user?.role === 'ADMIN' || user?.permissions?.includes('change_timetable');
    const canDelete = user?.role === 'ADMIN' || user?.permissions?.includes('delete_timetable');
    const canAdd = user?.role === 'ADMIN' || user?.permissions?.includes('add_timetable');

    const days = [
        { id: 'MON', label: 'Monday' },
        { id: 'TUE', label: 'Tuesday' },
        { id: 'WED', label: 'Wednesday' },
        { id: 'THU', label: 'Thursday' },
        { id: 'FRI', label: 'Friday' },
        { id: 'SAT', label: 'Saturday' }
    ];

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            loadTimetable(selectedClass);
        } else {
            setSlots([]);
        }
    }, [selectedClass]);

    const loadInitialData = async () => {
        try {
            const [clsRes, subRes, stfRes] = await Promise.all([
                classesAPI.getAll(),
                subjectsAPI.getAll(),
                staffAPI.getAll()
            ]);
            const d = (r: any) => r?.data?.results ?? r?.data ?? [];
            const cls = d(clsRes);
            setClasses(cls);
            setSubjects(d(subRes));
            setStaff(d(stfRes));
            // Default to first class if available
            if (cls.length > 0) setSelectedClass(cls[0].id.toString());
        } catch (error) {
            console.error('Failed to load metadata', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTimetable = async (classId: string) => {
        setLoading(true);
        try {
            const res = await timetableAPI.getAll({ class_assigned: classId, page_size: 200 });
            const allSlots = res.data?.results ?? res.data ?? [];
            setSlots(allSlots);
        } catch (error) {
            console.error('Failed to load timetable slots:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...slotForm, class_assigned: selectedClass };
            if (editingSlot) {
                await timetableAPI.update(editingSlot.id, payload);
                toast.success('Timetable slot updated!');
            } else {
                await timetableAPI.create(payload);
                toast.success('Timetable slot added!');
            }
            setIsModalOpen(false);
            setEditingSlot(null);
            loadTimetable(selectedClass);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || error.message || 'Failed to save slot');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (await confirm('Are you sure you want to remove this schedule slot?')) {
            try {
                await timetableAPI.delete(id);
                toast.success('Slot removed successfully');
                loadTimetable(selectedClass);
            } catch (error) {
                toast.error('Failed to delete slot');
            }
        }
    };

    const openModal = (slot?: any) => {
        if (slot) {
            setEditingSlot(slot);
            setSlotForm({
                class_assigned: slot.class_assigned,
                day: slot.day,
                start_time: slot.start_time,
                end_time: slot.end_time,
                subject: slot.subject,
                teacher: slot.teacher
            });
        } else {
            setEditingSlot(null);
            setSlotForm({
                class_assigned: selectedClass,
                day: 'MON',
                start_time: '08:00',
                end_time: '09:00',
                subject: '',
                teacher: ''
            });
        }
        setIsModalOpen(true);
    };

    const renderSkeletonTimetable = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {days.map(day => (
                <div key={day.id} className="card bg-slate-50/50 border-t-4 border-slate-200 p-0">
                    <div className="p-3 bg-white border-b text-center"><Skeleton variant="text" width="60%" className="mx-auto" /></div>
                    <div className="p-2 space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-3 rounded border shadow-sm"><Skeleton variant="text" width="100%" height="40px" /></div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="fade-in px-4 pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="w-full lg:w-auto">
                    <h1 className="text-3xl font-black tracking-tight uppercase">Class Schedule</h1>
                    <p className="text-secondary text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Academic weekly timetable management</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full lg:w-auto mt-2 lg:mt-0 no-print">
                    <div className="w-full sm:w-64">
                        <SearchableSelect
                            placeholder="Search Class..."
                            options={classes.map(c => ({ id: c.id.toString(), label: `${c.name} ${c.stream}` }))}
                            value={selectedClass}
                            onChange={(val) => setSelectedClass(val.toString())}
                        />
                    </div>
                    {selectedClass && (
                        <div className="flex gap-2">
                            <Button variant="ghost" className="text-[10px] font-black uppercase" onClick={() => {
                                const exportData = slots.map(s => ({
                                    Day: days.find(d => d.id === s.day)?.label || s.day,
                                    'Start Time': s.start_time,
                                    'End Time': s.end_time,
                                    Subject: s.subject_name,
                                    Teacher: s.teacher_name || 'None'
                                }));
                                exportToCSV(exportData, `Timetable_Class_${selectedClass}`);
                            }} icon={<Download size={16} />}>Export</Button>
                            <Button variant="ghost" className="text-[10px] font-black uppercase" onClick={() => window.print()} icon={<Printer size={16} />}>Print</Button>
                        </div>
                    )}
                    {canAdd && (
                        <Button variant="primary" className="text-[10px] font-black uppercase shadow-lg shadow-primary/25" onClick={() => openModal()} disabled={!selectedClass} icon={<Plus size={16} />}>
                            Add Slot
                        </Button>
                    )}
                </div>
            </div>

            {loading ? renderSkeletonTimetable() : (
                selectedClass ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 print:grid-cols-6 print:gap-1">
                        {days.map(day => {
                            const daySlots = slots.filter(s => s.day === day.id).sort((a, b) => a.start_time.localeCompare(b.start_time));
                            return (
                                <div key={day.id} className="card bg-secondary-light/30 border-t-4 border-primary p-0 print:border print:shadow-none print:m-0 print:bg-white">
                                    <div className="p-3 bg-white border-b font-black text-center text-primary uppercase text-sm tracking-wider print:p-1 print:text-xs">
                                        {day.label}
                                    </div>
                                    <div className="p-2 space-y-2 min-h-200 print:p-1 print:min-h-0 print:space-y-1">
                                        {daySlots.map(slot => (
                                            <div key={slot.id} className="bg-white p-3 rounded border shadow-sm hover:shadow-md transition-all group relative print:shadow-none print:p-1 print:border-secondary-light">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-mono text-[10px] font-bold bg-primary-light text-primary px-1.5 rounded">
                                                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                                    </span>
                                                    {(canEdit || canDelete) && (
                                                        <div className="hidden group-hover:flex gap-1 absolute top-2 right-2 bg-white pl-2">
                                                            {canEdit && <Button variant="ghost" size="sm" className="p-1 h-auto text-primary" onClick={() => openModal(slot)} icon={<Edit size={12} />} />}
                                                            {canDelete && <Button variant="ghost" size="sm" className="p-1 h-auto text-error" onClick={() => handleDelete(slot.id)} icon={<Trash2 size={12} />} />}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="font-black text-sm mb-0.5">{slot.subject_name}</p>
                                                <p className="text-[10px] text-secondary uppercase flex items-center gap-1">
                                                    <User size={10} /> {slot.teacher_name || 'No Teacher'}
                                                </p>
                                            </div>
                                        ))}
                                        {daySlots.length === 0 && <p className="text-center text-[10px] text-secondary italic py-4">Free Day</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                        <Calendar size={48} className="mx-auto text-secondary mb-4 opacity-50" />
                        <h3 className="text-secondary font-bold">Select a Class to View Timetable</h3>
                    </div>
                )
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSlot ? "Edit Time Slot" : "Add Class Session"}>
                <form onSubmit={handleSubmit} className="space-y-4 form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label text-[10px] uppercase font-black">Day</label>
                            <SearchableSelect
                                options={days.map(d => ({ id: d.id, label: d.label }))}
                                value={slotForm.day}
                                onChange={(val) => setSlotForm({ ...slotForm, day: val.toString() })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="label text-[10px] uppercase font-black">Subject</label>
                            <SearchableSelect
                                placeholder="Select Subject..."
                                options={subjects.map(s => ({ id: s.id.toString(), label: s.name, subLabel: `(${s.code})` }))}
                                value={slotForm.subject}
                                onChange={(val) => setSlotForm({ ...slotForm, subject: val.toString() })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label text-[10px] uppercase font-black">Start Time</label>
                            <input type="time" className="input" value={slotForm.start_time} onChange={e => setSlotForm({ ...slotForm, start_time: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="label text-[10px] uppercase font-black">End Time</label>
                            <input type="time" className="input" value={slotForm.end_time} onChange={e => setSlotForm({ ...slotForm, end_time: e.target.value })} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label text-[10px] uppercase font-black">Teacher (Optional)</label>
                        <SearchableSelect
                            placeholder="No Teacher / Self Study..."
                            options={staff.filter(st => st.role === 'TEACHER').map(st => ({
                                id: st.id.toString(),
                                label: `${st.full_name} (${st.employee_id})`
                            }))}
                            value={slotForm.teacher?.toString() || ''}
                            onChange={(val) => setSlotForm({ ...slotForm, teacher: val.toString() })}
                        />
                    </div>

                    <div className="modal-footer">
                        <Button type="submit" variant="primary" className="w-full font-black uppercase" loading={isSubmitting} loadingText="Saving...">
                            Save to Schedule
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Timetable;

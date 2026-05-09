import React from 'react';
import Modal from '../Modal';
import SearchableSelect from '../SearchableSelect';
import PremiumDateInput from '../common/DatePicker';
import type { Student } from '../../types/student.types';
import type { ClassUnit } from '../../types/academic.types';

interface AttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    attendanceForm: { student: string; status: string; remark: string; date: string };
    setAttendanceForm: (form: any) => void;
    attendanceFilter: { level: string; classId: string; isBulk: boolean };
    setAttendanceFilter: (filter: any) => void;
    bulkAttendanceList: any[];
    setBulkAttendanceList: (list: any[]) => void;
    studentOptions: { id: number; label: string; subLabel: string }[];
    uniqueClassNames: string[];
    classes: ClassUnit[];
    students: Student[];
    handleAttendanceSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

const AcademicAttendanceModals: React.FC<AttendanceModalProps> = ({
    isOpen, onClose, attendanceForm, setAttendanceForm, attendanceFilter, setAttendanceFilter,
    bulkAttendanceList, setBulkAttendanceList, studentOptions, uniqueClassNames, classes, students,
    handleAttendanceSubmit, isSubmitting
}) => {
    // Convert studentOptions to SearchableSelect format (id, label)
    const formattedStudentOptions = studentOptions.map(opt => ({
        id: opt.id.toString(),
        label: `${opt.label} (${opt.subLabel})`
    }));

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Log Student Attendance" 
            size="lg"
            footer={
                <>
                    <button type="button" className="modern-btn modern-btn-secondary" onClick={onClose}>Cancel</button>
                    <button 
                        type="submit" 
                        form="attendance-form" 
                        className="modern-btn modern-btn-primary" 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "SAVING..." : "SAVE ATTENDANCE"}
                    </button>
                </>
            }
        >
            <form id="attendance-form" onSubmit={handleAttendanceSubmit} className="space-y-6">
                <div className="card p-4 bg-slate-50 border-slate-200">
                    <div className="flex gap-4 items-center">
                        <div className="flex-grow">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Attendance Mode</label>
                            <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setAttendanceFilter({ ...attendanceFilter, isBulk: false })}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${!attendanceFilter.isBulk ? 'bg-primary text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
                                >
                                    Single Entry
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setAttendanceFilter({ ...attendanceFilter, isBulk: true })}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${attendanceFilter.isBulk ? 'bg-primary text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
                                >
                                    Bulk (Class List)
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Date</label>
                            <PremiumDateInput 
                                value={attendanceForm.date}
                                onChange={(val) => setAttendanceForm({ ...attendanceForm, date: val })}
                            />
                        </div>
                    </div>
                </div>

                {!attendanceFilter.isBulk ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label>Student</label>
                            <SearchableSelect 
                                options={formattedStudentOptions}
                                value={attendanceForm.student}
                                onChange={(val) => setAttendanceForm({ ...attendanceForm, student: val.toString() })}
                                placeholder="Search by name or admission number"
                            />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <SearchableSelect 
                                options={[
                                    { id: 'PRESENT', label: 'Present' },
                                    { id: 'ABSENT', label: 'Absent' },
                                    { id: 'LATE', label: 'Late' },
                                    { id: 'EXCUSED', label: 'Excused' }
                                ]}
                                value={attendanceForm.status}
                                onChange={(val) => setAttendanceForm({ ...attendanceForm, status: val.toString() })}
                            />
                        </div>
                        <div className="form-group col-span-2">
                            <label>Remarks</label>
                            <textarea 
                                className="w-full h-20"
                                value={attendanceForm.remark}
                                onChange={(e) => setAttendanceForm({ ...attendanceForm, remark: e.target.value })}
                                placeholder="Optional notes about this attendance entry..."
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Filter Level</label>
                                <SearchableSelect 
                                    options={uniqueClassNames.map(name => ({ id: name, label: name }))}
                                    value={attendanceFilter.level}
                                    onChange={(val) => setAttendanceFilter({ ...attendanceFilter, level: val.toString() })}
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Select Class</label>
                                <SearchableSelect 
                                    options={classes.filter(c => c.name === attendanceFilter.level).map(c => ({ id: c.id.toString(), label: c.stream }))}
                                    value={attendanceFilter.classId}
                                    onChange={(val) => setAttendanceFilter({ ...attendanceFilter, classId: val.toString() })}
                                />
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto border border-slate-100 rounded-2xl">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white z-10 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">Student</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">Remark</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {bulkAttendanceList.map((item, idx) => {
                                        const student = students.find(s => s.id === item.student_id || s.id === item.student);
                                        return (
                                            <tr key={item.student ?? item.student_id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3">
                                                    <p className="text-xs font-black text-slate-800">{student?.full_name ?? 'Unknown'}</p>
                                                    <p className="text-[9px] font-bold text-slate-400">
                                                        {student?.class_name ? `${student.class_name} ${student.class_stream || ''}`.trim() : student?.admission_number ?? '—'}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1">
                                                        {['PRESENT', 'ABSENT', 'LATE'].map(s => (
                                                            <button 
                                                                key={s}
                                                                type="button"
                                                                onClick={() => {
                                                                    const newList = [...bulkAttendanceList];
                                                                    newList[idx].status = s;
                                                                    setBulkAttendanceList(newList);
                                                                }}
                                                                className={`px-2 py-1 rounded text-[9px] font-black transition-all ${item.status === s ? 'bg-primary text-white' : 'bg-white text-slate-300 border border-slate-100'}`}
                                                            >
                                                                {s[0]}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input 
                                                        type="text" 
                                                        className="w-full h-8 text-[10px] font-medium rounded-lg border-slate-200"
                                                        placeholder="Remark..."
                                                        value={item.remark}
                                                        onChange={(e) => {
                                                            const newList = [...bulkAttendanceList];
                                                            newList[idx].remark = e.target.value;
                                                            setBulkAttendanceList(newList);
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
};

export default AcademicAttendanceModals;

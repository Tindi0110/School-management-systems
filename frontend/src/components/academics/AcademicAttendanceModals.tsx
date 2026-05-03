import React from 'react';
import Modal from '../Modal';
import Button from '../common/Button';
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

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
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
                        {isSubmitting ? "POSTING..." : (attendanceFilter.isBulk ? `SUBMIT REGISTER (${bulkAttendanceList.length})` : 'POST RECORD')}
                    </button>
                </>
            }
        >
            <form id="attendance-form" onSubmit={handleAttendanceSubmit} className="space-y-6">
                <div className="flex bg-slate-50 p-4 rounded-xl border border-slate-100 justify-between items-center">
                    <div>
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Recording Mode</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase italic">Select scope for entry</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-lg border shadow-sm">
                        <button
                            type="button"
                            className={`px-4 py-2 rounded-md text-[10px] font-black transition-all ${!attendanceFilter.isBulk ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-primary'}`}
                            onClick={() => setAttendanceFilter({ ...attendanceFilter, isBulk: false })}
                        >
                            SINGLE
                        </button>
                        <button
                            type="button"
                            className={`px-4 py-2 rounded-md text-[10px] font-black transition-all ${attendanceFilter.isBulk ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-primary'}`}
                            onClick={() => setAttendanceFilter({ ...attendanceFilter, isBulk: true })}
                        >
                            BULK
                        </button>
                    </div>
                </div>

                <div className="form-grid p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div className="form-group col-span-2 md:col-span-1">
                        <label>Target Level</label>
                        <SearchableSelect
                            placeholder="Select Level..."
                            options={uniqueClassNames.map(name => ({ id: name, label: name }))}
                            value={attendanceFilter.level}
                            onChange={(val) => setAttendanceFilter({ ...attendanceFilter, level: val.toString(), classId: '' })}
                        />
                    </div>
                    <div className="form-group col-span-2 md:col-span-1">
                        <label>Stream</label>
                        <SearchableSelect
                            placeholder="Select Stream..."
                            options={classes.filter(c => c.name === attendanceFilter.level).map(c => ({ id: c.id.toString(), label: c.stream }))}
                            value={attendanceFilter.classId}
                            onChange={(val) => {
                                const newClassId = val.toString();
                                setAttendanceFilter({ ...attendanceFilter, classId: newClassId });
                                if (attendanceFilter.isBulk && newClassId) {
                                    const cid = parseInt(newClassId);
                                    const classStudents = students.filter(s => {
                                        const sClassId = typeof s.current_class === 'object' ? (s.current_class as any)?.id : s.current_class;
                                        return Number(sClassId) === cid;
                                    });
                                    setBulkAttendanceList(classStudents.map(s => ({ student_id: s.id, status: 'PRESENT', remark: '' })));
                                }
                            }}
                            disabled={!attendanceFilter.level}
                        />
                    </div>
                    <div className="form-group col-span-2">
                        <PremiumDateInput
                            label="Attendance Date"
                            value={attendanceForm.date}
                            onChange={(val: string) => setAttendanceForm({ ...attendanceForm, date: val })}
                            required
                        />
                    </div>
                </div>

                {!attendanceFilter.isBulk ? (
                    <div className="form-grid">
                        <div className="form-group col-span-2">
                            <label>Student Name *</label>
                            <SearchableSelect
                                options={attendanceFilter.classId
                                    ? formattedStudentOptions.filter((opt: any) => {
                                        const s = students.find(st => st.id.toString() === opt.id);
                                        const sClassId = typeof s?.current_class === 'object' ? (s?.current_class as any)?.id : s?.current_class;
                                        return s && Number(sClassId) === parseInt(attendanceFilter.classId);
                                    })
                                    : formattedStudentOptions
                                }
                                value={attendanceForm.student}
                                onChange={(v) => setAttendanceForm({ ...attendanceForm, student: v.toString() })}
                                required
                            />
                        </div>
                        <div className="form-group col-span-2 md:col-span-1">
                            <label>Status</label>
                            <SearchableSelect
                                options={[
                                    { id: 'PRESENT', label: 'Present' },
                                    { id: 'ABSENT', label: 'Absent' },
                                    { id: 'LATE', label: 'Late / Tardy' }
                                ]}
                                value={attendanceForm.status}
                                onChange={(v) => setAttendanceForm({ ...attendanceForm, status: v.toString() })}
                            />
                        </div>
                        <div className="form-group col-span-2 md:col-span-1">
                            <label>Remarks (Optional)</label>
                            <input
                                type="text"
                                value={attendanceForm.remark}
                                onChange={(e) => setAttendanceForm({ ...attendanceForm, remark: e.target.value })}
                                placeholder="Reason if absent..."
                            />
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="max-h-[350px] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-32">Status</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Remark</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bulkAttendanceList.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="text-center p-12 text-slate-400 italic text-xs">
                                                Select a class level and stream to load students
                                            </td>
                                        </tr>
                                    )}
                                    {bulkAttendanceList.map((item, idx) => {
                                        const student = students.find(s => s.id === item.student_id);
                                        return (
                                            <tr key={item.student_id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 text-xs font-bold text-slate-700">{student?.full_name}</td>
                                                <td className="px-2 py-2">
                                                    <select 
                                                        className="w-full h-8 text-[10px] font-bold rounded-lg border-slate-200 bg-white"
                                                        value={item.status}
                                                        onChange={(e) => {
                                                            const newList = [...bulkAttendanceList];
                                                            newList[idx].status = e.target.value;
                                                            setBulkAttendanceList(newList);
                                                        }}
                                                    >
                                                        <option value="PRESENT">Present</option>
                                                        <option value="ABSENT">Absent</option>
                                                        <option value="LATE">Late</option>
                                                    </select>
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

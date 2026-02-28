import React from 'react';
import Modal from '../Modal';
import Button from '../common/Button';
import SearchableSelect from '../SearchableSelect';
import PremiumDateInput from '../common/DatePicker';
import { Student } from '../../types/student.types';
import { ClassUnit } from '../../types/academic.types';

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
        <Modal isOpen={isOpen} onClose={onClose} title="Log Student Attendance" size="lg">
            <form onSubmit={handleAttendanceSubmit} className="form-container-md mx-auto">
                <div className="flex justify-between items-center mb-4 border-bottom pb-2">
                    <span className="text-xs font-bold uppercase text-secondary">Recording Mode:</span>
                    <div className="flex bg-secondary-light p-1 rounded-lg">
                        <button
                            type="button"
                            className={`px-3 py-1 text-[10px] font-black rounded ${!attendanceFilter.isBulk ? 'bg-primary text-white' : 'text-secondary'}`}
                            onClick={() => setAttendanceFilter({ ...attendanceFilter, isBulk: false })}
                        >
                            SINGLE STUDENT
                        </button>
                        <button
                            type="button"
                            className={`px-3 py-1 text-[10px] font-black rounded ${attendanceFilter.isBulk ? 'bg-primary text-white' : 'text-secondary'}`}
                            onClick={() => setAttendanceFilter({ ...attendanceFilter, isBulk: true })}
                        >
                            CLASS REGISTER (BULK)
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <PremiumDateInput
                            value={attendanceForm.date}
                            onChange={(val: string) => setAttendanceForm({ ...attendanceForm, date: val })}
                            placeholder="Date"
                            minDate={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-md mb-4 bg-secondary-light/20 p-2 rounded border">
                    <div>
                        <label className="text-[9px] font-bold uppercase text-secondary">Filter Class</label>
                        <SearchableSelect
                            placeholder="Level..."
                            options={uniqueClassNames.map(name => ({ id: name, label: name }))}
                            value={attendanceFilter.level}
                            onChange={(val) => setAttendanceFilter({ ...attendanceFilter, level: val.toString(), classId: '' })}
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold uppercase text-secondary">Stream</label>
                        <SearchableSelect
                            placeholder="Stream..."
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
                </div>

                {!attendanceFilter.isBulk ? (
                    <>
                        <SearchableSelect
                            label="Student Name *"
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
                        <div className="form-group mt-4">
                            <label className="label text-[10px] font-black uppercase">Status</label>
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
                        <div className="form-group">
                            <label className="label text-[10px] font-black uppercase">Remarks</label>
                            <input
                                type="text"
                                className="input"
                                value={attendanceForm.remark}
                                onChange={(e) => setAttendanceForm({ ...attendanceForm, remark: e.target.value })}
                                placeholder="Reason if absent..."
                            />
                        </div>
                    </>
                ) : (
                    <div className="max-h-[400px] overflow-y-auto border rounded">
                        <table className="table table-xs w-full">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr>
                                    <th>Student</th>
                                    <th>Status</th>
                                    <th>Remark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bulkAttendanceList.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-center p-4 text-xs italic text-secondary">
                                            Select a class to load students
                                        </td>
                                    </tr>
                                )}
                                {bulkAttendanceList.map((item, idx) => {
                                    const student = students.find(s => s.id === item.student_id);
                                    return (
                                        <tr key={item.student_id}>
                                            <td className="text-xs font-bold">{student?.full_name}</td>
                                            <td>
                                                <SearchableSelect
                                                    options={[
                                                        { id: 'PRESENT', label: 'Present' },
                                                        { id: 'ABSENT', label: 'Absent' },
                                                        { id: 'LATE', label: 'Late' }
                                                    ]}
                                                    value={item.status}
                                                    onChange={(v) => {
                                                        const newList = [...bulkAttendanceList];
                                                        newList[idx].status = v.toString();
                                                        setBulkAttendanceList(newList);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="input input-xs w-full"
                                                    placeholder="..."
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
                )}

                <div className="mt-6 pt-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white pb-2">
                    <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        className="bg-success border-success font-black uppercase text-white shadow-md px-8"
                        loading={isSubmitting}
                        loadingText="Posting..."
                    >
                        {attendanceFilter.isBulk ? `Submit Register (${bulkAttendanceList.length})` : 'Post Attendance Record'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

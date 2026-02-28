import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/SearchableSelect';

interface AttendanceManagerProps {
    attendanceRecords: any[];
    students: any[];
    classes: any[];
    attendanceSort: { field: string, direction: 'asc' | 'desc' };
    setAttendanceSort: (sort: any) => void;
    handleExportAcademics: () => void;
    isExporting: boolean;
    setEditingAttendanceId: (id: number | null) => void;
    setAttendanceForm: (form: any) => void;
    setIsAttendanceModalOpen: (val: boolean) => void;
    openEditAttendance: (att: any) => void;
    handleDeleteAttendance: (id: number) => void;
}

const AttendanceManager: React.FC<AttendanceManagerProps> = ({
    attendanceRecords,
    students,
    classes,
    attendanceSort,
    setAttendanceSort,
    handleExportAcademics,
    isExporting,
    setEditingAttendanceId,
    setAttendanceForm,
    setIsAttendanceModalOpen,
    openEditAttendance,
    handleDeleteAttendance
}) => {
    return (
        <div className="overflow-hidden shadow-lg mb-8 border rounded-2xl">
            <div className="p-4 bg-secondary-light flex flex-col sm:flex-row justify-between items-start sm:items-center border-bottom gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="mb-0 text-xs font-black uppercase tracking-wider">Attendance Register</h3>
                    <div className="flex gap-2">
                        <div className="w-40">
                            <SearchableSelect
                                options={[
                                    { id: 'date', label: 'Sort by Date' },
                                    { id: 'student', label: 'Sort by Student' },
                                    { id: 'class', label: 'Sort by Class' },
                                    { id: 'stream', label: 'Sort by Stream' }
                                ]}
                                value={attendanceSort.field}
                                onChange={(val) => setAttendanceSort({ ...attendanceSort, field: val.toString() })}
                            />
                        </div>
                        <div className="w-48">
                            <SearchableSelect
                                options={[
                                    { id: 'desc', label: 'Descending (Newest/Z-A)' },
                                    { id: 'asc', label: 'Ascending (Oldest/A-Z)' }
                                ]}
                                value={attendanceSort.direction}
                                onChange={(val) => setAttendanceSort({ ...attendanceSort, direction: val as 'asc' | 'desc' })}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-white shadow-sm" onClick={handleExportAcademics} loading={isExporting} loadingText="Exporting...">Export CSV</Button>
                    <Button variant="primary" size="sm" className="flex-1 sm:flex-none shadow-sm" onClick={() => { setEditingAttendanceId(null); setAttendanceForm({ student: '', status: 'PRESENT', remark: '', date: new Date().toISOString().split('T')[0] }); setIsAttendanceModalOpen(true); }} icon={<Plus size={14} />}>Log Status</Button>
                </div>
            </div>
            <div className="table-wrapper overflow-x-auto w-full block m-0">
                <table className="table table-sm min-w-[800px]">
                    <thead className="bg-secondary-light/30 text-secondary">
                        <tr>
                            <th>Date</th>
                            <th>Student</th>
                            <th>Class / Section</th>
                            <th>Status</th>
                            <th>Remarks</th>
                            <th className="text-right sticky right-0 bg-white/90">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendanceRecords.length === 0 ? (
                            <tr><td colSpan={6} className="text-center p-8 text-secondary italic">No attendance records found. Use "Log Status" to add entries.</td></tr>
                        ) : (
                            (() => {
                                const groupedAtt = attendanceRecords.reduce((acc: any, att: any) => {
                                    const student = students.find(s => s.id === att.student);
                                    const cls = classes.find(c => c.id === student?.current_class);
                                    const groupKey = cls ? `${cls.name} ${cls.stream}` : 'Unassigned';
                                    if (!acc[groupKey]) acc[groupKey] = [];
                                    acc[groupKey].push({ ...att, student_name: student?.full_name, class_name: groupKey });
                                    return acc;
                                }, {});

                                return Object.keys(groupedAtt).sort().map(groupKey => (
                                    <React.Fragment key={groupKey}>
                                        <tr className="bg-slate-50">
                                            <td colSpan={6} className="py-2 px-6 text-[10px] font-black uppercase text-secondary tracking-widest">{groupKey}</td>
                                        </tr>
                                        {groupedAtt[groupKey].map((att: any) => (
                                            <tr key={att.id} className="hover:bg-blue-50/50">
                                                <td className="font-mono text-xs">{att.date}</td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs">{att.student_name || 'Unknown'}</span>
                                                        <span className="text-[9px] text-secondary">ADM_NOT_STORED</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs text-primary">{att.class_name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge badge-sm font-bold ${att.status === 'PRESENT' ? 'badge-success text-white' : att.status === 'ABSENT' ? 'badge-error text-white' : 'badge-warning'}`}>
                                                        {att.status}
                                                    </span>
                                                </td>
                                                <td className="text-xs">{att.remark || '—'}</td>
                                                <td className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="sm" className="text-primary" onClick={() => openEditAttendance(att)} icon={<Edit size={12} />} />
                                                        <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDeleteAttendance(att.id)} icon={<Trash2 size={12} />} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ));
                            })()
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceManager;

import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import Modal from '../Modal';
import Button from '../common/Button';
import type { ClassUnit, Subject, Exam, GradeSystem, StudentResult } from '../../types/academic.types';
import type { Student } from '../../types/student.types';
import { calculateMeanGrade } from '../../utils/academicHelpers';

interface ExamBroadsheetProps {
    isOpen: boolean;
    onClose: () => void;
    selectedExam: Exam | null;
    students: Student[];
    classes: ClassUnit[];
    subjects: Subject[];
    examResults: StudentResult[];
    gradeSystems: GradeSystem[];
    uniqueClassNames: string[];
}

const ExamBroadsheet: React.FC<ExamBroadsheetProps> = ({
    isOpen,
    onClose,
    selectedExam,
    students,
    classes,
    subjects,
    examResults,
    gradeSystems,
    uniqueClassNames
}) => {
    const [viewResultsGroupBy, setViewResultsGroupBy] = useState<'STREAM' | 'ENTIRE_CLASS'>('STREAM');
    const [resultContext, setResultContext] = useState({ level: '', classId: '', subjectId: '' });

    // Filter students and calculate rows
    const studentRows = React.useMemo(() => {
        let filteredStudents = students;
        if (resultContext.level) {
            filteredStudents = students.filter(s => {
                const c = classes.find(cl => cl.id === s.current_class);
                return c?.name === resultContext.level;
            });
        }

        return filteredStudents.map(student => {
            const sResults = examResults.filter(r => r.student === student.id);
            const total = sResults.reduce((sum, r) => sum + parseFloat(r.score as any), 0);
            const avg = sResults.length > 0 ? total / sResults.length : 0;
            const meanGrade = calculateMeanGrade(sResults, gradeSystems, selectedExam?.grade_system as any);

            return {
                student,
                results: sResults,
                total,
                avg,
                meanGrade
            };
        }).sort((a, b) => b.total - a.total);
    }, [students, resultContext.level, classes, examResults, gradeSystems, selectedExam]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Broadsheet: ${selectedExam?.name || ''}`} size="lg">
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <select
                        className="select select-sm border-primary"
                        value={viewResultsGroupBy}
                        onChange={(e) => setViewResultsGroupBy(e.target.value as any)}
                    >
                        <option value="STREAM">Group by Stream</option>
                        <option value="ENTIRE_CLASS">Entire Class Ranking</option>
                    </select>
                    <select
                        className="select select-sm"
                        value={resultContext.level}
                        onChange={(e) => setResultContext({ ...resultContext, level: e.target.value })}
                    >
                        <option value="">Select Level (All)</option>
                        {uniqueClassNames.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer size={14} />}>Print Broadsheet</Button>
            </div>

            <div className="table-wrapper max-h-70vh overflow-auto border rounded bg-white relative min-w-0">
                <table className="table table-xs w-full border-collapse">
                    <thead className="sticky top-0 bg-primary text-white z-20">
                        <tr>
                            <th className="bg-primary border-r w-12 text-center">#</th>
                            <th className="bg-primary border-r min-w-[150px] sticky left-0 z-30">Student</th>
                            {viewResultsGroupBy === 'ENTIRE_CLASS' && <th className="bg-primary border-r">Stream</th>}
                            {subjects.map(sub => (
                                <th key={sub.id} className="text-center w-12 border-r text-[9px] vertical-text" title={sub.name}>{sub.code}</th>
                            ))}
                            <th className="text-center font-bold bg-primary border-r w-12">Total</th>
                            <th className="text-center font-bold bg-primary border-r w-12">Mean</th>
                            <th className="text-center font-bold bg-primary w-12">Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentRows.map((row, idx) => {
                            const cls = classes.find(c => c.id === row.student.current_class);
                            return (
                                <tr key={row.student.id} className="hover:bg-blue-50">
                                    <td className="text-center font-bold bg-gray-50">{idx + 1}</td>
                                    <td className="sticky left-0 bg-white z-10 font-bold text-xs py-1 px-2">
                                        {row.student.full_name}
                                        <div className="text-[9px] text-secondary font-mono">{row.student.admission_number}</div>
                                    </td>
                                    {viewResultsGroupBy === 'ENTIRE_CLASS' && <td className="text-center text-[10px]">{cls?.stream}</td>}

                                    {subjects.map(sub => {
                                        const res = row.results.find(r => r.subject === sub.id);
                                        return (
                                            <td key={sub.id} className="text-center text-xs">
                                                {res ? <span className={(res.score as any) < 40 ? 'text-error font-bold' : ''}>{res.score}</span> : '-'}
                                            </td>
                                        );
                                    })}

                                    <td className="text-center font-bold bg-gray-50">{row.total.toFixed(0)}</td>
                                    <td className="text-center font-bold bg-gray-50">{row.avg.toFixed(1)}</td>
                                    <td className="text-center font-black bg-gray-50">{row.meanGrade}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {examResults.length === 0 && <div className="text-center p-8 text-secondary">No results found...</div>}
            </div>
        </Modal>
    );
};

export default ExamBroadsheet;

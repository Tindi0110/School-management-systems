import React from 'react';
import Modal from '../Modal';
import Button from '../common/Button';
import SearchableSelect from '../SearchableSelect';
import StudentResultRow from './StudentResultRow';
import type { Student } from '../../types/student.types';
import type { ClassUnit, Subject, GradeSystem } from '../../types/academic.types';

interface ResultEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedExam: any;
    resultContext: { level: string; classId: string; subjectId: string };
    setResultContext: (ctx: any) => void;
    uniqueClassNames: string[];
    classes: ClassUnit[];
    subjects: Subject[];
    filteredResultStudents: Student[];
    studentScores: any;
    handleScoreChange: (studentId: any, subjectId: any, val: string) => void;
    handleDeleteSingleResult: (studentId: number, subjectId: number, resultId: number) => void;
    activeClassSubjects: any[];
    gradeSystems: GradeSystem[];
    handleBulkResultSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

export const ResultEntryModal: React.FC<ResultEntryModalProps> = ({
    isOpen, onClose, selectedExam, resultContext, setResultContext, uniqueClassNames,
    classes, subjects, filteredResultStudents, studentScores, handleScoreChange,
    handleDeleteSingleResult, activeClassSubjects, gradeSystems, handleBulkResultSubmit, isSubmitting
}) => (
    <Modal isOpen={isOpen} onClose={onClose} title={`Enter Results: ${selectedExam?.name || ''}`} size="lg">
        <form onSubmit={handleBulkResultSubmit} className="max-w-7xl mx-auto">
            {/* Cascading Class Selector */}
            <div className="form-group p-3 mb-4 bg-gray-50">
                <label className="label text-[10px] font-black uppercase mb-2">Select Class to Enter Marks</label>
                <div className="grid grid-cols-2 gap-md">
                    <div>
                        <label className="text-[9px] font-bold uppercase text-secondary">Class Level</label>
                        <SearchableSelect
                            placeholder="Select Level..."
                            options={uniqueClassNames.map(name => ({ id: name, label: name }))}
                            value={resultContext.level}
                            onChange={(val) => {
                                setResultContext({ ...resultContext, level: val.toString(), classId: '' });
                            }}
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold uppercase text-secondary">Stream</label>
                        <SearchableSelect
                            placeholder="Select Stream..."
                            options={[
                                { id: 'all', label: 'ALL STREAMS (Combined)' },
                                ...classes.filter(c => c.name === resultContext.level).map(c => ({ id: c.id.toString(), label: c.stream }))
                            ]}
                            value={resultContext.classId}
                            onChange={(val) => {
                                setResultContext({ ...resultContext, classId: val.toString() });
                            }}
                            disabled={!resultContext.level}
                        />
                    </div>
                </div>
            </div>

            {resultContext.classId && (
                <div className="table-wrapper max-h-[75vh] w-full block bg-white relative m-0 mt-4 border rounded-xl overflow-auto shadow-sm">
                    <table className="results-entry-table table w-full border-collapse text-xs">
                        <thead className="sticky top-0 z-20 bg-white">
                            <tr className="border-none">
                                <th className="sticky left-0 z-30 bg-white min-w-[160px] p-3 text-left">
                                    <span className="text-[10px] font-black uppercase text-slate-800">Student Name</span>
                                </th>
                                {subjects.filter(sub => {
                                    if (resultContext.classId === 'all') return true;
                                    return activeClassSubjects.some(cs => cs.subject === sub.id);
                                }).map(sub => (
                                    <th key={sub.id} className="text-center min-w-[110px] p-2 bg-white" title={`${sub.name} (${sub.code})`}>
                                        <div className="text-[11px] font-black uppercase text-slate-800">{sub.name.substring(0, 3)}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResultStudents.map((student) => {
                                const sClass = classes.find(c => c.id === student.current_class);
                                return (
                                    <StudentResultRow
                                        key={student.id}
                                        student={student}
                                        sClass={sClass}
                                        subjects={subjects}
                                        studentScores={studentScores[student.id]}
                                        onScoreChange={handleScoreChange}
                                        onDeleteResult={handleDeleteSingleResult}
                                        activeClassSubjects={activeClassSubjects}
                                        resultContext={resultContext.classId}
                                        gradeSystems={gradeSystems}
                                        examGradeSystemId={selectedExam?.grade_system}
                                        isLocked={!selectedExam?.is_active}
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredResultStudents.length === 0 && (
                        <div className="p-12 text-center text-gray-400 italic">No students found for {resultContext.level} {resultContext.classId === 'all' ? '(All Streams)' : ''}</div>
                    )}
                </div>
            )}

            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <p className="text-[10px] text-secondary">
                    <span className="font-bold text-primary">Tip:</span> Existing marks are shown in <span className="font-bold text-primary">blue</span>. Enter new marks and click Save.
                </p>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" className="font-black uppercase shadow-md px-6" loading={isSubmitting} loadingText="Saving Matrix...">Save Matrix Payload</Button>
                </div>
            </div>
        </form>
    </Modal>
);

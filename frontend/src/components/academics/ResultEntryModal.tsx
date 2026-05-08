import React from 'react';
import Modal from '../Modal';
import SearchableSelect from '../SearchableSelect';
import StudentResultRow from './StudentResultRow';
import { Lock, AlertTriangle } from 'lucide-react';
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
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Enter Results: ${selectedExam?.name || ''}`} 
        size="lg"
        footer={
            <div className="flex justify-between items-center w-full">
                <p className="text-[10px] text-slate-500 font-medium italic">
                    {(!selectedExam?.is_active || selectedExam?.is_locked)
                        ? <span className="flex items-center gap-1 text-amber-700 font-bold"><AlertTriangle size={12} /> Read-only mode — entry period has ended.</span>
                        : <><span className="font-black text-primary uppercase mr-2 tracking-widest">Tip:</span> Existing marks are <span className="text-primary font-black">Highlighted</span>. Enter new marks and click Save.</>
                    }
                </p>
                <div className="flex gap-3">
                    <button type="button" className="modern-btn modern-btn-secondary" onClick={onClose}>Close</button>
                    {!(!selectedExam?.is_active || selectedExam?.is_locked) && (
                        <button 
                            type="submit" 
                            form="result-form" 
                            className="modern-btn modern-btn-primary" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "SAVING MATRIX..." : "SAVE MATRIX PAYLOAD"}
                        </button>
                    )}
                </div>
            </div>
        }
    >
        <form id="result-form" onSubmit={handleBulkResultSubmit} className="space-y-6">
            {(!selectedExam?.is_active || selectedExam?.is_locked) && (
                <div className="mb-4 flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
                    <div className="flex-shrink-0 mt-0.5 p-1.5 bg-amber-100 rounded-lg text-amber-700">
                        <Lock size={16} />
                    </div>
                    <div>
                        <p className="text-sm font-black uppercase text-amber-800 mb-0.5">Marks Entry Period Closed</p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            This exam (<strong>{selectedExam?.name}</strong>) is no longer open for marks entry. 
                            Results are now locked and read-only. To re-open entry, an administrator must set the exam back to <strong>"Open for Marks Entry"</strong> in the exam settings.
                        </p>
                    </div>
                </div>
            )}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Scope Configuration</h4>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Target Level</label>
                        <SearchableSelect
                            placeholder="Select Level..."
                            options={uniqueClassNames.map(name => ({ id: name, label: name }))}
                            value={resultContext.level}
                            onChange={(val) => {
                                setResultContext({ ...resultContext, level: val.toString(), classId: '' });
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Stream / Combined</label>
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
                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                    <div className="max-h-[50vh] overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="sticky left-0 z-30 bg-slate-50 px-4 py-3 min-w-[180px]">
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Student Candidate</span>
                                    </th>
                                    {subjects.filter(sub => {
                                        if (resultContext.classId === 'all') return true;
                                        return activeClassSubjects.some(cs => cs.subject === sub.id);
                                    }).map(sub => (
                                        <th key={sub.id} className="px-2 py-3 text-center min-w-[100px]" title={`${sub.name} (${sub.code})`}>
                                            <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{sub.name.substring(0, 3)}</div>
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
                                            isLocked={!selectedExam?.is_active || selectedExam?.is_locked}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredResultStudents.length === 0 && (
                            <div className="p-20 text-center text-slate-400 italic text-xs font-medium uppercase tracking-widest">
                                No students found for the selected scope
                            </div>
                        )}
                    </div>
                </div>
            )}
        </form>
    </Modal>
);

import React from 'react';
import { calculateGrade } from '../../utils/academicHelpers';

const StudentResultRow = React.memo(({
    student,
    sClass,
    subjects,
    studentScores,
    onScoreChange,
    onDeleteResult,
    activeClassSubjects,
    resultContext,
    gradeSystems,
    examGradeSystemId,
    isLocked
}: any) => {
    return (
        <tr className="hover:bg-slate-50 transition-colors border-b">
            <td className="sticky left-0 z-10 bg-white font-medium py-2 px-3 border-r">
                <div className="text-slate-950 font-bold text-sm" title={student.full_name}>{student.full_name}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {student.admission_number} | {sClass?.stream}
                </div>
            </td>
            {subjects.filter((sub: any) => {
                if (resultContext === 'all') return true;
                return activeClassSubjects.some((cs: any) => cs.subject === sub.id);
            }).map((sub: any) => {
                const entry = (studentScores || {})[sub.id] || { score: '' };
                const scoreVal = parseFloat(entry.score);
                const grade = isNaN(scoreVal) ? '' : calculateGrade(scoreVal, gradeSystems, examGradeSystemId);
                const hasSavedResult = !!entry.id;
                return (
                    <td key={sub.id} className="p-0 relative border-r group min-w-[120px]">
                        <div className="flex flex-col items-center justify-center p-2 min-h-[80px]">
                            <input
                                type="text"
                                inputMode="decimal"
                                className={`w-20 text-center text-base font-black border outline-none px-2 py-2 m-0 rounded-xl shadow-inner
                                    ${hasSavedResult ? 'text-primary border-primary/30 bg-primary/5' : 'text-slate-700 border-slate-200 bg-slate-50/50'}
                                    focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all`}
                                value={entry.score}
                                placeholder="—"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (!isLocked && (val === '' || /^\d*\.?\d*$/.test(val))) {
                                        onScoreChange(student.id, sub.id, val);
                                    }
                                }}
                                disabled={isLocked}
                                title={isLocked ? "Results Entry is Locked" : `${sub.name}: ${entry.score || 'not entered'}`}
                            />
                            {/* Grade badge */}
                            <span className={`text-[10px] font-black mt-1 ${grade === 'A' || grade === 'A-' ? 'text-green-600' :
                                grade === 'E' || grade === 'D-' ? 'text-red-600' :
                                    grade ? 'text-slate-500' : 'text-slate-300'
                                }`}>{grade || '•'}</span>
                        </div>
                        {/* Delete button — only shown for saved results on hover */}
                        {hasSavedResult && !isLocked && (
                            <button
                                type="button"
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-100 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black leading-none"
                                title={`Delete ${sub.name} score for ${student.full_name}`}
                                onClick={() => onDeleteResult && onDeleteResult(student.id, sub.id, entry.id)}
                            >×</button>
                        )}
                        {/* Blue dot = saved, not yet in db */}
                        {entry.score && !hasSavedResult && (
                            <span className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved" />
                        )}
                    </td>
                );
            })}
        </tr>
    );
});

export default StudentResultRow;

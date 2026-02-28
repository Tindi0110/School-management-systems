import React from 'react';
import { Edit, Trash2, Trophy, Printer, ClipboardCheck, Calendar } from 'lucide-react';
import Modal from '../Modal';
import Button from '../common/Button';
import SearchableSelect from '../SearchableSelect';
import PremiumDateInput from '../common/DatePicker';
import type { Exam, Term, GradeSystem, Subject } from '../../types/academic.types';
import { calculateGrade } from '../../utils/academicHelpers';

interface ExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    examForm: { name: string; exam_type: string; term: string; grade_system: string; weighting: number; date_started: string; is_active: boolean };
    setExamForm: (form: any) => void;
    handleExamSubmit: (e: React.FormEvent) => void;
    terms: Term[];
    gradeSystems: GradeSystem[];
    isSubmitting: boolean;
}

export const ExamModal: React.FC<ExamModalProps> = ({
    isOpen, onClose, examForm, setExamForm, handleExamSubmit, terms, gradeSystems, isSubmitting
}) => (
    <Modal isOpen={isOpen} onClose={onClose} title={examForm.name ? "Edit Exam Schedule" : "Schedule New Exam"}>
        <form onSubmit={handleExamSubmit} className="form-container-md mx-auto space-y-4">
            <div className="form-group">
                <label className="label text-[10px] font-black uppercase tracking-widest">Exam Name</label>
                <input
                    type="text"
                    className="input font-bold"
                    placeholder="e.g. Mid-Term 1 2024"
                    value={examForm.name}
                    onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="label text-[10px] font-black uppercase">Term</label>
                    <SearchableSelect
                        placeholder="Select Term..."
                        options={terms.map(t => ({ id: t.id.toString(), label: t.name, subLabel: (t as any).year_name }))}
                        value={examForm.term}
                        onChange={(val) => setExamForm({ ...examForm, term: val.toString() })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="label text-[10px] font-black uppercase">Grading System</label>
                    <SearchableSelect
                        placeholder="Select System..."
                        options={gradeSystems.map(gs => ({ id: gs.id.toString(), label: gs.name }))}
                        value={examForm.grade_system}
                        onChange={(val) => setExamForm({ ...examForm, grade_system: val.toString() })}
                        required
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="label text-[10px] font-black uppercase text-secondary">Date Started</label>
                    <PremiumDateInput
                        value={examForm.date_started}
                        onChange={(val) => setExamForm({ ...examForm, date_started: val })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="label text-[10px] font-black uppercase">Weighting %</label>
                    <input
                        type="number"
                        className="input"
                        value={examForm.weighting}
                        onChange={(e) => setExamForm({ ...examForm, weighting: parseInt(e.target.value) })}
                        max="100"
                        min="1"
                        required
                    />
                </div>
            </div>
            <div className="form-group flex items-center gap-2 pt-2">
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={examForm.is_active}
                    onChange={(e) => setExamForm({ ...examForm, is_active: e.target.checked })}
                />
                <label className="label text-[10px] font-black uppercase mb-0">Open for Marks Entry</label>
            </div>
            <Button
                type="submit"
                variant="primary"
                className="w-full font-black uppercase mt-4"
                loading={isSubmitting}
                loadingText="Saving..."
            >
                Save Schedule
            </Button>
        </form>
    </Modal>
);

interface SyllabusModalProps {
    isOpen: boolean;
    onClose: () => void;
    syllabusForm: { level: string; class_grade: string; subject: string; coverage_percentage: number };
    setSyllabusForm: (form: any) => void;
    handleSyllabusSubmit: (e: React.FormEvent) => void;
    uniqueClassNames: string[];
    classes: any[];
    subjects: Subject[];
    isSubmitting: boolean;
}

export const SyllabusModal: React.FC<SyllabusModalProps> = ({
    isOpen, onClose, syllabusForm, setSyllabusForm, handleSyllabusSubmit, uniqueClassNames, classes, subjects, isSubmitting
}) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Track Syllabus Coverage">
        <form onSubmit={handleSyllabusSubmit} className="form-container-md mx-auto">
            <div className="form-group">
                <label className="label text-[10px] font-black uppercase">Class Level</label>
                <SearchableSelect
                    placeholder="Select Level..."
                    options={uniqueClassNames.map(name => ({ id: name, label: name }))}
                    value={syllabusForm.level}
                    onChange={(val) => setSyllabusForm({ ...syllabusForm, level: val.toString(), class_grade: '' })}
                    required
                />
            </div>
            <div className="form-group">
                <label className="label text-[10px] font-black uppercase">Specific Stream</label>
                <SearchableSelect
                    placeholder="Select Stream..."
                    options={classes.filter(c => c.name === syllabusForm.level).map(c => ({ id: c.id.toString(), label: c.stream }))}
                    value={syllabusForm.class_grade}
                    onChange={(val) => setSyllabusForm({ ...syllabusForm, class_grade: val.toString() })}
                    required
                    disabled={!syllabusForm.level}
                />
            </div>
            <div className="form-group">
                <label className="label text-[10px] font-black uppercase">Subject</label>
                <SearchableSelect
                    placeholder="Select Subject..."
                    options={subjects.map(s => ({ id: s.id.toString(), label: s.name, subLabel: `(${s.code})` }))}
                    value={syllabusForm.subject}
                    onChange={(val) => setSyllabusForm({ ...syllabusForm, subject: val.toString() })}
                    required
                />
            </div>
            <div className="form-group">
                <label className="label text-[10px] font-black uppercase">Start Pct</label>
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        className="range range-xs range-primary"
                        value={syllabusForm.coverage_percentage}
                        onChange={(e) => setSyllabusForm({ ...syllabusForm, coverage_percentage: parseInt(e.target.value) })}
                    />
                    <span className="font-bold text-xs w-12 text-right">{syllabusForm.coverage_percentage}%</span>
                </div>
            </div>
            <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full mt-2 font-black uppercase"
                loading={isSubmitting}
                loadingText="Saving..."
            >
                Save Coverage
            </Button>
        </form>
    </Modal>
);

interface RankingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedExam: Exam | null;
    rankingFilter: { level: string; classId: string };
    setRankingFilter: (filter: any) => void;
    uniqueClassNames: string[];
    classes: any[];
    subjects: Subject[];
    examResults: any[];
    gradeSystems: GradeSystem[];
    handleDeleteStudentResults: (studentId: number) => void;
    setIsResultModalOpen: (open: boolean) => void;
    setResultContext: (ctx: any) => void;
}

export const RankingModal: React.FC<RankingModalProps> = ({
    isOpen, onClose, selectedExam, rankingFilter, setRankingFilter,
    uniqueClassNames, classes, subjects, examResults, gradeSystems,
    handleDeleteStudentResults, setIsResultModalOpen, setResultContext
}) => {
    const getSubjectAbbr = (sub: any) => {
        if (sub.short_name) return sub.short_name.toUpperCase();
        if (sub.code) return sub.code.toUpperCase();
        return sub.name.substring(0, 3).toUpperCase();
    };

    const getGroupedAndRankedResults = () => {
        const aggregated: { [key: number]: any } = {};
        examResults.forEach(r => {
            if (!aggregated[r.student]) {
                aggregated[r.student] = {
                    student: r.student,
                    student_name: r.student_name,
                    admission_number: r.admission_number,
                    class_name: r.class_name,
                    class_stream: r.class_stream,
                    form_level: r.form_level,
                    scores: {},
                    totalScore: 0,
                    subjectCount: 0,
                    classId: r.class_id || r.classId
                };
            }
            aggregated[r.student].scores[r.subject] = r.score;
            aggregated[r.student].totalScore += parseFloat(r.score);
            aggregated[r.student].subjectCount += 1;
        });

        const rankedResults = Object.values(aggregated).map((s: any) => {
            const mean = s.subjectCount > 0 ? (s.totalScore / s.subjectCount) : 0;
            return {
                ...s,
                meanScore: mean.toFixed(1),
                meanGrade: calculateGrade(mean, gradeSystems, selectedExam?.grade_system)
            };
        });

        const filtered = rankedResults.filter((r: any) => {
            const matchesLevel = !rankingFilter.level || r.form_level === rankingFilter.level;
            const matchesClass = !rankingFilter.classId || r.classId === parseInt(rankingFilter.classId);
            return matchesLevel && matchesClass;
        });

        const sorted = filtered.sort((a: any, b: any) => b.totalScore - a.totalScore);

        const groups: { [key: string]: any[] } = {};
        if (sorted.length > 0) {
            const label = rankingFilter.classId ?
                classes.find(c => c.id === parseInt(rankingFilter.classId))?.stream + " Results" :
                (rankingFilter.level || "Overall") + " Ranking";
            groups[label] = sorted;
        }

        return groups;
    };

    const groupedResults = getGroupedAndRankedResults();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Examination Results & Ranking" size="lg">
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-xl gap-4">
                    <div>
                        <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider mb-0">{selectedExam?.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Performance Summary & Rankings</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-slate-400 mb-1">Level</span>
                            <SearchableSelect
                                placeholder="All Levels"
                                options={uniqueClassNames.map(name => ({ id: name, label: name }))}
                                value={rankingFilter.level}
                                onChange={(val) => setRankingFilter({ ...rankingFilter, level: val.toString(), classId: '' })}
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-slate-400 mb-1">Stream</span>
                            <SearchableSelect
                                placeholder="All Streams"
                                options={classes.filter(c => c.name === rankingFilter.level).map(c => ({ id: c.id.toString(), label: c.stream }))}
                                value={rankingFilter.classId}
                                onChange={(val) => setRankingFilter({ ...rankingFilter, classId: val.toString() })}
                            />
                        </div>
                        <Button variant="outline" size="sm" className="no-print font-black uppercase text-[10px] h-8 mt-4 bg-white" onClick={() => window.print()} title="Print Ranking Report" icon={<Printer size={14} />}>
                            PRINT
                        </Button>
                    </div>
                </div>

                <div className="max-h-60vh overflow-y-auto">
                    {Object.keys(groupedResults).sort().map(groupKey => (
                        <div key={groupKey} className="mb-8 card p-0 overflow-hidden border-slate-100 shadow-sm">
                            <div className="card-header bg-slate-50/50">
                                <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-widest mb-0">{groupKey}</h4>
                                <span className="badge bg-slate-200 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full">{groupedResults[groupKey].length} CANDIDATES</span>
                            </div>
                            <div className="table-wrapper overflow-x-auto w-full block m-0">
                                <table className="table min-w-[800px]">
                                    <thead className="bg-white text-[10px] uppercase font-black text-slate-400">
                                        <tr>
                                            <th className="py-4 px-6 w-16">Rank</th>
                                            <th className="py-4 px-6 min-w-[200px] text-left">Student Name</th>
                                            <th className="py-4 px-6">ADM</th>
                                            {subjects.filter((sub: any) => groupedResults[groupKey].some((r: any) => r.scores && r.scores[sub.id])).map((sub: any) => (
                                                <th key={sub.id} className="py-4 px-6 text-center" title={sub.name}>{getSubjectAbbr(sub)}</th>
                                            ))}
                                            <th className="py-4 px-6 text-right">Total</th>
                                            <th className="py-4 px-6 text-right">Mean</th>
                                            <th className="py-4 px-6 text-center">Grade</th>
                                            <th className="py-4 px-6 text-right no-print">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {groupedResults[groupKey].sort((a: any, b: any) => b.totalScore - a.totalScore).map((res: any, index: number) => (
                                            <tr key={res.student} className={`hover:bg-slate-50 transition-colors group ${index < 3 ? 'bg-amber-50/30' : ''}`}>
                                                <td className="py-4 px-6">
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-white' : index === 2 ? 'bg-amber-700/50 text-white' : 'text-slate-400'}`}>
                                                        {index + 1}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="font-black text-xs text-slate-900">{res.student_name}</div>
                                                </td>
                                                <td className="py-4 px-6 font-mono text-[10px] text-slate-400">{res.admission_number}</td>
                                                {subjects.filter((sub: any) => groupedResults[groupKey].some((r: any) => r.scores && r.scores[sub.id])).map((sub: any) => (
                                                    <td key={sub.id} className="py-4 px-6 text-center text-[11px] font-black text-slate-600">
                                                        {res.scores[sub.id] !== undefined ? `${res.scores[sub.id]}%` : '—'}
                                                    </td>
                                                ))}
                                                <td className="py-4 px-6 text-right font-black text-slate-900">{res.totalScore}</td>
                                                <td className="py-4 px-6 text-right font-black text-primary">{res.meanScore}%</td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${['A', 'A-'].includes(res.meanGrade) ? 'bg-success/20 text-success' : ['D', 'E'].includes(res.meanGrade) ? 'bg-error/20 text-error' : 'bg-slate-100 text-slate-400'}`}>{res.meanGrade || '-'}</span>
                                                </td>
                                                <td className="py-4 px-6 text-right no-print">
                                                    <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-all">
                                                        <Button variant="ghost" size="sm" className="p-1 h-7 w-7 text-primary hover:bg-primary/10" title="Edit Results" onClick={() => {
                                                            setResultContext({ level: res.form_level, classId: (res.classId || res.class_id).toString(), subjectId: 'all' });
                                                            onClose();
                                                            setIsResultModalOpen(true);
                                                        }} icon={<Edit size={12} />} />
                                                        <Button variant="ghost" size="sm" className="p-1 h-7 w-7 text-error hover:bg-error/10" title="Delete All Results" onClick={() => handleDeleteStudentResults(res.student)} icon={<Trash2 size={12} />} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                    {Object.keys(groupedResults).length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center opacity-30">
                            <Trophy size={64} className="mb-4" />
                            <p className="font-black uppercase tracking-widest text-xs">No examination data available</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

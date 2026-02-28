import React from 'react';
import { BookOpen, TrendingUp, ShieldCheck, Printer } from 'lucide-react';
import { StatCard } from '../../../components/Card';
import Button from '../../../components/common/Button';
import { Student } from '../../../types/student.types';

interface AcademicHistoryProps {
    student: Student;
    results: any[];
    onGenerateTranscript: () => void;
}

const AcademicHistory: React.FC<AcademicHistoryProps> = ({ student, results, onGenerateTranscript }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Performance Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Mean Score"
                    value={`${(() => {
                        const validScores = results.map((r: any) => parseFloat(r.score || r.marks_attained || 0)).filter(s => !isNaN(s));
                        return validScores.length > 0 ? (validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length).toFixed(1) : '0';
                    })()}%`}
                    icon={<TrendingUp size={18} />}
                    gradient="linear-gradient(135deg, #1e3c72, #2a5298)"
                />
                <StatCard
                    title="Mean Grade"
                    value={student.average_grade || '—'}
                    icon={<ShieldCheck size={18} />}
                    gradient="linear-gradient(135deg, #4facfe, #00f2fe)"
                />
                <StatCard
                    title="Subjects Recorded"
                    value={new Set(results.map(r => r.subject_name)).size}
                    icon={<BookOpen size={18} />}
                    gradient="linear-gradient(135deg, #667eea, #764ba2)"
                />
            </div>

            <div className="card border-none shadow-xl bg-white card-mobile-flat p-0 overflow-hidden border-top-4 border-primary">
                <div className="p-5 border-b bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-0">Examination Ledger</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Detailed breakdown of institutional assessments</p>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        className="font-black shadow-lg shadow-primary/20"
                        onClick={onGenerateTranscript}
                        icon={<Printer size={14} />}
                    >
                        GENERATE TRANSCRIPT
                    </Button>
                </div>

                <div className="relative group">
                    <div className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 z-10 animate-pulse pointer-events-none opacity-40">
                        <div className="bg-slate-800 text-white p-2 rounded-full">
                            <TrendingUp className="rotate-90" size={12} />
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="table table-sm w-full min-w-[700px]">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 min-w-[180px]">Subject Title</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 min-w-[220px]">Examination Cycle</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 text-center min-w-[100px]">Raw Score</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 text-center min-w-[100px]">Grade</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 text-right min-w-[150px]">Performance Hint</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {results.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-20 opacity-30 font-black uppercase tracking-widest text-xs">No academic records found</td>
                                    </tr>
                                ) : (
                                    results.map((r: any, i: number) => {
                                        const score = Math.round(r.score || r.marks_attained);
                                        return (
                                            <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-primary/5 text-primary flex items-center justify-center font-black text-[10px] uppercase">
                                                            {r.subject_name?.substring(0, 2)}
                                                        </div>
                                                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{r.subject_name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{r.exam_name}</span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="text-sm font-black text-primary font-mono">{score}%</span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${['A', 'A-', 'B+', 'B'].includes(r.grade) ? 'bg-success/10 text-success' :
                                                        ['C+', 'C', 'C-'].includes(r.grade) ? 'bg-blue-100 text-blue-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {r.grade || '—'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden max-w-[120px] ml-auto">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${score >= 70 ? 'bg-success' : score >= 50 ? 'bg-info' : 'bg-error'}`}
                                                            style={{ width: `${score}%` }}
                                                        ></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            {results.length > 0 && (
                                <tfoot className="bg-slate-900 text-white">
                                    <tr>
                                        <td colSpan={2} className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white/50">Cumulative Mean Performance</td>
                                        <td className="py-4 px-6 text-center text-sm font-black">
                                            {(results.reduce((s: number, r: any) => s + parseFloat(r.score || 0), 0) / (results.length || 1)).toFixed(1)}%
                                        </td>
                                        <td colSpan={2} className="py-4 px-6 text-right text-sm font-black text-success">
                                            OVERALL: {student.average_grade}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademicHistory;

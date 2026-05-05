import React from 'react';
import { Users, Layers, Calendar, Trophy, Edit, BarChart3 } from 'lucide-react';
import { StatCard } from '../../components/Card';
import Button from '../../components/common/Button';

interface AcademicSummaryProps {
    classes: any[];
    subjectGroups: any[];
    exams: any[];
    meanGrade: string;
    syllabusData: any[];
    setActiveTab: (tab: string) => void;
    setIsSyllabusModalOpen: (val: boolean) => void;
    setSyllabusForm: (val: any) => void;
    setEditingSyllabusId: (id: number | null) => void;
    openViewResults: (exam: any) => void;
}

const AcademicSummary: React.FC<AcademicSummaryProps> = ({
    classes,
    subjectGroups,
    exams,
    meanGrade,
    syllabusData,
    setActiveTab,
    setIsSyllabusModalOpen,
    setSyllabusForm,
    setEditingSyllabusId,
    openViewResults
}) => {
    return (
        <div className="space-y-8 fade-in">
            <div className="grid grid-cols-2 gap-6 lg:gap-8">
                <div className="min-w-0">
                    <StatCard
                        title="Enrolled Capacity"
                        value={classes.length > 0 ? `${classes.reduce((sum, c) => sum + (c.student_count || 0), 0)}/${classes.reduce((sum, c) => sum + (c.capacity || 40), 0)}` : "0/0"}
                        icon={<Users size={18} />}
                        gradient="linear-gradient(135deg, #0f172a, #1e293b)"
                    />
                </div>
                <div className="min-w-0">
                    <StatCard
                        title="Departments"
                        value={subjectGroups.length}
                        icon={<Layers size={18} />}
                        gradient="linear-gradient(135deg, #0f172a, #1e293b)"
                    />
                </div>
                <div className="min-w-0">
                    <StatCard
                        title="Active Exams"
                        value={exams.filter(e => e.is_active).length}
                        icon={<Calendar size={18} />}
                        gradient="linear-gradient(135deg, #4facfe, #00f2fe)"
                    />
                </div>
                <div className="min-w-0">
                    <StatCard
                        title="Overall Mean"
                        value={meanGrade === '...' ? '—' : (meanGrade || "N/A")}
                        icon={<Trophy size={18} />}
                        gradient="linear-gradient(135deg, #667eea, #764ba2)"
                    />
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 lg:gap-8 min-h-[60vh]">
                <div className="col-span-12 lg:col-span-4 min-w-0">
                    <div className="card h-full flex flex-col p-0 overflow-hidden border-top-4 border-primary">
                        <div className="card-header">
                            <h3 className="mb-0 text-xs font-black uppercase">Exams Overview</h3>
                            <Button variant="ghost" size="sm" className="text-primary font-black uppercase text-[10px]" onClick={() => setActiveTab('EXAMS')}>View All</Button>
                        </div>
                        <div className="card-body p-4 space-y-3 flex-1">
                            {exams.slice(0, 4).map(e => (
                                <div key={e.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:border-primary/20 hover:bg-slate-50 transition-all cursor-pointer group" onClick={() => { setActiveTab('EXAMS'); setTimeout(() => openViewResults(e), 100); }}>
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-primary-light group-hover:text-white transition-colors"><Calendar size={14} /></div>
                                        <div>
                                            <p className="font-black text-xs mb-0 text-slate-800">{e.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{e.term_name || 'Active Term'}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                <span className="text-[9px] font-mono text-slate-500">{e.date_start ? new Date(e.date_start + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${e.is_active ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-400'}`}>{e.is_active ? 'OPEN' : 'CLOSED'}</span>
                                </div>
                            ))}
                            {exams.length === 0 && <div className="py-12 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest">No recent exams</div>}
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-6 min-w-0">
                    <div className="card h-full flex flex-col p-0 overflow-hidden">
                        <div className="card-header">
                            <h3 className="mb-0 text-xs font-black uppercase">Syllabus Completion</h3>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="p-2" onClick={() => setIsSyllabusModalOpen(true)} icon={<Edit size={12} />} />
                            </div>
                        </div>
                        <div className="card-body p-6 space-y-6 min-h-[300px]">
                            {syllabusData.length === 0 && (
                                <div className="py-12 text-center text-slate-300">
                                    <BarChart3 size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="font-black text-[10px] uppercase tracking-widest">No tracking data</p>
                                </div>
                            )}
                            {syllabusData.map(s => (
                                <div key={s.id} className="cursor-pointer group" onClick={() => {
                                    const cls = classes.find(c => c.id === s.class_grade);
                                    setSyllabusForm({
                                        subject: s.subject.toString(),
                                        level: cls?.name || '',
                                        class_grade: s.class_grade.toString(),
                                        coverage_percentage: s.coverage_percentage
                                    });
                                    setEditingSyllabusId(s.id);
                                    setIsSyllabusModalOpen(true);
                                }}>
                                    <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-tight">
                                        <span className="text-slate-700">{s.subject_name} <span className="text-slate-400 ml-1">({s.class_name})</span></span>
                                        <span className="text-primary">{s.coverage_percentage}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                                        <div className={`h-full transition-all duration-1000 ${s.coverage_percentage > 80 ? 'bg-success' : s.coverage_percentage > 50 ? 'bg-primary' : 'bg-error'}`} style={{ width: `${s.coverage_percentage}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademicSummary;

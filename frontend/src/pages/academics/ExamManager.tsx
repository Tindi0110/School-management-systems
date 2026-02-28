import React from 'react';
import { ClipboardCheck, Calendar, Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button';

interface ExamManagerProps {
    exams: any[];
    searchTerm: string;
    openCreateExam: () => void;
    openEditExam: (exam: any) => void;
    handleDeleteExam: (id: number) => void;
    openEnterResults: (exam: any) => void;
    openViewResults: (exam: any) => void;
}

const ExamManager: React.FC<ExamManagerProps> = ({
    exams,
    searchTerm,
    openCreateExam,
    openEditExam,
    handleDeleteExam,
    openEnterResults,
    openViewResults
}) => {
    return (
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
            {exams.filter(exam =>
                !searchTerm ||
                exam.name.toLowerCase().includes(searchTerm.toLowerCase())
            ).map(exam => (
                <div key={exam.id} className="col-span-12 md:col-span-6 lg:col-span-4 min-w-0">
                    <div className="card h-full flex flex-col p-6 overflow-hidden hover:shadow-2xl transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600"><ClipboardCheck size={16} /></div>
                            <span className={`badge ${exam.is_active ? 'badge-success' : 'badge-ghost text-slate-400'} badge-xs font-black uppercase tracking-widest`}>
                                {exam.is_active ? 'ACTIVE' : 'CLOSED'}
                            </span>
                        </div>
                        <h3 className="mb-0 text-sm font-black uppercase text-slate-800">{exam.name}</h3>
                        <p className="text-[10px] font-bold text-secondary-soft mt-1 uppercase tracking-tight flex items-center gap-1">
                            <Calendar size={10} /> {exam.term_name || 'Active Term'} • {exam.academic_year_name}
                        </p>

                        <div className="card-body p-0 mt-6 space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group cursor-pointer hover:bg-white hover:border-primary transition-all shadow-sm active:scale-95" onClick={() => openEnterResults(exam)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors"><Plus size={14} /></div>
                                    <span className="text-[10px] font-black uppercase text-slate-600">Enter Student Results</span>
                                </div>
                                <ArrowRight size={14} className="text-slate-300 transform translate-x-0 group-hover:translate-x-1 transition-transform" />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group cursor-pointer hover:bg-white hover:border-success transition-all shadow-sm active:scale-95" onClick={() => openViewResults(exam)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center group-hover:bg-success group-hover:text-white transition-colors"><ArrowRight size={14} /></div>
                                    <span className="text-[10px] font-black uppercase text-slate-600">View Rankings & Reports</span>
                                </div>
                                <ArrowRight size={14} className="text-slate-300 transform translate-x-0 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                            <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest">Modified: {new Date(exam.date_start).toLocaleDateString()}</span>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="sm" className="p-2 text-primary hover:bg-primary-light/10" onClick={() => openEditExam(exam)} icon={<Edit size={10} />} />
                                <Button variant="ghost" size="sm" className="p-2 text-error hover:bg-error-light/10" onClick={() => handleDeleteExam(exam.id)} icon={<Trash2 size={10} />} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <div className="col-span-12 md:col-span-6 lg:col-span-4 min-w-0">
                <div className="card h-full border-dashed flex flex-col items-center justify-center p-8 cursor-pointer hover:border-primary group transition-all" onClick={openCreateExam}>
                    <Plus size={32} className="text-secondary group-hover:text-primary transition-all mb-2" />
                    <span className="text-xs font-black uppercase tracking-widest text-secondary group-hover:text-primary">Create New Exam</span>
                </div>
            </div>
        </div>
    );
};

export default ExamManager;

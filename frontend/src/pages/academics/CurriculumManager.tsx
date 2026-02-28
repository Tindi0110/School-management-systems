import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';

interface CurriculumManagerProps {
    subjectGroups: any[];
    subjects: any[];
    syllabusData: any[];
    classes: any[];
    isReadOnly: boolean;
    setEditingGroupId: (id: number | null) => void;
    setGroupForm: (form: any) => void;
    setIsGroupModalOpen: (val: boolean) => void;
    openEditGroup: (group: any) => void;
    handleDeleteGroup: (id: number) => void;
    setIsSubjectModalOpen: (val: boolean) => void;
    openEditSubject: (subject: any) => void;
    handleDeleteSubject: (id: number) => void;
    setEditingSyllabusId: (id: number | null) => void;
    setIsSyllabusModalOpen: (val: boolean) => void;
    setSyllabusForm: (form: any) => void;
    handleDeleteSyllabus: (id: number) => void;
}

const CurriculumManager: React.FC<CurriculumManagerProps> = ({
    subjectGroups,
    subjects,
    syllabusData,
    classes,
    isReadOnly,
    setEditingGroupId,
    setGroupForm,
    setIsGroupModalOpen,
    openEditGroup,
    handleDeleteGroup,
    setIsSubjectModalOpen,
    openEditSubject,
    handleDeleteSubject,
    setEditingSyllabusId,
    setIsSyllabusModalOpen,
    setSyllabusForm,
    handleDeleteSyllabus
}) => {
    return (
        <div className="grid grid-cols-12 gap-6 lg:gap-8 min-w-0">
            <div className="col-span-12 lg:col-span-3 space-y-4 min-w-0">
                <div className="card card-mobile-flat p-0 overflow-hidden">
                    <div className="card-header">
                        <h3 className="mb-0 text-sm font-black uppercase">Subject Groups</h3>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingGroupId(null); setGroupForm({ name: '' }); setIsGroupModalOpen(true); }} icon={<Plus size={14} />} />
                    </div>
                    <div className="card-body p-4">
                        {subjectGroups.map(g => (
                            <div key={g.id} className="flex justify-between items-center p-2 rounded hover:bg-secondary-light text-[11px] font-bold border border-transparent hover:border-secondary transition-all group">
                                <span>{g.name}</span>
                                <div className="flex gap-1 opacity-30 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" className="text-primary p-1 h-6 w-6" onClick={() => openEditGroup(g)} title="Edit Subject Group" icon={<Edit size={12} />} />
                                    <Button variant="ghost" size="sm" className="text-error p-1 h-6 w-6" onClick={() => handleDeleteGroup(g.id)} title="Delete Subject Group" icon={<Trash2 size={12} />} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="col-span-12 lg:col-span-9 min-w-0 fade-in card card-mobile-flat p-0 overflow-hidden">
                <div className="card-header">
                    <h3 className="mb-0 text-sm font-black uppercase">Institutional Curriculum</h3>
                    <Button variant="primary" size="sm" className="ml-auto" onClick={() => setIsSubjectModalOpen(true)} icon={<Plus size={14} />}>New Subject</Button>
                </div>
                <div className="p-0">
                    <div className="table-wrapper overflow-x-auto w-full block m-0">
                        <table className="table min-w-[800px] relative">
                            <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm text-[10px] uppercase">
                                <tr>
                                    <th className="py-4 px-6 min-w-[150px]">Subject Name</th>
                                    <th className="py-4 px-6 min-w-[100px]">Code</th>
                                    <th className="py-4 px-6 min-w-[150px]">Subject Group</th>
                                    <th className="py-4 px-6 min-w-[100px]">Type</th>
                                    <th className="py-4 px-6 min-w-[100px] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {subjects.map((s: any) => (
                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors group border-b border-slate-100">
                                        <td className="py-4 px-6 font-bold">{s.name}</td>
                                        <td className="py-4 px-6 font-mono text-[10px]">{s.code}</td>
                                        <td className="py-4 px-6">{s.group_name || '-'}</td>
                                        <td className="py-4 px-6"><span className={`badge badge-sm font-bold ${s.is_core ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>{s.is_core ? 'CORE' : 'ELECTIVE'}</span></td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" className="text-primary hover:bg-white p-1" onClick={() => openEditSubject(s)} title="Edit Subject"><Edit size={12} /></Button>
                                                <Button variant="ghost" size="sm" className="text-error hover:bg-white p-1" onClick={() => handleDeleteSubject(s.id)} title="Delete Subject"><Trash2 size={12} /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {subjects.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center p-8 text-secondary italic">No subjects added. Select "New Subject" to manage the curriculum.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Syllabus Tracking */}
            <div className="col-span-12 space-y-6 lg:space-y-8 fade-in mt-8 min-w-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 px-2">
                    <h3 className="text-lg font-black text-slate-800 uppercase mb-0 tracking-wider">Syllabus Tracking</h3>
                    {!isReadOnly && (
                        <Button variant="primary" size="sm" className="w-full md:w-auto font-black shadow-lg" onClick={() => { setEditingSyllabusId(null); setIsSyllabusModalOpen(true); }} icon={<Plus size={14} />}>RECORD COVERAGE</Button>
                    )}
                </div>

                <div className="fade-in card card-mobile-flat p-0 overflow-hidden min-w-0">
                    <div className="card-header">
                        <h3 className="mb-0 text-sm font-black uppercase">Curriculum Progress</h3>
                    </div>
                    <div className="p-0">
                        <div className="table-wrapper overflow-x-auto w-full block">
                            <table className="table table-sm min-w-[800px] relative">
                                <thead className="bg-secondary-light/30 text-secondary">
                                    <tr>
                                        <th className="min-w-[150px]">Subject</th>
                                        <th className="min-w-[120px]">Class / Stream</th>
                                        <th className="min-w-[80px]">Coverage</th>
                                        <th className="min-w-[200px]">Progress</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {syllabusData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center p-8 text-secondary text-xs uppercase font-bold italic">No syllabus records found</td>
                                        </tr>
                                    ) : (
                                        syllabusData.map((s: any) => {
                                            const cls = classes.find((c: any) => c.id === s.class_grade);
                                            const sub = subjects.find((sub: any) => sub.id === s.subject);
                                            return (
                                                <tr key={s.id} className="hover:bg-blue-50/50 transition-colors">
                                                    <td className="font-bold text-xs">{sub?.name || 'Unknown'}</td>
                                                    <td className="text-xs text-secondary-dark font-medium">{cls ? `${cls.name} ${cls.stream}` : 'Unknown'}</td>
                                                    <td className="py-4 px-6 font-mono text-xs text-primary font-black">{s.coverage_percentage}%</td>
                                                    <td className="py-4 px-6">
                                                        <progress className={`progress w-full h-2 ${s.coverage_percentage > 80 ? 'progress-success' : s.coverage_percentage > 40 ? 'progress-warning' : 'progress-error'}`} value={s.coverage_percentage} max="100"></progress>
                                                    </td>
                                                    <td className="text-right">
                                                        {!isReadOnly && (
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10" onClick={() => {
                                                                    const clsMatched = classes.find(c => c.id === s.class_grade);
                                                                    setSyllabusForm({
                                                                        subject: s.subject.toString(),
                                                                        level: clsMatched?.name || '',
                                                                        class_grade: s.class_grade.toString(),
                                                                        coverage_percentage: s.coverage_percentage
                                                                    });
                                                                    setEditingSyllabusId(s.id);
                                                                    setIsSyllabusModalOpen(true);
                                                                }} icon={<Edit size={12} />} />
                                                                <Button variant="ghost" size="sm" className="text-error hover:bg-error/10" onClick={() => handleDeleteSyllabus(s.id)} icon={<Trash2 size={12} />} />
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CurriculumManager;

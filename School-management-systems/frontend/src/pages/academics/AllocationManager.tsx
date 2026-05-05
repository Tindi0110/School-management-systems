import React from 'react';
import { Layers } from 'lucide-react';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/SearchableSelect';

interface AllocationManagerProps {
    classes: any[];
    subjects: any[];
    staff: any[];
    selectedAllocationClass: string;
    classAllocations: any[];
    isSyncing: boolean;
    setSelectedAllocationClass: (id: string) => void;
    fetchClassAllocations: (id: string) => void;
    syncClassSubjects: () => void;
    toggleClassSubject: (subjectId: number, allocationId?: number) => void;
    updateAllocationTeacher: (allocationId: number, teacherId: string) => void;
}

const AllocationManager: React.FC<AllocationManagerProps> = ({
    classes,
    subjects,
    staff,
    selectedAllocationClass,
    classAllocations,
    isSyncing,
    setSelectedAllocationClass,
    fetchClassAllocations,
    syncClassSubjects,
    toggleClassSubject,
    updateAllocationTeacher
}) => {
    return (
        <div className="grid grid-cols-12 gap-6 lg:gap-8 min-h-[60vh]">
            <div className="col-span-12 lg:col-span-3 min-w-0 flex flex-col gap-4 overflow-y-auto pr-2">
                <h3 className="text-xs font-black uppercase mb-0 tracking-widest text-slate-400">Select Class</h3>
                <div className="space-y-2">
                    {classes.map(c => (
                        <div
                            key={c.id}
                            className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedAllocationClass === c.id.toString() ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 hover:border-primary/30 text-slate-600'}`}
                            onClick={() => { setSelectedAllocationClass(c.id.toString()); fetchClassAllocations(c.id.toString()); }}
                        >
                            <div className="font-black text-[11px] uppercase tracking-wider">{c.name} {c.stream}</div>
                            <div className={`text-[10px] font-bold mt-1 ${selectedAllocationClass === c.id.toString() ? 'text-white/60' : 'text-slate-400'}`}>{c.student_count} Students</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="col-span-12 lg:col-span-9 min-w-0 flex flex-col">
                {selectedAllocationClass ? (
                    <div className="card h-full flex flex-col min-w-0 overflow-hidden">
                        <div className="card-header">
                            <div>
                                <h3 className="mb-0 text-sm font-black uppercase">Class Subjects</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Manage subjects taught in this class</p>
                            </div>
                            <Button variant="primary" size="sm" className="font-black" onClick={syncClassSubjects} loading={isSyncing} loadingText="Syncing...">
                                Sync to Students
                            </Button>
                        </div>
                        <div className="p-0 table-wrapper overflow-x-auto overflow-y-auto w-full block flex-1 m-0">
                            <table className="table min-w-[600px] border-collapse">
                                <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm text-[10px] uppercase">
                                    <tr>
                                        <th className="py-4 px-6 w-20">Active</th>
                                        <th className="py-4 px-6 text-left">Subject Name</th>
                                        <th className="py-4 px-6">Code</th>
                                        <th className="py-4 px-6">Group</th>
                                        <th className="py-4 px-6 text-left">Assigned Teacher</th>
                                        <th className="py-4 px-6">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {subjects.map(subject => {
                                        const allocation = classAllocations.find(a => a.subject === subject.id);
                                        const isAllocated = !!allocation;
                                        return (
                                            <tr key={subject.id} className={`hover:bg-slate-50 transition-colors ${isAllocated ? 'bg-success/5' : ''}`}>
                                                <td className="py-4 px-6 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-sm"
                                                        checked={isAllocated}
                                                        onChange={() => toggleClassSubject(subject.id, allocation?.id)}
                                                    />
                                                </td>
                                                <td className="py-4 px-6 font-bold text-xs">{subject.name}</td>
                                                <td className="py-4 px-6"><code className="bg-slate-100 px-2 py-1 rounded text-[10px]">{subject.code}</code></td>
                                                <td className="py-4 px-6 text-[10px] uppercase font-bold text-slate-400">{(subject as any).category || (subject as any).group_name || '-'}</td>
                                                <td className="py-4 px-6 min-w-[200px]">
                                                    {isAllocated ? (
                                                        <SearchableSelect
                                                            placeholder="Assign Teacher..."
                                                            options={staff.filter(s => s.role === 'TEACHER' || s.role === 'STAFF').map(s => ({ id: (s.user || s.id).toString(), label: s.full_name }))}
                                                            value={allocation?.teacher?.toString() || ''}
                                                            onChange={(val) => updateAllocationTeacher(allocation.id, val.toString())}
                                                        />
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300 italic">Select subject first</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {isAllocated ?
                                                        <span className="badge badge-success text-[9px] font-black">ALLOCATED</span> :
                                                        <span className="badge badge-ghost text-[9px] font-black opacity-40">AVAILABLE</span>
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="card h-full flex flex-col items-center justify-center text-slate-300">
                        <Layers size={48} className="mb-4 opacity-20" />
                        <p className="font-black uppercase tracking-widest text-[11px]">Select a class to manage allocations</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllocationManager;

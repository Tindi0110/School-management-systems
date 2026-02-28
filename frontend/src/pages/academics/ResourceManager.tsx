import React from 'react';
import { Plus, Edit, Trash2, CheckSquare } from 'lucide-react';
import Button from '../../components/common/Button';

interface ResourceManagerProps {
    academicYears: any[];
    terms: any[];
    gradeSystems: any[];
    selectedSystem: any;
    setSelectedSystem: (val: any) => void;
    setBoundaryForm: (val: any) => void;
    setIsGradeModalOpen: (val: boolean) => void;
    handleSetActiveYear: (year: any) => void;
    handleSetActiveTerm: (term: any) => void;
    openEditYear: (year: any) => void;
    handleDeleteYear: (id: number) => void;
    setIsYearModalOpen: (val: boolean) => void;
    setTermForm: (val: any) => void;
    setEditingTermId: (id: number | null) => void;
    setIsTermModalOpen: (val: boolean) => void;
    openEditTerm: (term: any) => void;
    handleDeleteTerm: (id: number) => void;
    openEditGradeSystem: (gs: any) => void;
    handleDeleteGradeSystem: (id: number) => void;
    setIsBoundaryModalOpen: (val: boolean) => void;
    academicsAPI: any;
    success: (msg: string) => void;
    loadAllAcademicData: () => void;
}

const ResourceManager: React.FC<ResourceManagerProps> = ({
    academicYears,
    terms,
    gradeSystems,
    selectedSystem,
    setSelectedSystem,
    setBoundaryForm,
    setIsGradeModalOpen,
    handleSetActiveYear,
    handleSetActiveTerm,
    openEditYear,
    handleDeleteYear,
    setIsYearModalOpen,
    setTermForm,
    setEditingTermId,
    setIsTermModalOpen,
    openEditTerm,
    handleDeleteTerm,
    openEditGradeSystem,
    handleDeleteGradeSystem,
    setIsBoundaryModalOpen,
    academicsAPI,
    success,
    loadAllAcademicData
}) => {
    return (
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
            <div className="col-span-12 lg:col-span-8 min-w-0 flex flex-col gap-6">
                {/* Grading Systems Section */}
                <div className="card p-0 overflow-hidden shadow-xl border-none">
                    <div className="card-header bg-slate-900 text-white">
                        <h3 className="mb-0 text-sm font-black uppercase tracking-wider">Institutional Grading</h3>
                        <Button variant="primary" size="sm" className="font-black px-4 bg-white text-slate-900 border-none hover:bg-slate-100" onClick={() => setIsGradeModalOpen(true)} icon={<Plus size={14} />}>NEW SYSTEM</Button>
                    </div>
                    <div className="card-body p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gradeSystems.map(gs => (
                            <div
                                key={gs.id}
                                className={`p-4 rounded-xl border transition-all cursor-pointer group ${selectedSystem?.id === gs.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-slate-100 hover:border-primary/30 text-slate-600'}`}
                                onClick={() => {
                                    setSelectedSystem(gs);
                                    setBoundaryForm((prev: any) => ({ ...prev, system: gs.id }));
                                }}
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-[11px] uppercase tracking-wider">{gs.name}</span>
                                        {gs.is_default && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${selectedSystem?.id === gs.id ? 'bg-white/20 text-white' : 'bg-success/20 text-success'}`}>DEFAULT</span>}
                                    </div>
                                    <div className="flex gap-1 opacity-100 items-center">
                                        <Button variant="ghost" size="sm" className={`p-1 ${selectedSystem?.id === gs.id ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-primary'}`} title="Edit System" onClick={(e) => {
                                            e.stopPropagation();
                                            openEditGradeSystem(gs);
                                        }} icon={<Edit size={12} />} />
                                        <Button variant="ghost" size="sm" className={`p-1 ${selectedSystem?.id === gs.id ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-primary'}`} title="Add Boundary" onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedSystem(gs);
                                            setBoundaryForm((prev: any) => ({ ...prev, system: gs.id }));
                                            setIsBoundaryModalOpen(true);
                                        }} icon={<Plus size={14} />} />
                                        <Button variant="ghost" size="sm" className={`p-1 ${selectedSystem?.id === gs.id ? 'text-white/60 hover:text-error' : 'text-slate-400 hover:text-error'}`} title="Delete System" onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteGradeSystem(gs.id);
                                        }} icon={<Trash2 size={12} />} />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {gs.boundaries?.slice(0, 6).sort((a: any, b: any) => b.min_score - a.min_score).map((b: any) => (
                                        <div key={b.id} className={`flex items-baseline gap-1 px-2 py-1 rounded-lg border ${selectedSystem?.id === gs.id ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                                            <span className={`text-[11px] font-black ${selectedSystem?.id === gs.id ? 'text-white' : 'text-slate-700'}`}>{b.grade}</span>
                                            <span className={`text-[9px] font-bold ${selectedSystem?.id === gs.id ? 'text-white/70' : 'text-slate-400'}`}>{b.min_score}+</span>
                                        </div>
                                    ))}
                                    {gs.boundaries && gs.boundaries.length > 6 && <span className="text-[10px] font-black px-2 py-1 flex items-center text-slate-400">+{gs.boundaries.length - 6} more</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Boundaries Table (Shown when a system is selected) */}
                {selectedSystem && (
                    <div className="card p-0 overflow-hidden shadow-2xl border-slate-100 fade-in">
                        <div className="card-header bg-slate-50 border-bottom">
                            <div>
                                <h3 className="mb-0 text-xs font-black uppercase text-slate-800 tracking-widest">{selectedSystem.name} Scale</h3>
                            </div>
                            <div className="flex gap-2">
                                {!selectedSystem.is_default && (
                                    <Button variant="outline" size="sm" className="font-black text-[10px]" onClick={async () => {
                                        try {
                                            await academicsAPI.gradeSystems.update(selectedSystem.id, { is_default: true });
                                            success('System set as default');
                                            loadAllAcademicData();
                                        } catch (err: any) { console.error(err); }
                                    }}>SET AS DEFAULT</Button>
                                )}
                            </div>
                        </div>
                        <div className="table-wrapper overflow-x-auto w-full block m-0">
                            <table className="table min-w-[600px]">
                                <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400">
                                    <tr>
                                        <th className="py-4 px-6 text-left">Grade</th>
                                        <th className="py-4 px-6">Score Range</th>
                                        <th className="py-4 px-6 text-center">Points</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedSystem.boundaries?.sort((a: any, b: any) => b.min_score - a.min_score).map((b: any) => (
                                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 font-black text-slate-900">{b.grade}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[11px] font-black px-2 py-1 bg-slate-100 rounded text-slate-600">{b.min_score}</span>
                                                    <span className="text-slate-300">→</span>
                                                    <span className="font-mono text-[11px] font-black px-2 py-1 bg-slate-100 rounded text-slate-600">{b.max_score}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center font-black text-primary">{b.points}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="sm" className="text-primary" onClick={() => { setBoundaryForm({ ...b, system: selectedSystem.id }); setIsBoundaryModalOpen(true); }} icon={<Edit size={14} />} />
                                                    <Button variant="ghost" size="sm" className="text-error" onClick={() => {/* Handle delete */ }} icon={<Trash2 size={14} />} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <div className="col-span-12 lg:col-span-4 min-w-0">
                <div className="card p-0 overflow-hidden shadow-xl border-slate-100 sticky top-4">
                    <div className="card-header bg-slate-50 border-bottom">
                        <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-slate-800">Cycles & Terms</h3>
                        <Button variant="outline" size="sm" className="p-2 border-slate-200" onClick={() => setIsYearModalOpen(true)} icon={<Plus size={14} />} />
                    </div>
                    <div className="card-body p-4 space-y-4">
                        {academicYears.map(y => (
                            <div key={y.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-white transition-all group">
                                <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <button
                                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${y.is_active ? 'bg-success text-white shadow-lg shadow-success/30' : 'bg-slate-100 text-slate-400 hover:bg-success/10 hover:text-success'}`}
                                            onClick={() => handleSetActiveYear(y)}
                                            title={y.is_active ? "This is the CURRENT Active Cycle" : "Click to set as Active Cycle"}
                                        >
                                            {y.is_active ? <CheckSquare size={18} /> : null}
                                        </button>
                                        <div>
                                            <span className="block font-black text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Academic Cycle</span>
                                            <span className="block font-black text-sm text-slate-800">{y.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200" onClick={() => { setTermForm({ year: y.id.toString(), name: '', start_date: '', end_date: '', is_active: false }); setEditingTermId(null); setIsTermModalOpen(true); }} icon={<Plus size={14} />} title="Add Term" />
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-primary" onClick={() => openEditYear(y)} icon={<Edit size={14} />} title="Edit Year" />
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-error" onClick={() => handleDeleteYear(y.id)} icon={<Trash2 size={14} />} title="Delete Year" />
                                    </div>
                                </div>
                                <div className="space-y-2 mt-2">
                                    <div className="flex items-center justify-between px-1 mb-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Enrolled Terms</span>
                                        <span className="text-[9px] font-black text-slate-300">{terms.filter(t => t.year === y.id).length} Active</span>
                                    </div>
                                    {terms.filter(t => t.year === y.id).map(t => (
                                        <div key={t.id} className="flex justify-between items-center text-[10px] bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:border-primary/20 transition-all group/term relative">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className={`transition-colors ${t.is_active ? 'text-success' : 'text-slate-300 hover:text-primary'}`}
                                                    onClick={() => handleSetActiveTerm(t)}
                                                    title={t.is_active ? "Current Active Term" : "Set as Active"}
                                                >
                                                    {t.is_active ? <CheckSquare size={14} /> : null}
                                                </button>
                                                <span className="font-bold text-slate-600 uppercase">{t.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="absolute right-3 flex gap-1 bg-white opacity-0 group-hover/term:opacity-100 transition-opacity pl-2 shadow-[-8px_0_8px_white]">
                                                    <Button variant="ghost" size="sm" className="text-primary p-1" onClick={() => openEditTerm(t)} icon={<Edit size={12} />} title="Edit Term" />
                                                    <Button variant="ghost" size="sm" className="text-error p-1" onClick={() => handleDeleteTerm(t.id)} icon={<Trash2 size={12} />} title="Delete Term" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceManager;

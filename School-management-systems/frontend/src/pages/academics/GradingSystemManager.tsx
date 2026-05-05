import React from 'react';
import { Plus, Edit, Trash2, Layers } from 'lucide-react';
import Button from '../../components/common/Button';

interface GradingSystemManagerProps {
    gradeSystems: any[];
    selectedSystem: any;
    setSelectedSystem: (sys: any) => void;
    setBoundaryForm: (form: any) => void;
    setIsGradeModalOpen: (val: boolean) => void;
    openEditGradeSystem: (sys: any) => void;
    handleDeleteGradeSystem: (id: number) => void;
    setIsBoundaryModalOpen: (val: boolean) => void;
    setEditingBoundaryId: (id: number | null) => void;
    handleDeleteBoundary: (id: number) => void;
}

const GradingSystemManager: React.FC<GradingSystemManagerProps> = ({
    gradeSystems,
    selectedSystem,
    setSelectedSystem,
    setBoundaryForm,
    setIsGradeModalOpen,
    openEditGradeSystem,
    handleDeleteGradeSystem,
    setIsBoundaryModalOpen,
    setEditingBoundaryId,
    handleDeleteBoundary
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg min-h-[60vh]">
            {/* Left: Systems List */}
            <div className="card md:col-span-1 min-w-0 flex flex-col">
                <div className="card-header flex justify-between items-center py-3 border-bottom">
                    <h3 className="mb-0 text-sm font-black uppercase">Grading Systems</h3>
                    <Button variant="primary" size="sm" onClick={() => setIsGradeModalOpen(true)} icon={<Plus size={12} />}>New System</Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {gradeSystems.map(sys => (
                        <div
                            key={sys.id}
                            onClick={() => { setSelectedSystem(sys); setBoundaryForm({ system: sys.id, grade: '', min_score: 0, max_score: 100, points: 0, remarks: '' }); }}
                            className={`p-3 rounded border cursor-pointer transition-all hover:shadow-md ${selectedSystem?.id === sys.id ? 'bg-primary-light border-primary' : 'bg-white hover:bg-gray-50'}`}
                        >
                            <div className="flex justify-between items-center group/grad">
                                <div className="flex flex-col">
                                    <span className="font-bold text-xs">{sys.name}</span>
                                    <div className="text-[10px] text-secondary mt-1">{sys.boundaries?.length || 0} Grade Boundaries</div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/grad:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); openEditGradeSystem(sys); }} className="p-1.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-primary transition-all"><Edit size={10} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteGradeSystem(sys.id); }} className="p-1.5 rounded bg-slate-100 text-slate-500 hover:bg-error-light hover:text-error transition-all"><Trash2 size={10} /></button>
                                </div>
                            </div>
                            {sys.is_default && <span className="badge badge-success text-[8px] mt-2">DEFAULT</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Boundaries Table */}
            <div className="card md:col-span-2 min-w-0 flex flex-col">
                {selectedSystem ? (
                    <>
                        <div className="card-header flex justify-between items-center py-3 border-bottom bg-gray-50">
                            <div>
                                <h3 className="mb-0 text-sm font-black uppercase">{selectedSystem.name}</h3>
                                <p className="text-[10px] text-secondary mb-0">Define grade ranges (High to Low)</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => { setBoundaryForm({ system: selectedSystem.id, grade: '', min_score: 0, max_score: 100, points: 0, remarks: '' }); setEditingBoundaryId(null); setIsBoundaryModalOpen(true); }} icon={<Plus size={12} />}>
                                Add Boundary
                            </Button>
                        </div>
                        <div className="flex-1 table-wrapper overflow-x-auto w-full block p-0 min-w-0">
                            <table className="table table-sm min-w-[600px]">
                                <thead className="sticky top-0 bg-white z-10 shadow-sm text-[10px] uppercase">
                                    <tr>
                                        <th>Grade</th>
                                        <th>Range (Min-Max)</th>
                                        <th>Points</th>
                                        <th>Remarks</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSystem.boundaries?.sort((a: any, b: any) => b.min_score - a.min_score).map((b: any) => (
                                        <tr key={b.id} className="hover:bg-gray-50 text-xs">
                                            <td className="font-black">{b.grade}</td>
                                            <td>{b.min_score} - {b.max_score}</td>
                                            <td>{b.points}</td>
                                            <td className="text-secondary">{b.remarks}</td>
                                            <td className="text-right flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" className="p-1" onClick={() => { setBoundaryForm({ ...b, system: selectedSystem.id }); setEditingBoundaryId(b.id); setIsBoundaryModalOpen(true); }} icon={<Edit size={12} />} />
                                                <Button variant="ghost" size="sm" className="p-1 text-error" onClick={() => handleDeleteBoundary(b.id)} icon={<Trash2 size={12} />} />
                                            </td>
                                        </tr>
                                    ))}
                                    {(!selectedSystem.boundaries || selectedSystem.boundaries.length === 0) && (
                                        <tr><td colSpan={5} className="text-center p-8 text-secondary italic">No boundaries defined yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-secondary opacity-50">
                        <Layers size={48} className="mb-2" />
                        <p className="text-sm font-bold">Select a Grading System to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GradingSystemManager;

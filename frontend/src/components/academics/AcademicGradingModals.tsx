import React from 'react';
import Modal from '../Modal';
import Button from '../common/Button';

interface GradeSystemModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingSystemId: number | null;
    gradeForm: { name: string; is_default: boolean };
    setGradeForm: (form: any) => void;
    handleGradeSystemSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

export const GradeSystemModal: React.FC<GradeSystemModalProps> = ({
    isOpen, onClose, editingSystemId, gradeForm, setGradeForm, handleGradeSystemSubmit, isSubmitting
}) => (
    <Modal isOpen={isOpen} onClose={onClose} title={editingSystemId ? "Edit Grading System" : "New Grading System"}>
        <form onSubmit={handleGradeSystemSubmit} className="form-container-md mx-auto">
            <div className="form-group mb-4">
                <label className="label text-[10px] font-black uppercase">System Name</label>
                <input
                    type="text"
                    className="input"
                    placeholder="e.g. KNEC Standard"
                    value={gradeForm.name}
                    onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })}
                    required
                />
            </div>
            <div className="form-group mb-4 flex items-center gap-2">
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={gradeForm.is_default}
                    onChange={(e) => setGradeForm({ ...gradeForm, is_default: e.target.checked })}
                />
                <label className="label text-[10px] font-black uppercase mb-0">Set as Default System</label>
            </div>
            <Button
                type="submit"
                variant="primary"
                className="w-full font-black uppercase"
                loading={isSubmitting}
                loadingText="Saving..."
            >
                Save System
            </Button>
        </form>
    </Modal>
);

interface BoundaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingBoundaryId: number | null;
    boundaryForm: { grade: string; points: number; min_score: number; max_score: number; remarks: string };
    setBoundaryForm: (form: any) => void;
    handleBoundarySubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

export const BoundaryModal: React.FC<BoundaryModalProps> = ({
    isOpen, onClose, editingBoundaryId, boundaryForm, setBoundaryForm, handleBoundarySubmit, isSubmitting
}) => (
    <Modal isOpen={isOpen} onClose={onClose} title={editingBoundaryId ? "Edit Grade Boundary" : "Add Grade Boundary"}>
        <form onSubmit={handleBoundarySubmit} className="form-container-md mx-auto space-y-4 px-1">
            <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="label text-[10px] font-black uppercase">Grade Symbol</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="e.g. A"
                        value={boundaryForm.grade}
                        onChange={(e) => setBoundaryForm({ ...boundaryForm, grade: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="label text-[10px] font-black uppercase">Points</label>
                    <input
                        type="number"
                        className="input"
                        placeholder="12"
                        value={boundaryForm.points}
                        onChange={(e) => setBoundaryForm({ ...boundaryForm, points: parseInt(e.target.value) })}
                        required
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="label text-[10px] font-black uppercase">Min Score</label>
                    <input
                        type="number"
                        className="input"
                        value={boundaryForm.min_score}
                        onChange={(e) => setBoundaryForm({ ...boundaryForm, min_score: parseInt(e.target.value) })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="label text-[10px] font-black uppercase">Max Score</label>
                    <input
                        type="number"
                        className="input"
                        value={boundaryForm.max_score}
                        onChange={(e) => setBoundaryForm({ ...boundaryForm, max_score: parseInt(e.target.value) })}
                        required
                    />
                </div>
            </div>
            <div className="form-group">
                <label className="label text-[10px] font-black uppercase">Remarks</label>
                <input
                    type="text"
                    className="input"
                    placeholder="Excellent"
                    value={boundaryForm.remarks}
                    onChange={(e) => setBoundaryForm({ ...boundaryForm, remarks: e.target.value })}
                />
            </div>
            <Button
                type="submit"
                variant="primary"
                className="w-full font-black uppercase"
                loading={isSubmitting}
                loadingText="Saving..."
            >
                Save Boundary
            </Button>
        </form>
    </Modal>
);

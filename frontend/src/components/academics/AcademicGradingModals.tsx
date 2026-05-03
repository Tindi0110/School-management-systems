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
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={editingSystemId ? "Edit Grading System" : "New Grading System"}
        footer={
            <>
                <button type="button" className="modern-btn modern-btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" form="grade-system-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "SAVING..." : "SAVE SYSTEM"}
                </button>
            </>
        }
    >
        <form id="grade-system-form" onSubmit={handleGradeSystemSubmit} className="space-y-6">
            <div className="form-group">
                <label>System Name</label>
                <input
                    type="text"
                    placeholder="e.g. KNEC Standard"
                    value={gradeForm.name}
                    onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })}
                    required
                />
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <input
                    type="checkbox"
                    className="checkbox"
                    checked={gradeForm.is_default}
                    onChange={(e) => setGradeForm({ ...gradeForm, is_default: e.target.checked })}
                />
                <label className="text-xs font-bold text-slate-700">Set as Default System</label>
            </div>
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
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={editingBoundaryId ? "Edit Grade Boundary" : "Add Grade Boundary"}
        footer={
            <>
                <button type="button" className="modern-btn modern-btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" form="boundary-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "SAVING..." : "SAVE BOUNDARY"}
                </button>
            </>
        }
    >
        <form id="boundary-form" onSubmit={handleBoundarySubmit} className="space-y-6">
            <div className="form-grid">
                <div className="form-group">
                    <label>Grade Symbol</label>
                    <input
                        type="text"
                        placeholder="e.g. A"
                        value={boundaryForm.grade}
                        onChange={(e) => setBoundaryForm({ ...boundaryForm, grade: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Points</label>
                    <input
                        type="number"
                        placeholder="12"
                        value={boundaryForm.points}
                        onChange={(e) => setBoundaryForm({ ...boundaryForm, points: parseInt(e.target.value) })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Min Score</label>
                    <input
                        type="number"
                        value={boundaryForm.min_score}
                        onChange={(e) => setBoundaryForm({ ...boundaryForm, min_score: parseInt(e.target.value) })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Max Score</label>
                    <input
                        type="number"
                        value={boundaryForm.max_score}
                        onChange={(e) => setBoundaryForm({ ...boundaryForm, max_score: parseInt(e.target.value) })}
                        required
                    />
                </div>
                <div className="form-group col-span-2">
                    <label>Remarks</label>
                    <input
                        type="text"
                        placeholder="e.g. Excellent"
                        value={boundaryForm.remarks}
                        onChange={(e) => setBoundaryForm({ ...boundaryForm, remarks: e.target.value })}
                    />
                </div>
            </div>
        </form>
    </Modal>
);

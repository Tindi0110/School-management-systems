import React from 'react';
import Modal from '../Modal';
import SearchableSelect from '../SearchableSelect';
import PremiumDateInput from '../common/DatePicker';
import type { AcademicYear } from '../../types/academic.types';

interface YearModalProps {
    isOpen: boolean;
    onClose: () => void;
    yearForm: { name: string; is_active: boolean };
    setYearForm: (form: any) => void;
    handleYearSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

export const YearModal: React.FC<YearModalProps> = ({
    isOpen, onClose, yearForm, setYearForm, handleYearSubmit, isSubmitting
}) => (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Add Academic Cycle"
        footer={
            <>
                <button type="button" className="modern-btn modern-btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" form="year-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "INITIALIZING..." : "INITIALIZE CYCLE"}
                </button>
            </>
        }
    >
        <form id="year-form" onSubmit={handleYearSubmit} className="space-y-6">
            <div className="form-group">
                <label>Year Name (e.g. 2026) *</label>
                <input
                    type="text"
                    value={yearForm.name}
                    onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                    required
                    placeholder="Enter academic year"
                />
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <input
                    type="checkbox"
                    className="checkbox"
                    checked={yearForm.is_active}
                    onChange={(e) => setYearForm({ ...yearForm, is_active: e.target.checked })}
                />
                <label className="text-xs font-bold text-slate-700">Set as Active Year</label>
            </div>
        </form>
    </Modal>
);

interface TermModalProps {
    isOpen: boolean;
    onClose: () => void;
    termForm: { year: string; name: string; start_date: string; end_date: string; is_active: boolean };
    setTermForm: (form: any) => void;
    handleTermSubmit: (e: React.FormEvent) => void;
    academicYears: AcademicYear[];
    isSubmitting: boolean;
}

export const TermModal: React.FC<TermModalProps> = ({
    isOpen, onClose, termForm, setTermForm, handleTermSubmit, academicYears, isSubmitting
}) => (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Configure Academic Term"
        footer={
            <>
                <button type="button" className="modern-btn modern-btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" form="term-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "SAVING..." : "SAVE CONFIGURATION"}
                </button>
            </>
        }
    >
        <form id="term-form" onSubmit={handleTermSubmit} className="space-y-6">
            <div className="form-grid">
                <div className="form-group col-span-2">
                    <label>Academic Year</label>
                    <SearchableSelect
                        options={academicYears.map(y => ({ id: y.id.toString(), label: y.name }))}
                        value={termForm.year}
                        onChange={(val) => setTermForm({ ...termForm, year: val.toString() })}
                        required
                    />
                </div>
                <div className="form-group col-span-2">
                    <label>Term Name (e.g. Term 1)</label>
                    <input
                        type="text"
                        value={termForm.name}
                        onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                        required
                        placeholder="Enter term name"
                    />
                </div>
                <div className="form-group">
                    <PremiumDateInput
                        label="Start Date"
                        value={termForm.start_date}
                        onChange={(val: string) => setTermForm({ ...termForm, start_date: val })}
                        required
                    />
                </div>
                <div className="form-group">
                    <PremiumDateInput
                        label="End Date"
                        value={termForm.end_date}
                        onChange={(val: string) => setTermForm({ ...termForm, end_date: val })}
                        required
                    />
                </div>
            </div>
        </form>
    </Modal>
);

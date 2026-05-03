import React from 'react';
import Modal from '../Modal';
import Button from '../common/Button';
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
    <Modal isOpen={isOpen} onClose={onClose} title="Add Academic Cycle">
        <form onSubmit={handleYearSubmit} className="space-y-4 form-container-sm mx-auto">
            <div className="form-group">
                <label className="label text-[10px] font-black uppercase">Year Name (e.g. 2026) *</label>
                <input
                    type="text"
                    className="input"
                    value={yearForm.name}
                    onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                    required
                />
            </div>
            <div className="form-group checkbox-group">
                <input
                    type="checkbox"
                    checked={yearForm.is_active}
                    onChange={(e) => setYearForm({ ...yearForm, is_active: e.target.checked })}
                />
                <label className="text-xs font-bold">Set as Active Year</label>
            </div>
            <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full mt-2 font-black uppercase"
                loading={isSubmitting}
                loadingText="Initializing..."
            >
                Initialize Year Cycle
            </Button>
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
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Academic Term">
        <form onSubmit={handleTermSubmit} className="space-y-4 form-container-md mx-auto">
            <div className="form-group">
                <label className="label text-[10px] font-black uppercase">Academic Year</label>
                <SearchableSelect
                    options={academicYears.map(y => ({ id: y.id.toString(), label: y.name }))}
                    value={termForm.year}
                    onChange={(val) => setTermForm({ ...termForm, year: val.toString() })}
                    required
                />
            </div>
            <div className="form-group">
                <label className="label text-[10px] font-black uppercase">Term Name (e.g. Term 1)</label>
                <input
                    type="text"
                    className="input"
                    value={termForm.name}
                    onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-md">
                <PremiumDateInput
                    label="Start Date"
                    value={termForm.start_date}
                    onChange={(val: string) => setTermForm({ ...termForm, start_date: val })}
                    minDate={new Date().toISOString().split('T')[0]}
                    required
                />
                <PremiumDateInput
                    label="End Date"
                    value={termForm.end_date}
                    onChange={(val: string) => setTermForm({ ...termForm, end_date: val })}
                    minDate={termForm.start_date || new Date().toISOString().split('T')[0]}
                    required
                />
            </div>
            <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full mt-2 font-black uppercase"
                loading={isSubmitting}
                loadingText="Saving..."
            >
                Save Term Configuration
            </Button>
        </form>
    </Modal>
);

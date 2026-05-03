import React from 'react';
import Modal from '../Modal';
import Button from '../common/Button';
import { Download, Printer, FileText, BarChart3 } from 'lucide-react';
import { exportToCSV } from '../../utils/export';

interface ViewClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedClass: any;
    viewClassStudents: any[];
}

export const ViewClassModal: React.FC<ViewClassModalProps> = ({
    isOpen, onClose, selectedClass, viewClassStudents
}) => (
    <Modal isOpen={isOpen} onClose={onClose} title={`Class Details: ${selectedClass?.name || ''} ${selectedClass?.stream || ''}`}>
        <div className="flex justify-end gap-2 mb-4 no-print">
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    const exportData = viewClassStudents.map(s => ({
                        'Student Name': s.full_name,
                        'Admission Number': s.admission_number,
                        'Gender': s.gender || 'N/A'
                    }));
                    exportToCSV(exportData, `Class_List_${selectedClass?.name}_${selectedClass?.stream}`);
                }}
                icon={<Download size={16} />}
            >
                Export CSV
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    const modalContent = document.querySelector('.modal-content');
                    if (modalContent) modalContent.classList.add('print-modal');
                    window.print();
                    if (modalContent) setTimeout(() => modalContent.classList.remove('print-modal'), 1000);
                }}
                className="border-primary text-primary hover:bg-primary hover:text-white"
                icon={<Printer size={16} />}
            >
                Print List
            </Button>
        </div>
        <div className="table-wrapper">
            <table className="table">
                <thead><tr><th>Student Name</th><th>ADM No</th></tr></thead>
                <tbody>
                    {viewClassStudents.length > 0 ? viewClassStudents.map(s => (
                        <tr key={s.id}>
                            <td className="font-bold text-xs">{s.full_name}</td>
                            <td className="text-xs text-secondary">{s.admission_number}</td>
                        </tr>
                    )) : <tr><td colSpan={2} className="text-center p-4 text-xs">No students found in this class.</td></tr>}
                </tbody>
            </table>
        </div>
    </Modal>
);

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Reports">
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <button
                    className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-secondary-light hover:border-primary transition-all gap-2"
                    onClick={() => { window.print(); onClose(); }}
                >
                    <div className="p-3 rounded-full bg-primary-light text-primary mb-2"><FileText size={24} /></div>
                    <span className="font-bold text-sm">Print Current View</span>
                    <span className="text-[10px] text-center text-secondary">Print the current dashboard/list</span>
                </button>
                <button
                    className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-secondary-light hover:border-primary transition-all gap-2"
                    onClick={() => alert('Feature coming soon: Export to CSV')}
                >
                    <div className="p-3 rounded-full bg-success-light text-success mb-2"><BarChart3 size={24} /></div>
                    <span className="font-bold text-sm">Export Data (CSV)</span>
                    <span className="text-[10px] text-center text-secondary">Download raw data</span>
                </button>
            </div>
        </div>
    </Modal>
);

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    executeDelete: () => void;
    isSubmitting: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen, onClose, executeDelete, isSubmitting
}) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion" size="sm">
        <div className="p-4 form-container-sm mx-auto">
            <p className="mb-4 text-secondary">
                Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button
                    variant="primary"
                    className="bg-error border-error text-white"
                    onClick={executeDelete}
                    loading={isSubmitting}
                    loadingText="Deleting..."
                >
                    Confirm Delete
                </Button>
            </div>
        </div>
    </Modal>
);

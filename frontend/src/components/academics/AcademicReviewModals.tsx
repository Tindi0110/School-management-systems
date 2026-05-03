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
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Class Details: ${selectedClass?.name || ''} ${selectedClass?.stream || ''}`}
        footer={
            <>
                <button type="button" className="modern-btn modern-btn-secondary" onClick={onClose}>Close</button>
                <div className="flex gap-2">
                    <button
                        className="modern-btn modern-btn-outline"
                        onClick={() => {
                            const exportData = viewClassStudents.map(s => ({
                                'Student Name': s.full_name,
                                'Admission Number': s.admission_number,
                                'Gender': s.gender || 'N/A'
                            }));
                            exportToCSV(exportData, `Class_List_${selectedClass?.name}_${selectedClass?.stream}`);
                        }}
                    >
                        <Download size={14} className="mr-2" /> EXPORT CSV
                    </button>
                    <button
                        className="modern-btn modern-btn-primary"
                        onClick={() => {
                            const modalContent = document.querySelector('.modal-content');
                            if (modalContent) modalContent.classList.add('print-modal');
                            window.print();
                            if (modalContent) setTimeout(() => modalContent.classList.remove('print-modal'), 1000);
                        }}
                    >
                        <Printer size={14} className="mr-2" /> PRINT LIST
                    </button>
                </div>
            </>
        }
    >
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
            <div className="max-h-[50vh] overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Candidate</th>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">ADM No</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {viewClassStudents.length > 0 ? viewClassStudents.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-xs font-bold text-slate-700">{s.full_name}</td>
                                <td className="px-6 py-4 text-xs font-mono text-slate-400 uppercase tracking-tight">{s.admission_number}</td>
                            </tr>
                        )) : <tr><td colSpan={2} className="text-center p-12 text-slate-400 italic text-xs">No students registered in this class.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    </Modal>
);

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Generate Academic Reports"
        footer={<button type="button" className="modern-btn modern-btn-secondary" onClick={onClose}>Close</button>}
    >
        <div className="grid grid-cols-2 gap-4">
            <button
                className="group flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-transparent hover:border-primary hover:bg-white transition-all rounded-2xl gap-3"
                onClick={() => { window.print(); onClose(); }}
            >
                <div className="p-4 rounded-full bg-white text-primary shadow-sm group-hover:scale-110 transition-transform"><FileText size={28} /></div>
                <span className="font-black text-xs uppercase tracking-widest text-slate-700">Print View</span>
                <span className="text-[10px] text-center text-slate-400 font-bold uppercase italic leading-tight">Export current dashboard layout to PDF</span>
            </button>
            <button
                className="group flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-transparent hover:border-emerald-500 hover:bg-white transition-all rounded-2xl gap-3"
                onClick={() => alert('Feature coming soon: Export to CSV')}
            >
                <div className="p-4 rounded-full bg-white text-emerald-500 shadow-sm group-hover:scale-110 transition-transform"><BarChart3 size={28} /></div>
                <span className="font-black text-xs uppercase tracking-widest text-slate-700">Export Raw</span>
                <span className="text-[10px] text-center text-slate-400 font-bold uppercase italic leading-tight">Download dataset in spreadsheet format</span>
            </button>
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
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Confirm Deletion" 
        size="sm"
        footer={
            <>
                <button type="button" className="modern-btn modern-btn-secondary" onClick={onClose}>Cancel</button>
                <button 
                    type="button" 
                    className="modern-btn modern-btn-danger" 
                    onClick={executeDelete}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "DELETING..." : "CONFIRM DELETE"}
                </button>
            </>
        }
    >
        <div className="p-2 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100/50">
                <Trash2 size={32} />
            </div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-2">Destructive Action</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                Are you sure you want to delete this record? This process is irreversible and may affect linked academic data.
            </p>
        </div>
    </Modal>
);

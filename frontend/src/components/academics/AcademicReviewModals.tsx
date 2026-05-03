import React from 'react';
import Modal from '../Modal';
import { Download, Printer, FileText, BarChart3, Trash2, Eye } from 'lucide-react';
import { exportToCSV } from '../../utils/export';

interface ViewClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedClass: any;
}

export const ViewClassModal: React.FC<ViewClassModalProps> = ({ isOpen, onClose, selectedClass }) => {
    if (!selectedClass) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Academic Overview: ${selectedClass.name} ${selectedClass.stream}`} size="xl">
            <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Enrolled</p>
                        <p className="text-xl font-black text-slate-800">{selectedClass.student_count || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Mean Score</p>
                        <p className="text-xl font-black text-primary">{selectedClass.mean_score || '0.0'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Attendance</p>
                        <p className="text-xl font-black text-green-600">{selectedClass.attendance_rate || '0%'}%</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Teacher</p>
                        <p className="text-xs font-black text-slate-800 uppercase truncate">{selectedClass.class_teacher_name || 'Not Assigned'}</p>
                    </div>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card p-6 border-slate-100 hover:border-primary/20 transition-all group cursor-pointer">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                <BarChart3 size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Generate BroadSheet</h4>
                                <p className="text-[10px] font-medium text-slate-400 leading-relaxed mt-1">Export full class performance breakdown including all subjects and grading.</p>
                                <div className="mt-4 flex gap-2">
                                    <button className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                                        <Download size={12} /> Excel
                                    </button>
                                    <button className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                                        <Printer size={12} /> PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 border-slate-100 hover:border-primary/20 transition-all group cursor-pointer">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Attendance Logs</h4>
                                <p className="text-[10px] font-medium text-slate-400 leading-relaxed mt-1">Review historical attendance data for this unit for the current term.</p>
                                <div className="mt-4">
                                    <button className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2">
                                        <Eye size={12} /> View Registry
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
    isOpen, onClose, onConfirm, isSubmitting 
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
                    onClick={onConfirm}
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

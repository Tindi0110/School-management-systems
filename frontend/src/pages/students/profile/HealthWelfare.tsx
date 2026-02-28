import React from 'react';
import { Heart, Edit, Trash2, AlertTriangle, Phone } from 'lucide-react';
import Button from '../../../components/common/Button';
import { Student } from '../../../types/student.types';

interface HealthWelfareProps {
    student: Student;
    healthId: number | null;
    emergencyContactName: string;
    emergencyContactPhone: string;
    onUpdateMedical: () => void;
    onDeleteHealth: () => void;
}

const HealthWelfare: React.FC<HealthWelfareProps> = ({
    student, healthId, emergencyContactName, emergencyContactPhone, onUpdateMedical, onDeleteHealth
}) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-secondary">Medical & Welfare Profile</h3>
                <div className="flex gap-2">
                    {healthId && (
                        <Button variant="outline" size="sm" className="text-error font-black shadow-lg" onClick={onDeleteHealth} icon={<Trash2 size={14} />}>
                            CLEAR DATA
                        </Button>
                    )}
                    <Button variant="secondary" size="sm" className="font-black shadow-lg" onClick={onUpdateMedical} icon={<Edit size={14} />}>
                        UPDATE MEDICAL INFO
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card flex flex-col p-0 overflow-hidden border-left-4 border-info card-mobile-flat">
                    <div className="p-5 border-b bg-slate-50 flex items-center gap-3">
                        <Heart className="text-info" size={18} />
                        <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-slate-800">Vital Records</h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex justify-between items-center border-bottom pb-2">
                            <span className="text-[11px] font-black text-secondary uppercase tracking-tight">Blood Group</span>
                            <span className="text-[11px] font-black text-primary uppercase font-mono">{student.health_record?.blood_group || 'UNDECLARED'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-black text-secondary uppercase opacity-70 tracking-tight">Known Allergies</span>
                            <p className={`text-[10px] font-black p-2 rounded uppercase ${student.health_record?.allergies && student.health_record.allergies !== 'None' ? 'bg-error-light text-error' : 'bg-success-light text-success'}`}>
                                {student.health_record?.allergies || 'NO RECORDED ALLERGIES'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card flex flex-col p-0 overflow-hidden border-left-4 border-warning card-mobile-flat">
                    <div className="p-5 border-b bg-slate-50 flex items-center gap-3">
                        <AlertTriangle className="text-warning" size={18} />
                        <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-slate-800">Emergency Services</h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="p-4 bg-warning/10 rounded-xl border border-warning/20">
                            <p className="text-[10px] font-black text-warning uppercase mb-1 tracking-widest">Primary Contact</p>
                            <h4 className="font-black text-xs mb-0 uppercase text-primary">{emergencyContactName}</h4>
                            <div className="flex items-center gap-2 text-xs font-mono font-bold mt-2 text-secondary">
                                <Phone size={12} /> {emergencyContactPhone}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthWelfare;

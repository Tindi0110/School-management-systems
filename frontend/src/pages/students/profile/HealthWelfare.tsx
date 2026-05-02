import React from 'react';
import { Heart, Edit, Trash2, AlertTriangle, User, PhoneCall } from 'lucide-react';
import Button from '../../../components/common/Button';
import type { Student, Parent } from '../../../types/student.types';

interface HealthWelfareProps {
    student: Student;
    parents: Parent[];
    healthId: number | null;
    onUpdateMedical: () => void;
    onDeleteHealth: () => void;
}

const HealthWelfare: React.FC<HealthWelfareProps> = ({
    student, parents, healthId, onUpdateMedical, onDeleteHealth
}) => {
    if (!student) return null;

    // Priority chain: saved health record → primary guardian → first guardian
    const primaryGuardian = parents.find((p: any) => p.is_primary) || parents[0] || null;

    const emergencyName = student.health_record?.emergency_contact_name
        || (primaryGuardian as any)?.full_name
        || '';

    const emergencyPhone = student.health_record?.emergency_contact_phone
        || (primaryGuardian as any)?.phone
        || '';

    const emergencyRelation = (primaryGuardian as any)?.relationship || '';
    const emergencyEmail   = (primaryGuardian as any)?.email || '';

    // True when we're showing guardian data instead of a saved health-record entry
    const hasGuardianFallback = !student.health_record?.emergency_contact_name && !!primaryGuardian;
    const isSet = !!emergencyName;

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex justify-between items-center px-2">
                <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-secondary">Medical &amp; Welfare Profile</h3>
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
                {/* ── Vital Records ── */}
                <div className="card flex flex-col p-0 overflow-hidden border-left-4 border-info card-mobile-flat">
                    <div className="p-5 border-b bg-slate-50 flex items-center gap-3">
                        <Heart className="text-info" size={18} />
                        <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-slate-800">Vital Records</h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex justify-between items-center border-bottom pb-2">
                            <span className="text-[11px] font-black text-secondary uppercase tracking-tight">Blood Group</span>
                            <span className="text-[11px] font-black text-primary uppercase font-mono">
                                {student.health_record?.blood_group || 'UNDECLARED'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-bottom pb-2">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-secondary uppercase opacity-60">Height (cm)</span>
                                <span className="text-[11px] font-black">{student.health_record?.height || '--'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-secondary uppercase opacity-60">Weight (kg)</span>
                                <span className="text-[11px] font-black">{student.health_record?.weight || '--'}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-bottom pb-2">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-secondary uppercase opacity-60">Temperature</span>
                                <span className="text-[11px] font-black">{student.health_record?.temperature ? `${student.health_record.temperature}°C` : '--'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-secondary uppercase opacity-60">Blood Pressure</span>
                                <span className="text-[11px] font-black">{student.health_record?.blood_pressure || '--'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-black text-secondary uppercase opacity-70 tracking-tight">Known Allergies</span>
                            <p className={`text-[10px] font-black p-2 rounded uppercase ${
                                student.health_record?.allergies && student.health_record.allergies !== 'None'
                                    ? 'bg-error-light text-error'
                                    : 'bg-success-light text-success'
                            }`}>
                                {student.health_record?.allergies || 'NO RECORDED ALLERGIES'}
                            </p>
                        </div>
                        {student.health_record?.chronic_conditions && (
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-black text-secondary uppercase opacity-70 tracking-tight">Chronic Conditions</span>
                                <p className="text-[10px] font-black p-2 rounded uppercase bg-amber-50 text-amber-700 border border-amber-100">
                                    {student.health_record.chronic_conditions}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Emergency Services ── */}
                <div className="card flex flex-col p-0 overflow-hidden border-left-4 border-warning card-mobile-flat">
                    <div className="p-5 border-b bg-slate-50 flex items-center gap-3">
                        <AlertTriangle className="text-warning" size={18} />
                        <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-slate-800">Emergency Services</h3>
                    </div>
                    <div className="p-5 space-y-3">

                        {/* Auto-fill notice */}
                        {hasGuardianFallback && (
                            <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                                <User size={12} className="text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wide leading-relaxed">
                                    Auto-filled from primary guardian.
                                    Click "Update Medical Info" to save a dedicated emergency contact.
                                </p>
                            </div>
                        )}

                        {/* Contact card */}
                        <div className={`p-4 rounded-xl border ${isSet ? 'bg-warning/10 border-warning/20' : 'bg-slate-50 border-slate-200'}`}>
                            <p className="text-[10px] font-black text-warning uppercase mb-3 tracking-widest">Primary Contact</p>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                                    <User size={18} className="text-warning" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-black text-sm mb-0 ${isSet ? 'text-primary uppercase' : 'text-slate-400 italic'}`}>
                                        {isSet ? emergencyName : 'No Contact Set'}
                                    </h4>

                                    {emergencyRelation && (
                                        <span className="inline-block text-[9px] font-bold text-secondary uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded mt-1">
                                            {emergencyRelation}
                                        </span>
                                    )}

                                    {isSet && (
                                        <div className="mt-3 space-y-1">
                                            <a
                                                href={`tel:${emergencyPhone}`}
                                                className="flex items-center gap-2 text-xs font-mono font-bold text-primary hover:text-success transition-colors group"
                                            >
                                                <PhoneCall size={13} className="group-hover:animate-pulse" />
                                                {emergencyPhone}
                                            </a>
                                            {emergencyEmail && (
                                                <p className="text-[10px] text-secondary font-medium truncate pl-5">
                                                    {emergencyEmail}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CTA when no contact is set at all */}
                        {!isSet && (
                            <button
                                onClick={onUpdateMedical}
                                className="w-full btn btn-outline btn-warning btn-sm text-[10px] font-black uppercase tracking-wider mt-1"
                            >
                                + Set Emergency Contact
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthWelfare;

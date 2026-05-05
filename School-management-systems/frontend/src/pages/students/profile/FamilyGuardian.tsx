import React from 'react';
import { Plus, Users, ShieldCheck, Trash2, Phone, Mail, MessageSquare } from 'lucide-react';
import Button from '../../../components/common/Button';
import type { Parent } from '../../../types/student.types';

interface FamilyGuardianProps {
    parents: Parent[];
    onManageGuardians: () => void;
    onMarkPrimary: (id: number) => void;
    onUnlinkGuardian: (id: number) => void;
    onCall: (phone: string) => void;
    onWhatsApp: (phone: string) => void;
}

const FamilyGuardian: React.FC<FamilyGuardianProps> = ({
    parents, onManageGuardians, onMarkPrimary, onUnlinkGuardian, onCall, onWhatsApp
}) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-secondary">Family & Guardians</h3>
                <Button
                    variant="primary"
                    size="sm"
                    className="font-black shadow-lg"
                    onClick={onManageGuardians}
                    icon={<Plus size={14} />}
                >
                    MANAGE GUARDIANS
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {parents.length === 0 ? (
                    <div className="col-span-full py-12 text-center card border-dashed border-2">
                        <Users size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-secondary font-bold uppercase text-xs tracking-widest">No formally linked guardians found</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase italic">Links help in communication and fee management</p>
                    </div>
                ) : (
                    parents.map((p: any) => (
                        <div key={p.id} className={`card p-6 border-left-4 ${p.is_primary ? 'border-primary' : 'border-slate-200'} card-mobile-flat`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-xs uppercase mb-0 text-primary">{p.full_name}</h4>
                                        {p.is_primary && <span className="badge badge-primary scale-75 origin-left">PRIMARY</span>}
                                    </div>
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{p.relationship || 'Guardian'}</p>
                                </div>
                                <div className="flex gap-1">
                                    {!p.is_primary && (
                                        <button
                                            onClick={() => onMarkPrimary(p.id)}
                                            className="p-1.5 hover:bg-primary-light hover:text-white rounded transition-all text-slate-400"
                                            title="Mark as Primary"
                                        >
                                            <ShieldCheck size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onUnlinkGuardian(p.id)}
                                        className="p-1.5 hover:bg-error-light hover:text-error rounded transition-all text-slate-400"
                                        title="Unlink Guardian"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <Phone size={12} className="text-slate-400" /> {p.phone}
                                </div>
                                {p.email && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 truncate">
                                        <Mail size={12} className="text-slate-400" /> {p.email}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => onCall(p.phone)} icon={<Phone size={12} />} className="text-[10px] font-bold">CALL</Button>
                                <Button variant="ghost" size="sm" onClick={() => onWhatsApp(p.phone)} icon={<MessageSquare size={12} />} className="text-[10px] font-bold">WHATSAPP</Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FamilyGuardian;

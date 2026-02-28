import React from 'react';
import { ShieldCheck, MessageSquare, MessageCircle, Mail, Send } from 'lucide-react';
import Button from '../../../components/common/Button';
import { Student } from '../../../types/student.types';

interface ProfileSidebarProps {
    student: Student;
    primaryGuardian: any;
    onTransfer: () => void;
    onSuspend: () => void;
    onDelete: () => void;
    onWhatsApp: () => void;
    onEmail: () => void;
    onSMS: () => void;
    onOpenMessenger: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
    student, primaryGuardian, onTransfer, onSuspend, onDelete,
    onWhatsApp, onEmail, onSMS, onOpenMessenger
}) => {
    return (
        <div className="col-span-12 lg:col-span-4 space-y-8 min-w-0 no-print">
            <div className="card flex flex-col p-0 overflow-hidden border-left-4 border-primary card-mobile-flat">
                <div className="p-5 border-b bg-slate-50">
                    <h4 className="text-[10px] font-black uppercase text-primary mb-0 tracking-[0.2em] flex items-center gap-2">
                        <ShieldCheck size={14} /> Administrative Control
                    </h4>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-secondary">
                        <span>Admission Date</span>
                        <span className="text-primary font-mono">{new Date(student.admission_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-start text-[10px] font-black uppercase text-secondary">
                        <span>Primary Guardian</span>
                        <div className="text-right">
                            <span className="text-primary block">{primaryGuardian?.full_name || student.guardian_name}</span>
                            <span className="text-secondary text-[8px] block opacity-70 tracking-normal lower-case">
                                {primaryGuardian?.phone || student.guardian_phone}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-secondary">
                        <span>House Unit</span>
                        <span className="text-primary">{student.residence_details || student.hostel_name || 'DAY SCHOLAR'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-secondary">
                        <span>Transport</span>
                        <span className="text-primary">{student.transport_details || 'NONE'}</span>
                    </div>

                    <div className="pt-4 space-y-2 border-t border-slate-100">
                        <Button variant="outline" size="sm" className="w-full uppercase font-black py-2 tracking-widest text-[10px]" onClick={onTransfer}>
                            Transfer Unit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-warning w-full uppercase font-black py-2 tracking-widest text-[10px]" onClick={onSuspend}>
                            Restrict / Suspend
                        </Button>
                        <Button variant="danger" size="sm" className="w-full uppercase font-black py-2 tracking-widest mt-2 shadow-lg shadow-error/20 text-[10px]" onClick={onDelete}>
                            PERMANENTLY DELETE
                        </Button>
                    </div>
                </div>
            </div>

            <div className="card bg-slate-900 text-white border-none shadow-xl flex flex-col p-6 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                <div className="p-3 rounded-xl bg-white/10 text-white w-fit mb-4 relative z-10 transition-transform group-hover:scale-110">
                    <MessageSquare size={24} />
                </div>
                <h4 className="text-[10px] font-black uppercase mb-1 tracking-[0.2em] relative z-10">Rapid Communication</h4>
                <p className="text-[10px] font-bold opacity-60 leading-relaxed mb-6 relative z-10">Send instant alerts or messages to guardian/parent.</p>

                <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
                    <button onClick={onWhatsApp} className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all gap-2 group" title="WhatsApp">
                        <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">WA</span>
                    </button>
                    <button onClick={onEmail} className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all gap-2 group" title="Email">
                        <Mail size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Email</span>
                    </button>
                    <button onClick={onSMS} className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all gap-2 group" title="SMS">
                        <Send size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">SMS</span>
                    </button>
                </div>

                <Button variant="primary" size="sm" className="w-full bg-white text-slate-900 border-none hover:bg-white/90 uppercase font-black shadow-lg py-2.5 text-[10px]" onClick={onOpenMessenger}>
                    Open Messenger
                </Button>
            </div>
        </div>
    );
};

export default ProfileSidebar;

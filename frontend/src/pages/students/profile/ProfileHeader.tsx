import React from 'react';
import {
    User, ArrowLeft, Printer, Edit
} from 'lucide-react';
import Button from '../../../components/common/Button';
import type { Student } from '../../../types/student.types';

interface ProfileHeaderProps {
    student: Student;
    onBack: () => void;
    onClearance: () => void;
    onEdit: () => void;
    activeTab: string;
    setActiveTab: (tab: any) => void;
    tabs: { id: string, label: string, icon: any }[];
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    student, onBack, onClearance, onEdit, activeTab, setActiveTab, tabs
}) => {
    return (
        <>
            <div className="flex justify-between items-center mb-6 no-print">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    icon={<ArrowLeft size={16} />}
                    className="font-black text-secondary hover:text-primary"
                >
                    BACK TO REGISTRY
                </Button>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="font-black"
                        onClick={onClearance}
                        icon={<Printer size={16} />}
                    >
                        CLEARANCE FORM
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        className="font-black shadow-lg shadow-primary/20"
                        onClick={onEdit}
                        icon={<Edit size={14} />}
                    >
                        EDIT PROFILE
                    </Button>
                </div>
            </div>

            <div className="card mb-8 overflow-hidden border">
                <div className="h-24 bg-primary relative">
                    <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-2xl shadow-lg no-print border">
                        <div className="w-24 h-24 rounded-xl bg-secondary-light flex items-center justify-center text-secondary">
                            {student.photo ? (
                                <img src={student.photo} alt="Profile" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <User size={48} />
                            )}
                        </div>
                    </div>
                </div>
                <div className="pt-16 pb-6 px-8 flex flex-wrap justify-between items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="mb-0 text-2xl font-black text-primary uppercase">{student.full_name}</h1>
                            <span className={`badge badge-xs ${student.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>
                                {student.status}
                            </span>
                        </div>
                        <p className="text-secondary font-bold uppercase text-xs tracking-widest mt-1">
                            {student.admission_number} | {student.class_name} ({student.class_stream || 'General'}) | {student.category}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-secondary uppercase mb-0">Outstanding Balance</p>
                            <h2 className={`font-black mb-0 ${Number(student.fee_balance || 0) === 0 ? 'text-success' : Number(student.fee_balance || 0) < 0 ? 'text-info' : 'text-error'}`}>
                                KES {(student.fee_balance || 0).toLocaleString()}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="nav-tab-container px-4 py-2 no-print">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default ProfileHeader;

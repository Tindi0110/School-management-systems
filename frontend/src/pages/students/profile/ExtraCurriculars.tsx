import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import type { Activity } from '../../../types/student.types';

interface ExtraCurricularsProps {
    activities: Activity[];
    onJoinActivity: () => void;
    onEditActivity: (activity: Activity) => void;
    onDeleteActivity: (id: number) => void;
}

const ExtraCurriculars: React.FC<ExtraCurricularsProps> = ({
    activities, onJoinActivity, onEditActivity, onDeleteActivity
}) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-secondary">Extra-Curricular Participation</h3>
                <Button
                    variant="primary"
                    size="sm"
                    className="font-black shadow-lg"
                    onClick={onJoinActivity}
                    icon={<Plus size={14} />}
                >
                    JOIN CLUB/SPORT
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activities.length === 0 ? (
                    <p className="text-secondary italic text-xs uppercase font-bold text-center py-8 col-span-2 opacity-40">No extra-curricular activities recorded</p>
                ) : (
                    activities.map((act, i) => (
                        <div key={i} className="card flex flex-col p-0 overflow-hidden border-left-4 border-primary shadow-md relative group hover-scale transition-all card-mobile-flat">
                            <div className="p-5 flex justify-between items-start">
                                <div>
                                    <h4 className="font-black text-xs uppercase text-primary mb-1">{act.name}</h4>
                                    <p className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-60">Role: {act.role}</p>
                                </div>
                                <span className="text-[9px] font-black text-secondary uppercase bg-secondary-light px-2 py-0.5 rounded">{act.year}</span>
                            </div>
                            <div className="px-5 pb-5 flex justify-between items-center">
                                <span className="badge badge-success badge-xxs px-2 py-0 font-black">ACTIVE PARTICIPANT</span>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEditActivity(act)} icon={<Edit size={12} />} />
                                    <Button variant="ghost" size="sm" className="text-error h-7 w-7 p-0" onClick={() => onDeleteActivity(act.id)} icon={<Trash2 size={12} />} />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ExtraCurriculars;

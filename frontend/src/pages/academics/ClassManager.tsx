import React from 'react';
import { School, Users, Edit, Plus } from 'lucide-react';
import Button from '../../components/common/Button';

interface ClassManagerProps {
    classes: any[];
    searchTerm: string;
    openEditClass: (cls: any) => void;
    openViewClass: (cls: any) => void;
    setIsClassModalOpen: (val: boolean) => void;
}

const ClassManager: React.FC<ClassManagerProps> = ({
    classes,
    searchTerm,
    openEditClass,
    openViewClass,
    setIsClassModalOpen
}) => {
    return (
        <div className="grid grid-cols-12 gap-6 lg:gap-8 min-w-0">
            {classes.filter(cls =>
                !searchTerm ||
                cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cls.stream.toLowerCase().includes(searchTerm.toLowerCase())
            ).map(cls => (
                <div key={cls.id} className="col-span-12 md:col-span-6 lg:col-span-4 min-w-0">
                    <div className="card hover:shadow-2xl transition-all h-full flex flex-col p-6 overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 rounded-lg bg-primary-light text-white"><School size={16} /></div>
                            <span className="badge badge-info badge-xs">CAP: {cls.capacity}</span>
                        </div>
                        <h3 className="mb-1 text-sm font-black">{cls.name} <span className="text-secondary">{cls.stream}</span></h3>
                        <p className="text-[10px] font-bold text-secondary mb-4 flex items-center gap-1 uppercase"><Users size={10} /> {cls.student_count} Students</p>
                        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-secondary uppercase">{cls.class_teacher_name || 'Unassigned TR'}</span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" onClick={() => openEditClass(cls)} title="Edit Class Details" icon={<Edit size={10} />} />
                                <Button variant="ghost" size="sm" className="text-primary" onClick={() => openViewClass(cls)} title="View Students in Class" icon={<Users size={10} />} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <div className="col-span-12 md:col-span-6 lg:col-span-4 min-w-0">
                <div className="card border-dashed flex flex-col items-center justify-center p-8 cursor-pointer hover:border-primary group h-full" onClick={() => setIsClassModalOpen(true)}>
                    <Plus size={32} className="text-secondary group-hover:text-primary transition-all mb-2" />
                    <span className="text-xs font-black uppercase text-secondary">Add Class Unit</span>
                </div>
            </div>
        </div>
    );
};

export default ClassManager;

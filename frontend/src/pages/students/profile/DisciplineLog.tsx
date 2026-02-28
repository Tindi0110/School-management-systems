import React from 'react';
import { ShieldAlert, Plus, ShieldCheck, Edit, Trash2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import { DisciplineIncident } from '../../../types/student.types';

interface DisciplineLogProps {
    discipline: DisciplineIncident[];
    onReportIncident: () => void;
    onEditIncident: (incident: DisciplineIncident) => void;
    onDeleteIncident: (id: number) => void;
}

const DisciplineLog: React.FC<DisciplineLogProps> = ({
    discipline, onReportIncident, onEditIncident, onDeleteIncident
}) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-secondary">Behavioral Log</h3>
                <Button
                    variant="danger"
                    size="sm"
                    className="font-black shadow-lg"
                    onClick={onReportIncident}
                    icon={<Plus size={14} />}
                >
                    REPORT INCIDENT
                </Button>
            </div>
            {discipline.length === 0 ? (
                <div className="card text-center bg-success/5 border-dashed border-2 border-success/20">
                    <ShieldCheck size={48} className="mx-auto text-success mb-4" />
                    <h3 className="text-success font-black uppercase text-sm">Pristine Conduct</h3>
                    <p className="text-secondary text-xs font-bold uppercase mb-0">Official records show no disciplinary interventions</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {discipline.map((d, i) => (
                        <div key={i} className="card border-left-4 border-error relative">
                            <div className="absolute top-2 right-2 flex gap-2 z-50">
                                <Button variant="ghost" size="sm" onClick={() => onEditIncident(d)} icon={<Edit size={14} />} title="Edit" />
                                <Button variant="ghost" size="sm" className="text-error" onClick={() => onDeleteIncident(d.id)} icon={<Trash2 size={14} />} title="Delete" />
                            </div>
                            <div className="absolute top-4 right-12 text-[10px] font-black text-secondary uppercase">{new Date(d.incident_date).toLocaleDateString()}</div>
                            <h4 className="font-black text-[11px] text-error uppercase mb-1">{d.offence_category}</h4>
                            <p className="text-xs text-secondary font-bold mb-3">{d.description}</p>
                            <div className="flex gap-4">
                                <span className="badge badge-error badge-xxs">ACTION: {d.action_taken}</span>
                                <span className="text-[9px] font-black text-secondary uppercase italic">REPORTED BY: {d.reported_by_name || 'STAFF'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DisciplineLog;

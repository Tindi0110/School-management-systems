import React from 'react';
import { TrendingUp, History as HistoryIcon, ShieldAlert } from 'lucide-react';
import { StatCard } from '../../../components/Card';
import Button from '../../../components/common/Button';
import type { Student } from '../../../types/student.types';

interface ProfileSummaryProps {
    student: Student;
    results: any[];
    discipline: any[];
}

const ProfileSummary: React.FC<ProfileSummaryProps> = ({ student, results, discipline }) => {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Average Grade"
                    value={student.average_grade || 'N/A'}
                    icon={<TrendingUp size={18} />}
                    gradient="linear-gradient(135deg, #1e3c72, #2a5298)"
                />
                <StatCard
                    title="Attendance"
                    value={`${student.attendance_percentage}%`}
                    icon={<HistoryIcon size={18} />}
                    gradient="linear-gradient(135deg, #4facfe, #00f2fe)"
                />
                <StatCard
                    title="Incident Rep."
                    value={discipline.length}
                    icon={<ShieldAlert size={18} />}
                    gradient="linear-gradient(135deg, #f093fb, #f5576c)"
                />
            </div>
            <div className="card overflow-hidden border-top-4 border-primary shadow-xl">
                <div className="p-4 bg-primary text-white flex justify-between items-center">
                    <h3 className="mb-0 text-xs font-black uppercase tracking-widest">Institutional Timeline</h3>
                    <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-primary">
                        EXPORT HISTORY
                    </Button>
                </div>
                <div className="p-6">
                    <div className="space-y-6">
                        {results.length === 0 ? (
                            <p className="text-secondary italic text-xs uppercase font-bold text-center py-8">No assessment data found</p>
                        ) : (
                            results.slice(0, 5).map((r: any, i: number) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                                    <div className="flex-grow border-bottom pb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-black text-[11px] uppercase mb-0 text-primary">{r.exam_name}</p>
                                                <p className="text-[10px] text-secondary font-bold uppercase">{r.subject_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-sm mb-0">{r.score || r.marks_attained}%</p>
                                                <span className="badge badge-success badge-xxs px-2 py-0">GRADE: {r.grade || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfileSummary;

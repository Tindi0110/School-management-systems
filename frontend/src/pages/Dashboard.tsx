import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import SearchableSelect from '../components/SearchableSelect';
import {
    Users, DollarSign, BookOpen, Plus,
    ArrowRight, Bell, Calendar, ShieldCheck, Activity,
    Star, Award, Zap
} from 'lucide-react';
import { StatCard } from '../components/Card';
import { statsAPI, staffAPI } from '../api/api';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
    const { user } = useSelector((state: any) => state.auth);
    const navigate = useNavigate();
    const { success, error: toastError } = useToast();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalStaff: 0,
        totalClasses: 0,
        pendingPayments: 0,
    });
    const [alerts, setAlerts] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [staffFormData, setStaffFormData] = useState({
        employee_id: '',
        full_name: '',
        department: '',
        role: 'TEACHER',
        date_joined: new Date().toISOString().split('T')[0],
    });

    const [activeAcademic, setActiveAcademic] = useState({ year: 'NO ACTIVE YEAR', term: 'NO ACTIVE TERM' });

    // Format role for display (e.g., ADMIN -> Administrator)
    const getRoleDisplay = (role: string) => {
        const roles: { [key: string]: string } = {
            'ADMIN': 'System Administrator',
            'DOS': 'Director of Studies',
            'REGISTRAR': 'Admissions Registrar',
            'TEACHER': 'Academic Staff',
            'ACCOUNTANT': 'Bursar',
            'WARDEN': 'Warden',
            'NURSE': 'School Nurse',
            'LIBRARIAN': 'Librarian',
            'PARENT': 'Parent',
            'STUDENT': 'Student'
        };
        return roles[role] || role;
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const res = await statsAPI.getDashboard();
            const { counts, active_context, alerts: alertsData, events: eventsData } = res.data;

            setStats({
                totalStudents: counts.total_students ?? 0,
                totalStaff: counts.total_staff ?? 0,
                totalClasses: counts.total_classes ?? 0,
                pendingPayments: counts.pending_invoices ?? 0,
            });

            setActiveAcademic({
                year: active_context.year || 'No Active Year',
                term: active_context.term || 'No Active Term'
            });

            setAlerts(alertsData || []);
            setEvents(eventsData || []);

        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStaffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const submissionData = {
                ...staffFormData,
                username: staffFormData.employee_id, // Default username as ID
                password: 'InitialPassword123' // Temporary password
            };

            await staffAPI.create(submissionData);
            setIsStaffModalOpen(false);
            loadDashboardData();
            success("Faculty member registered successfully");
            navigate('/staff');
        } catch (error: any) {
            toastError(error.response?.data?.detail || 'Failed to add staff member');
        }
    };

    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

    return (
        <div className="fade-in px-4">
            {/* Elegant Header with Multi-layer Background */}
            <div className="relative overflow-hidden rounded-3xl bg-primary text-white p-8 mb-8 shadow-2xl">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={16} className="text-info-light" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">System Operator Dashboard</span>
                        </div>
                        <h1 className="text-3xl font-black mb-1 capitalize">Welcome, {getRoleDisplay(user?.role || 'GUEST')}</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                                <Calendar size={12} className="text-info-light" />
                                <span className="text-[10px] font-bold uppercase">{activeAcademic.year} • {activeAcademic.term}</span>
                            </div>
                            <span className="text-xs opacity-70 italic font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <Zap size={200} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-10">
                {(user?.role === 'ADMIN' || user?.role === 'DOS' || user?.role === 'REGISTRAR' || user?.role === 'TEACHER') && (
                    <div className="transform hover:-translate-y-1 transition-all">
                        <StatCard
                            title="Total Registry"
                            value={stats.totalStudents}
                            icon={<Users size={18} />}
                            gradient="linear-gradient(135deg, #1e3c72, #2a5298)"
                        />
                    </div>
                )}
                {(user?.role === 'ADMIN' || user?.role === 'DOS') && (
                    <div className="transform hover:-translate-y-1 transition-all">
                        <StatCard
                            title="Faculty Units"
                            value={stats.totalStaff}
                            icon={<Award size={18} />}
                            gradient="linear-gradient(135deg, #f093fb, #f5576c)"
                        />
                    </div>
                )}
                <div className="transform hover:-translate-y-1 transition-all">
                    <StatCard
                        title="Active Sessions"
                        value={stats.totalClasses}
                        icon={<BookOpen size={18} />}
                        gradient="linear-gradient(135deg, #5ee7df, #b490ca)"
                    />
                </div>
                {(user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
                    <div className="transform hover:-translate-y-1 transition-all">
                        <StatCard
                            title="Pending Dues"
                            value={stats.pendingPayments}
                            icon={<DollarSign size={18} />}
                            gradient="linear-gradient(135deg, #f093fb, #f5576c)"
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column - Main Viewport */}
                <div className="lg:col-span-4 h-full">
                    <div className="card border-top-4 border-primary h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                                <Activity size={16} /> Quick Operations
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {(user?.role === 'ADMIN' || user?.role === 'REGISTRAR') && (
                                <button className="btn btn-outline w-full justify-between group py-3" onClick={() => navigate('/students')}>
                                    <span className="flex items-center gap-2"><Users size={16} /> Enroll New Student</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                            {user?.role === 'DOS' && (
                                <button className="btn btn-outline w-full justify-between group py-3" onClick={() => navigate('/academics')}>
                                    <span className="flex items-center gap-2"><BookOpen size={16} /> Manage Academic Years</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                            {(user?.role === 'ADMIN' || user?.role === 'PRINCIPAL') && (
                                <button className="btn btn-outline w-full justify-between group py-3" onClick={() => setIsStaffModalOpen(true)}>
                                    <span className="flex items-center gap-2"><Star size={16} /> Register Faculty</span>
                                    <Plus size={16} />
                                </button>
                            )}
                            {(user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
                                <button className="btn btn-outline w-full justify-between group py-3" onClick={() => navigate('/finance')}>
                                    <span className="flex items-center gap-2"><DollarSign size={16} /> Generate Invoices</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Center Column - Events */}
                <div className="lg:col-span-5">
                    <div className="card border-top-4 border-info">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                                <Calendar size={16} /> Calendar Events
                            </h3>
                            <button className="btn btn-xs btn-outline" onClick={() => navigate('/academics')}><Plus size={12} /></button>
                        </div>
                        <div className="space-y-4">
                            {events.length === 0 ? (
                                <p className="text-xs text-secondary text-center py-8">No scheduled events</p>
                            ) : events.map((event: any, i) => (
                                <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-secondary-light transition-colors border-left-4 border-info">
                                    <div className="flex flex-col items-center justify-center bg-info/10 text-info rounded-lg px-3 py-1 min-w-[50px]">
                                        <span className="text-[10px] font-black uppercase">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="text-lg font-black leading-none">{new Date(event.date).getDate()}</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase mb-0.5">{event.title}</p>
                                        <p className="text-[9px] text-secondary flex items-center gap-2">
                                            <span>{event.start_time}</span> • <span>{event.location}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Alerts */}
                <div className="lg:col-span-3">
                    <div className="card border-top-4 border-warning">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                                <Bell size={16} /> System Alerts
                            </h3>
                            <button className="btn btn-xs btn-outline" onClick={() => navigate('/academics')}><Plus size={12} /></button>
                        </div>
                        <div className="space-y-4">
                            {alerts.length === 0 ? (
                                <>
                                    <ShieldCheck className="mx-auto text-success-light mb-2" size={40} />
                                    <p className="text-[10px] font-black uppercase text-secondary">All systems nominal</p>
                                    <p className="text-[9px] text-secondary mt-1">No active alerts</p>
                                </>
                            ) : alerts.slice(0, 2).map((alert: any) => (
                                <div key={alert.id} className={`p-2 rounded border ${alert.severity === 'CRITICAL' ? 'bg-error/10 border-error text-error' : 'bg-warning/10 border-warning text-warning'}`}>
                                    <p className="text-[10px] font-black uppercase mb-1">{alert.title}</p>
                                    <p className="text-[9px]">{alert.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Faculty Modal */}
            <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title="Register New Faculty Member">
                <form onSubmit={handleStaffSubmit} className="p-4 space-y-4 form-container-md mx-auto">
                    <div>
                        <label className="text-[10px] font-black text-secondary uppercase mb-1 block">Staff / Employee ID</label>
                        <input className="input" placeholder="e.g. T-001" value={staffFormData.employee_id} onChange={e => setStaffFormData({ ...staffFormData, employee_id: e.target.value })} required />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-secondary uppercase mb-1 block">Full Name</label>
                        <input className="input" placeholder="e.g. Jane Doe" value={staffFormData.full_name} onChange={e => setStaffFormData({ ...staffFormData, full_name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-secondary uppercase mb-1 block">Department</label>
                            <input className="input" placeholder="e.g. Languages" value={staffFormData.department} onChange={e => setStaffFormData({ ...staffFormData, department: e.target.value })} required />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-secondary uppercase mb-1 block">Primary Role</label>
                            <SearchableSelect
                                options={[
                                    { id: 'TEACHER', label: 'Academic Staff' },
                                    { id: 'DOS', label: 'Director of Studies' },
                                    { id: 'ACCOUNTANT', label: 'Bursar' },
                                    { id: 'ADMIN', label: 'System Admin' }
                                ]}
                                value={staffFormData.role}
                                onChange={(val) => setStaffFormData({ ...staffFormData, role: val.toString() })}
                            />
                        </div>
                    </div>
                    <div className="pt-4">
                        <button type="submit" className="btn btn-primary w-full shadow-lg h-12">Submit Registration</button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

export default Dashboard;

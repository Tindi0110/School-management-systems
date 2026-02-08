import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Users, DollarSign, BookOpen, Plus,
    ArrowRight, Bell, Calendar, ShieldCheck, Activity,
    Star, Award, Zap
} from 'lucide-react';
import { StatCard } from '../components/Card';
import { studentsAPI, staffAPI, academicsAPI, financeAPI } from '../api/api';
import Modal from '../components/Modal';

const Dashboard = () => {
    const { user } = useSelector((state: any) => state.auth);
    const navigate = useNavigate();
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

    // Communication Modals
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [alertForm, setAlertForm] = useState({ title: '', message: '', severity: 'INFO' });
    const [eventForm, setEventForm] = useState({ title: '', date: '', start_time: '', location: '', event_type: 'GENERAL' });
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
        try {
            const [studentsRes, staffRes, classesRes, paymentsRes, alertsRes, eventsRes, examsRes] = await Promise.all([
                studentsAPI.getAll(),
                staffAPI.getAll(),
                academicsAPI.classes.getAll().catch(() => ({ data: [] })),
                financeAPI.invoices.getAll().catch(() => ({ data: [] })),
                academicsAPI.alerts.getAll().catch(() => ({ data: [] })),
                academicsAPI.events.getAll().catch(() => ({ data: [] })),
                academicsAPI.exams.getAll().catch(() => ({ data: [] })),
            ]);

            setStats({
                totalStudents: studentsRes?.data?.count || (Array.isArray(studentsRes?.data) ? studentsRes.data.length : 0),
                totalStaff: staffRes?.data?.count || (Array.isArray(staffRes?.data) ? staffRes.data.length : 0),
                totalClasses: classesRes?.data?.count || (Array.isArray(classesRes?.data) ? classesRes.data.length : 0),
                pendingPayments: ((paymentsRes?.data?.results || paymentsRes?.data || []).filter((r: any) => parseFloat(r?.balance) > 0)).length,
            });
            setAlerts(alertsRes?.data?.results || alertsRes?.data || []);
            // Merge Events and Exams for Calendar
            const apiEvents = eventsRes?.data?.results || eventsRes?.data || [];
            const apiExams = (examsRes?.data?.results || examsRes?.data || []).map((ex: any) => ({
                id: `exam - ${ex.id} `,
                title: `${ex.name} (${ex.exam_type})`,
                date: ex.date_started,
                start_time: '08:00', // Default start time for exams
                location: 'Examination Halls',
                event_type: 'ACADEMIC',
                is_exam: true
            }));

            // Sort by date (newest first or nearest upcoming?) - Let's do nearest upcoming for dashboard
            const allEvents = [...apiEvents, ...apiExams].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // Filter for today or future events only? Or just show all? 
            // The UI shows "Today", let's filter for today onwards for the list
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcomingEvents = allEvents.filter((ev: any) => new Date(ev.date) >= today);

            setEvents(upcomingEvents);

            // Fetch Active Academic Data
            try {
                const [yearsRes, termsRes] = await Promise.all([
                    academicsAPI.years.getAll(),
                    academicsAPI.terms.getAll()
                ]);
                const yearsData = yearsRes.data.results || yearsRes.data || [];
                // 1. Try to find explicitly active year
                let activeY = yearsData.find((y: any) => y.is_active === true)?.name;

                // 2. Fallback: Try string 'true' just in case
                if (!activeY) {
                    activeY = yearsData.find((y: any) => String(y.is_active) === 'true')?.name;
                }

                // 3. Fallback: Sort by name (descending) and pick the first one (assuming 2027 > 2026)
                if (!activeY && yearsData.length > 0) {
                    const sortedYears = [...yearsData].sort((a: any, b: any) => b.name.localeCompare(a.name));
                    activeY = sortedYears[0]?.name;
                }

                activeY = activeY || 'NO ACTIVE YEAR';

                const activeT = termsData.find((t: any) => t.is_active === true)?.name || 'NO ACTIVE TERM';
                setActiveAcademic({ year: activeY, term: activeT });
            } catch (err) {
                // Silent
            }


        } catch (error) {
            // Dashboard error
        } finally {
            setLoading(false);
        }
    };

    const handleStaffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const submissionData = {
            ...staffFormData,
            write_full_name: staffFormData.full_name,
            write_role: staffFormData.role
        };
        try {
            await staffAPI.create(submissionData);
            setIsStaffModalOpen(false);
            loadDashboardData();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to add staff member');
        }
    };

    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

    return (
        <div className="fade-in space-y-8">
            {/* Hero Welcome */}
            <div className="card p-8 bg-gradient-to-r from-primary to-[#4a00e0] text-white relative overflow-hidden shadow-2xl border-none">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={16} className="text-info-light" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">System Operator Dashboard</span>
                        </div>
                        <h1 className="text-3xl font-black mb-1 capitalize">Welcome, {getRoleDisplay(user?.role || 'GUEST')}</h1>
                        <p className="opacity-80 text-sm font-medium">Institutional oversight platform for excellence and academic integrity.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-center bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                            <p className="text-[10px] uppercase font-black mb-0 opacity-70">Status</p>
                            <p className="text-sm font-black text-success">ONLINE</p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <Zap size={200} />
                </div>
            </div>

            {/* Core Stats Grid - Side by Side on Mobile */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                <div onClick={() => navigate('/students')} className="cursor-pointer">
                    <StatCard
                        title="Total Registry"
                        value={stats.totalStudents}
                        icon={<Users size={18} />}
                        gradient="linear-gradient(135deg, #1e3c72, #2a5298)"
                    />
                </div>
                <div onClick={() => navigate('/staff')} className="cursor-pointer">
                    <StatCard
                        title="Faculty Units"
                        value={stats.totalStaff}
                        icon={<Award size={18} />}
                        gradient="linear-gradient(135deg, #f093fb, #f5576c)"
                    />
                </div>
                <div onClick={() => navigate('/academics')} className="cursor-pointer">
                    <StatCard
                        title="Learning Groups"
                        value={stats.totalClasses}
                        icon={<BookOpen size={18} />}
                        gradient="linear-gradient(135deg, #4facfe, #00f2fe)"
                    />
                </div>
                <div onClick={() => navigate('/finance')} className="cursor-pointer">
                    <StatCard
                        title="Financial Arrears"
                        value={stats.pendingPayments}
                        icon={<DollarSign size={18} />}
                        gradient="linear-gradient(135deg, #43e97b, #38f9d7)"
                    />
                </div>
            </div>

            {/* Secondary Layer: Quick Actions & Log */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Welcome, {user?.first_name || user?.username || 'User'} 👋
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Logged in as: <span className="font-semibold text-primary px-2 py-0.5 bg-blue-50 rounded-full text-blue-700">{getRoleDisplay(user?.role || 'GUEST')}</span>
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                        <p className="text-sm text-gray-500">Academic Year</p>
                        <p className="font-bold text-blue-700">{activeAcademic.year} - {activeAcademic.term}</p>
                    </div>
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold border-2 border-white shadow-sm">
                        {(user?.username?.[0] || 'U').toUpperCase()}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card p-6 shadow-xl border-top-4 border-primary h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                                <Activity size={16} /> Quick Operations
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <button className="btn btn-primary w-full justify-between group py-3" onClick={() => navigate('/students')}>
                                <span className="flex items-center gap-2"><Users size={16} /> Enroll New Student</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="btn btn-outline w-full justify-between group py-3" onClick={() => setIsStaffModalOpen(true)}>
                                <span className="flex items-center gap-2"><Star size={16} /> Register Faculty</span>
                                <Plus size={16} />
                            </button>
                            <button className="btn btn-outline w-full justify-between group py-3" onClick={() => navigate('/finance')}>
                                <span className="flex items-center gap-2"><DollarSign size={16} /> Post Payment</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Activity & Highlights */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="card p-6 border-top-4 border-info shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                                <Calendar size={16} /> Calendar Events
                            </h3>
                            <span className="text-[10px] font-black text-info uppercase">Today</span>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                                <Calendar size={16} /> Calendar Events
                            </h3>
                            <button className="btn btn-xs btn-outline" onClick={() => setIsEventModalOpen(true)}><Plus size={12} /></button>
                        </div>
                        <div className="space-y-4">
                            {events.length === 0 ? <p className="text-center text-[10px] text-secondary italic py-4">No events scheduled today.</p> : events.slice(0, 3).map((ev: any) => (
                                <div key={ev.id} className="p-3 bg-secondary-light rounded-xl border-left-4 border-info">
                                    <p className="text-[10px] font-black uppercase text-secondary mb-1">{ev.event_type} • {ev.start_time || 'All Day'}</p>
                                    <p className="text-xs font-bold font-primary">{ev.title}</p>
                                    <p className="text-[10px] text-secondary">{ev.location || 'Campus'}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card p-6 border-top-4 border-warning shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                                <Bell size={16} /> System Alerts
                            </h3>
                            <button className="btn btn-xs btn-outline" onClick={() => setIsAlertModalOpen(true)}><Plus size={12} /></button>
                        </div>
                        <div className="text-center py-6 space-y-4">
                            {alerts.length === 0 ? (
                                <>
                                    <ShieldCheck className="mx-auto text-success-light mb-2" size={40} />
                                    <p className="text-[10px] font-black uppercase text-secondary">All systems nominal</p>
                                    <p className="text-[9px] text-secondary mt-1">No active alerts</p>
                                </>
                            ) : alerts.slice(0, 2).map((alert: any) => (
                                <div key={alert.id} className={`p - 2 rounded border ${alert.severity === 'CRITICAL' ? 'bg-error/10 border-error text-error' : 'bg-warning/10 border-warning text-warning'} `}>
                                    <p className="text-[10px] font-black uppercase mb-1">{alert.title}</p>
                                    <p className="text-[9px]">{alert.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title="Quick Staff Registration">
                <form onSubmit={handleStaffSubmit} className="p-4 space-y-4">
                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase">Employee ID *</label>
                        <input type="text" className="input" value={staffFormData.employee_id} onChange={(e) => setStaffFormData({ ...staffFormData, employee_id: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase">Full Name *</label>
                        <input type="text" className="input" value={staffFormData.full_name} onChange={(e) => setStaffFormData({ ...staffFormData, full_name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase">Role *</label>
                        <select className="select" value={staffFormData.role} onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value })} required>
                            <option value="TEACHER">Teacher</option>
                            <option value="WARDEN">Hostel Warden</option>
                            <option value="NURSE">Nurse</option>
                            <option value="ACCOUNTANT">Accountant</option>
                            <option value="ADMIN">Admin/Principal</option>
                        </select>
                    </div>
                    <div className="modal-footer pt-6">
                        <button type="submit" className="btn btn-primary w-full font-black uppercase tracking-widest py-3">PROCESS REGISTRATION</button>
                    </div>
                </form>
            </Modal>

            {/* Alert Modal */}
            <Modal isOpen={isAlertModalOpen} onClose={() => setIsAlertModalOpen(false)} title="Broadcast System Alert">
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    try { await academicsAPI.alerts.create(alertForm); setIsAlertModalOpen(false); loadDashboardData(); alert('Alert Broadcasted'); } catch (err) { alert('Failed to post alert'); }
                }}>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Title</label><input type="text" className="input" value={alertForm.title} onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })} required /></div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Severity</label>
                        <select className="select" value={alertForm.severity} onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })}>
                            <option value="INFO">Info (Blue)</option><option value="WARNING">Warning (Yellow)</option><option value="CRITICAL">Critical (Red)</option><option value="SUCCESS">Success (Green)</option>
                        </select>
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Message</label><textarea className="input" value={alertForm.message} onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })} required></textarea></div>
                    <button type="submit" className="btn btn-sm btn-primary w-full font-black uppercase mt-2">Broadcast Alert</button>
                </form>
            </Modal>

            {/* Event Modal */}
            <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title="Schedule School Event">
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    try { await academicsAPI.events.create(eventForm); setIsEventModalOpen(false); loadDashboardData(); alert('Event Scheduled'); } catch (err) { alert('Failed to schedule event'); }
                }}>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Event Title</label><input type="text" className="input" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Date</label><input type="date" className="input" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Time</label><input type="time" className="input" value={eventForm.start_time} onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Location</label><input type="text" className="input" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="e.g. Main Hall" /></div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Category</label>
                        <select className="select" value={eventForm.event_type} onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}>
                            <option value="GENERAL">General</option><option value="ACADEMIC">Academic</option><option value="SPORTS">Sports</option><option value="HOLIDAY">Holiday</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-sm btn-primary w-full font-black uppercase mt-2">Publish Event</button>
                </form>
            </Modal>
        </div>
    );
};

export default Dashboard;

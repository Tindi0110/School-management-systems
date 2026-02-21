import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, BookOpen, CreditCard, ShieldAlert, Heart, FileText,
    ArrowLeft, Printer, Edit, Phone, TrendingUp, AlertTriangle,
    Plus, MessageSquare, FilePlus, Users, Trash2, History as HistoryIcon, ShieldCheck,
    Mail, MessageCircle, Send
} from 'lucide-react';
import { studentsAPI, academicsAPI, financeAPI, libraryAPI } from '../api/api';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';

type TabType = 'SUMMARY' | 'ACADEMIC' | 'FINANCE' | 'DISCIPLINE' | 'HEALTH' | 'ACTIVITIES' | 'DOCUMENTS';

const StudentProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('SUMMARY');
    const [student, setStudent] = useState<any>(null);
    const [results, setResults] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [adjustments, setAdjustments] = useState<any[]>([]);
    const [discipline, setDiscipline] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [parents, setParents] = useState<any[]>([]);
    const [unreturnedBooks, setUnreturnedBooks] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const toast = useToast();
    const { confirm } = useConfirm();

    // Modals
    const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState(false);
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferClassId, setTransferClassId] = useState('');
    const [classes, setClasses] = useState<any[]>([]);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await academicsAPI.classes.getAll();
                setClasses(res.data?.results ?? res.data ?? []);
            } catch (e) {
                // Silent
            }
        };
        fetchClasses();
    }, []);

    const [disciplineForm, setDisciplineForm] = useState({
        incident_date: new Date().toISOString().split('T')[0],
        offence_category: '',
        description: '',
        action_taken: '',
        student: Number(id)
    });

    const [healthForm, setHealthForm] = useState({
        blood_group: '',
        allergies: '',
        chronic_conditions: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        student: Number(id)
    });
    const [healthId, setHealthId] = useState<number | null>(null);
    const [disciplineId, setDisciplineId] = useState<number | null>(null);
    const [activityId, setActivityId] = useState<number | null>(null);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [activityForm, setActivityForm] = useState({ name: '', role: '', year: new Date().getFullYear(), activity_type: 'Club' });
    const [documentForm, setDocumentForm] = useState<any>({ doc_type: 'OTHER', file: null });

    useEffect(() => {
        if (id) loadStudentData();
    }, [id]);

    const loadStudentData = async () => {
        setLoading(true);
        try {
            const [studentRes, resultsRes, disciplineRes, activitiesRes, documentsRes, parentsRes] = await Promise.all([
                studentsAPI.getOne(Number(id)),
                academicsAPI.results.getAll({ student_id: Number(id) }),
                studentsAPI.discipline.getAll(Number(id)),
                studentsAPI.activities.getAll(Number(id)),
                studentsAPI.documents.getAll(Number(id)),
                studentsAPI.parents.getForStudent(Number(id)),
            ]);
            const d = (r: any) => r?.data?.results ?? r?.data ?? [];
            setStudent(studentRes.data);
            setResults(d(resultsRes));
            setDiscipline(d(disciplineRes));
            setActivities(d(activitiesRes));
            setDocuments(d(documentsRes));
            setParents(d(parentsRes));

            setHealthForm({
                blood_group: studentRes.data.health_record?.blood_group || '',
                allergies: studentRes.data.health_record?.allergies || '',
                chronic_conditions: studentRes.data.health_record?.chronic_conditions || '',
                emergency_contact_name: studentRes.data.health_record?.emergency_contact_name || studentRes.data.guardian_name || '',
                emergency_contact_phone: studentRes.data.health_record?.emergency_contact_phone || studentRes.data.guardian_phone || '',
                student: Number(id)
            });
            setHealthId(studentRes.data.health_record?.id || null);

            const studentUser = studentRes.data.user;

            // Secondary Fetches
            try {
                const [pRes, iRes, aRes, lendingsRes] = await Promise.all([
                    financeAPI.payments.getAll({ invoice__student: Number(id) }),
                    financeAPI.invoices.getAll({ student: Number(id) }),
                    financeAPI.adjustments.getAll({ invoice__student: Number(id) }),
                    studentUser ? libraryAPI.lendings.getAll({ user: studentUser, date_returned__isnull: true }) : Promise.resolve({ data: [] })
                ]);

                setPayments(d(pRes));
                setInvoices(d(iRes));
                setAdjustments(d(aRes));

                if (studentUser) {
                    const allLendings = d(lendingsRes);
                    // Double check filtering locally in case backend doesn't support the query params yet
                    const activeLendings = allLendings.filter((l: any) => l.user === studentUser && !l.date_returned);
                    setUnreturnedBooks(activeLendings.length);
                }
            } catch (e) {
                console.error("Secondary Data Load Error:", e);
            }

        } catch (error: any) {
            console.error("Load Student Error:", error);
            setError(error.response?.data?.detail || error.message || "Failed to load student profile.");
        } finally {
            setLoading(false);
        }
    };

    const statement = React.useMemo(() => {
        const items: any[] = [];

        invoices.forEach(inv => {
            items.push({
                date: inv.date_generated,
                description: `Invoice: Term ${inv.term} - ${inv.academic_year_name}`,
                reference: inv.invoice_number,
                debit: Number(inv.total_amount),
                credit: 0,
                type: 'CHARGE'
            });
        });

        payments.forEach(p => {
            items.push({
                date: p.payment_date,
                description: `Fee Payment - ${p.payment_method}`,
                reference: p.transaction_id,
                debit: 0,
                credit: Number(p.amount),
                type: 'PAYMENT'
            });
        });

        adjustments.forEach(adj => {
            items.push({
                date: adj.date_adjusted || new Date().toISOString(),
                description: `Adjustment: ${adj.reason}`,
                reference: 'ADJ-' + adj.id,
                debit: adj.adjustment_type === 'DEBIT' ? Number(adj.amount) : 0,
                credit: adj.adjustment_type === 'WAIVER' || adj.adjustment_type === 'CREDIT' ? Number(adj.amount) : 0,
                type: 'ADJUSTMENT'
            });
        });

        // Calculate running balance
        let balance = 0;
        return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(item => {
                balance += (item.debit - item.credit);
                return { ...item, balance };
            });
    }, [invoices, payments, adjustments]);

    const handleDisciplineSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (disciplineId) {
                await studentsAPI.discipline.update(disciplineId, { ...disciplineForm, student: Number(id) });
                toast.success('Discipline record updated');
            } else {
                await studentsAPI.discipline.create({ ...disciplineForm, student: Number(id) });
                toast.success('Discipline record created');
            }
            loadStudentData();
            setIsDisciplineModalOpen(false);
            setDisciplineId(null);
        } catch (err: any) {
            toast.error(err.message || 'Failed to save record');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditDiscipline = (d: any) => {
        setDisciplineId(d.id);
        setDisciplineForm({
            incident_date: d.incident_date,
            offence_category: d.offence_category,
            description: d.description,
            action_taken: d.action_taken,
            student: Number(id)
        });
        setIsDisciplineModalOpen(true);
    };

    const handleDeleteDiscipline = async (dId: number) => {
        if (await confirm('Permanently delete this record?')) {
            try {
                await studentsAPI.discipline.delete(dId);
                toast.success('Record deleted');
                loadStudentData();
            } catch (err) { toast.error('Failed to delete record'); }
        }
    };

    const handleDeleteHealth = async () => {
        if (!healthId || !(await confirm('Clear all medical data for this student?'))) return;
        try {
            await studentsAPI.health.delete(healthId);
            setHealthId(null);
            setHealthForm({ ...healthForm, blood_group: '', allergies: '', chronic_conditions: '', emergency_contact_name: '', emergency_contact_phone: '' });
            loadStudentData();
            setIsHealthModalOpen(false);
            toast.success('Medical record cleared');
        } catch (err) { toast.error('Failed to clear data'); }
    };

    const handleHealthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (healthId) {
                await studentsAPI.health.update(healthId, { ...healthForm, student: Number(id) });
            } else {
                await studentsAPI.health.create({ ...healthForm, student: Number(id) });
            }
            loadStudentData();
            setIsHealthModalOpen(false);
            toast.success('Health record updated successfully');
        } catch (err) {
            toast.error('Failed to update medical info');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await studentsAPI.update(Number(id), student);
            loadStudentData();
            setIsEditModalOpen(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setIsSubmitting(false);
        }
    };




    const handleActivitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (activityId) {
                await studentsAPI.activities.update(activityId, { ...activityForm, student: Number(id) });
            } else {
                await studentsAPI.activities.create({ ...activityForm, student: Number(id) });
            }
            loadStudentData();
            setIsActivityModalOpen(false);
            setActivityId(null);
            toast.success(activityId ? 'Activity updated' : 'Activity added');
        } catch (err) { toast.error('Failed to save activity'); }
        finally { setIsSubmitting(false); }
    };

    const handleEditActivity = (act: any) => {
        setActivityId(act.id);
        setActivityForm({
            name: act.name,
            role: act.role,
            year: act.year,
            activity_type: act.activity_type || 'Club'
        });
        setIsActivityModalOpen(true);
    };

    const handleDeleteActivity = async (actId: number) => {
        if (await confirm('Remove this activity record?')) {
            try {
                await studentsAPI.activities.delete(actId);
                toast.success('Activity record removed');
                loadStudentData();
            } catch (err) { toast.error('Failed to remove activity'); }
        }
    };

    const handleDocumentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!documentForm.file) return toast.warning('Please select a file');
        setIsSubmitting(true);
        try {
            await studentsAPI.documents.create({ ...documentForm, student: Number(id) });
            loadStudentData();
            setIsDocumentModalOpen(false);
            toast.success('Document uploaded successfully');
        } catch (err) { toast.error('Failed to upload document'); }
        finally { setIsSubmitting(false); }
    };

    const handleDeleteDocument = async (docId: number) => {
        if (await confirm('Delete this document? This cannot be undone.')) {
            try {
                await studentsAPI.documents.delete(docId);
                toast.success('Document deleted');
                loadStudentData();
            } catch (err) { toast.error('Failed to delete document'); }
        }
    };

    if (loading) return <div className="spinner-container flex items-center justify-center p-20"><div className="spinner"></div></div>;
    // Loading & Error States
    if (loading) return <div className="p-12 text-center animate-pulse">Loading student profile...</div>;

    if (error) return (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="bg-red-50 text-red-600 p-4 rounded-full"><ShieldAlert size={48} /></div>
            <h3 className="text-xl font-bold text-gray-800">Error Loading Profile</h3>
            <p className="text-gray-500 max-w-md">{error}</p>
            <div className="flex gap-2">
                <Button onClick={() => navigate('/students')} variant="outline" icon={<ArrowLeft size={16} />}>Back to List</Button>
                <Button onClick={() => { setError(null); loadStudentData(); }} variant="primary" icon={<HistoryIcon size={16} />}>Retry</Button>
            </div>
        </div>
    );

    if (!student) return <div className="p-12 text-center text-error font-black uppercase">Student record not found (404)</div>;

    const tabs: { id: TabType, label: string, icon: any }[] = [
        { id: 'SUMMARY', label: 'Dashboard', icon: <TrendingUp size={16} /> },
        { id: 'ACADEMIC', label: 'Academics', icon: <BookOpen size={16} /> },
        { id: 'FINANCE', label: 'Financials', icon: <CreditCard size={16} /> },
        { id: 'DISCIPLINE', label: 'Discipline', icon: <ShieldAlert size={16} /> },
        { id: 'HEALTH', label: 'Health & Welfare', icon: <Heart size={16} /> },
        { id: 'ACTIVITIES', label: 'Activities & Clubs', icon: <Users size={16} /> },
        { id: 'DOCUMENTS', label: 'Archive/Docs', icon: <FileText size={16} /> },
    ];

    // --- Actions ---
    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await studentsAPI.patch(Number(id), { current_class: Number(transferClassId) });
            toast.success('Student transferred successfully.');
            setIsTransferModalOpen(false);
            loadStudentData();
        } catch (error: any) {
            toast.error(error.message || 'Transfer failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrintClearance = () => {
        window.print();
    };

    const handleSuspend = async () => {
        if (await confirm('Are you sure you want to SUSPEND this student? access will be restricted.')) {
            try {
                await studentsAPI.patch(Number(id), { status: 'SUSPENDED' });
                toast.success('Student Suspended.');
                loadStudentData();
            } catch (error) { toast.error('Action failed.'); }
        }
    };

    const handleForceDelete = async () => {
        if (await confirm('DANGER: This will PERMANENTLY DELETE the student and ALL linked records (Results, Hostels, Invoices). This action cannot be undone. Are you sure?')) {
            try {
                await studentsAPI.delete(Number(id)); // Try normal delete first
                toast.success('Student deleted successfully.');
                navigate('/students');
            } catch (error: any) {
                console.error(error);
                // If normal delete fails, try force delete (custom endpoint)
                if (await confirm('Standard delete failed due to linked records. Attempt FORCE DELETE?')) {
                    try {
                        await studentsAPI.forceDelete(Number(id));
                        toast.success('Student FORCE DELETED successfully.');
                        navigate('/students');
                    } catch (forceErr) {
                        toast.error('Force delete also failed. Please contact admin.');
                    }
                }
            }
        }
    };

    const handleWhatsApp = () => {
        const primaryParent = parents.find(p => p.is_primary) || parents[0];
        const phone = primaryParent?.phone_number || student.guardian_phone || '';
        const name = primaryParent?.full_name || student.guardian_name || 'Guardian';
        const message = encodeURIComponent(`Hello ${name}, this is regarding ${student.full_name} (ADM: ${student.admission_number}). `);
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
    };

    const handleEmail = () => {
        const primaryParent = parents.find(p => p.is_primary) || parents[0];
        const email = primaryParent?.email || student.guardian_email || '';
        const subject = encodeURIComponent(`Regarding ${student.full_name} - ${student.admission_number}`);
        window.location.href = `mailto:${email}?subject=${subject}`;
    };

    const handleDirectSMS = () => {
        const primaryParent = parents.find(p => p.is_primary) || parents[0];
        const phone = primaryParent?.phone_number || student.guardian_phone || '';
        window.location.href = `sms:${phone}`;
    };

    const handleMessage = async () => {
        toast.info('Direct SMS messaging feature is being integrated with the gateway. Please use the Messenger tab for now.');
    };

    const handleTranscriptPrint = () => {
        const printContent = document.getElementById('transcript-form');
        const win = window.open('', '', 'height=700,width=800');
        win?.document.write('<html><head><title>Academic Transcript</title>');
        win?.document.write('</head><body>');
        win?.document.write(printContent?.innerHTML || '');
        win?.document.write('</body></html>');
        win?.document.close();
        win?.print();
    };

    // --- State ---


    // ... (keep existing modals)

    return (
        <div className="fade-in pb-12 w-full max-w-full overflow-x-hidden">
            {/* Header ... (keep existing) */}
            <div className="flex justify-between items-center mb-6 no-print">
                <Button variant="outline" size="sm" onClick={() => navigate('/students')} icon={<ArrowLeft size={16} />}>
                    BACK TO REGISTRY
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsClearanceModalOpen(true)} icon={<Printer size={16} />}>
                        CLEARANCE FORM
                    </Button>
                    <Button variant="primary" size="sm" className="font-black" onClick={() => setIsEditModalOpen(true)} icon={<Edit size={14} />}>
                        EDIT PROFILE
                    </Button>
                </div>
            </div>

            {/* Stats Card ... (keep existing) */}
            <div className="card mb-8 overflow-hidden border">
                <div className="h-24 bg-primary relative">
                    <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-2xl shadow-lg no-print border">
                        <div className="w-24 h-24 rounded-xl bg-secondary-light flex items-center justify-center text-secondary">
                            {student.photo ? <img src={student.photo} alt="Profile" className="w-full h-full object-cover rounded-xl" /> : <User size={48} />}
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

                <div className="flex flex-wrap border-top bg-secondary-light/30 px-4 py-2 gap-1 no-print">
                    {tabs.map(tab => (
                        <button key={tab.id}
                            className={`flex items-center gap-2 px-8 py-5 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border-bottom-2 whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>



            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    {/* ... (SUMMARY tab remains same) ... */}
                    {activeTab === 'SUMMARY' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="card flex flex-col items-center text-center border-top-4 border-success">
                                    <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mb-3"><TrendingUp size={24} /></div>
                                    <h4 className="font-black text-xs uppercase text-secondary mb-1">Average Grade</h4>
                                    <h2 className="mb-0 font-black text-primary">{student.average_grade || 'N/A'}</h2>
                                </div>
                                <div className="card flex flex-col items-center text-center border-top-4 border-info">
                                    <div className="w-12 h-12 rounded-full bg-info/10 text-info flex items-center justify-center mb-3"><HistoryIcon size={24} /></div>
                                    <h4 className="font-black text-xs uppercase text-secondary mb-1">Attendance</h4>
                                    <h2 className="mb-0 font-black text-primary">{student.attendance_percentage}%</h2>
                                </div>
                                <div className="card flex flex-col items-center text-center border-top-4 border-error">
                                    <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mb-3"><ShieldAlert size={24} /></div>
                                    <h4 className="font-black text-xs uppercase text-secondary mb-1">Incident Rep.</h4>
                                    <h2 className="mb-0 font-black text-primary">{discipline.length}</h2>
                                </div>
                            </div>
                            <div className="card overflow-hidden border">
                                <div className="p-4 bg-primary text-white flex justify-between items-center">
                                    <h3 className="mb-0 text-xs font-black uppercase tracking-widest">Institutional Timeline</h3>
                                    <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-primary">
                                        EXPORT HISTORY
                                    </Button>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-6">
                                        {results.length === 0 ? <p className="text-secondary italic text-xs uppercase font-bold text-center py-8">No assessment data found</p> :
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
                                        }
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'DISCIPLINE' && (
                        <div className="space-y-6">
                            {/* ... (Keep Discipline Logic, it was fine) ... */}
                            <div className="flex justify-between items-center px-2">
                                <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-secondary">Behavioral Log</h3>
                                <Button variant="danger" size="sm" className="font-black shadow-lg" onClick={() => {
                                    setDisciplineId(null);
                                    setDisciplineForm({ incident_date: new Date().toISOString().split('T')[0], offence_category: '', description: '', action_taken: '', student: Number(id) });
                                    setIsDisciplineModalOpen(true);
                                }} icon={<Plus size={14} />}>
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
                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEditDiscipline(d); }} icon={<Edit size={14} />} title="Edit" />
                                                <Button variant="ghost" size="sm" className="text-error" onClick={(e) => { e.stopPropagation(); handleDeleteDiscipline(d.id); }} icon={<Trash2 size={14} />} title="Delete" />
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
                    )}

                    {activeTab === 'HEALTH' && (
                        <div className="space-y-6">
                            {/* ... (Keep Health Logic) ... */}
                            <div className="flex justify-between items-center px-2">
                                <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-secondary">Medical & Welfare Profile</h3>
                                <div className="flex gap-2">
                                    {healthId && (
                                        <Button variant="outline" size="sm" className="text-error font-black shadow-lg" onClick={handleDeleteHealth} icon={<Trash2 size={14} />}>
                                            CLEAR DATA
                                        </Button>
                                    )}
                                    <Button variant="secondary" size="sm" className="font-black shadow-lg" onClick={() => setIsHealthModalOpen(true)} icon={<Edit size={14} />}>
                                        UPDATE MEDICAL INFO
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="card border-top-4 border-info">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Heart className="text-info" size={20} />
                                        <h3 className="mb-0 text-xs font-black uppercase tracking-widest">Vital Records</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-bottom pb-2">
                                            <span className="text-[11px] font-black text-secondary uppercase">Blood Group</span>
                                            <span className="text-[11px] font-black text-primary uppercase">{student.health_record?.blood_group || 'UNDECLARED'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] font-black text-secondary uppercase opacity-70">Known Allergies</span>
                                            <p className={`text-xs font-bold p-2 rounded ${student.health_record?.allergies && student.health_record.allergies !== 'None' ? 'bg-error-light text-error' : 'bg-success-light text-success'}`}>
                                                {student.health_record?.allergies || 'NO RECORDED ALLERGIES'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="card border-top-4 border-warning">
                                    <div className="flex items-center gap-3 mb-6">
                                        <AlertTriangle className="text-warning" size={20} />
                                        <h3 className="mb-0 text-xs font-black uppercase tracking-widest">Emergency Services</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-warning/10 rounded-lg">
                                            <p className="text-[10px] font-black text-warning uppercase mb-1">Primary Contact</p>
                                            <h4 className="font-black text-xs mb-0 uppercase text-primary">{healthForm.emergency_contact_name}</h4>
                                            <div className="flex items-center gap-2 text-xs font-bold mt-2"><Phone size={12} /> {healthForm.emergency_contact_phone}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ACADEMIC' && (
                        <div className="card overflow-hidden border">
                            <div className="p-4 border-bottom bg-secondary-light flex justify-between items-center no-column-mobile">
                                <h3 className="mb-0 text-xs font-black uppercase tracking-widest">Examination Ledger</h3>
                                <Button variant="primary" size="sm" onClick={handleTranscriptPrint}>Download Full Transcript</Button>
                            </div>

                            {/* Hidden Transcript Template inside ACADEMIC Tab */}
                            <div id="transcript-form" className="hidden">
                                <div className="report-container">
                                    <div className="report-header">
                                        <h1>OFFICIAL ACADEMIC TRANSCRIPT</h1>
                                        <p>School Management System</p>
                                    </div>
                                    <div className="report-grid">
                                        <div className="report-grid-item"><span className="report-grid-label">Student:</span> {student.full_name}</div>
                                        <div className="report-grid-item"><span className="report-grid-label">ADM:</span> {student.admission_number}</div>
                                        <div className="report-grid-item"><span className="report-grid-label">Class:</span> {student.class_name}</div>
                                        <div className="report-grid-item"><span className="report-grid-label">Mean Grade:</span> {student.average_grade || 'N/A'}</div>
                                        <div className="report-grid-item"><span className="report-grid-label">Attendance:</span> {student.attendance_percentage}%</div>
                                        <div className="report-grid-item"><span className="report-grid-label">Class Position:</span> {(() => {
                                            if (!results.length) return 'N/A';
                                            const avg = results.reduce((s: number, r: any) => s + parseFloat(r.score || 0), 0) / results.length;
                                            return `${Math.round(avg)}% overall`;
                                        })()}</div>
                                    </div>
                                    <table className="report-table">
                                        <thead>
                                            <tr>
                                                <th>Subject</th>
                                                <th>Exam</th>
                                                <th>Score</th>
                                                <th>Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map((r, i) => (
                                                <tr key={i}>
                                                    <td>{r.subject_name}</td>
                                                    <td>{r.exam_name}</td>
                                                    <td>{Math.round(r.score || r.marks_attained)}</td>
                                                    <td>{r.grade || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Exam</th>
                                            <th>Score</th>
                                            <th>Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center p-8 uppercase font-bold text-secondary text-xs">No academic records found</td></tr>
                                        ) : (
                                            results.map((r: any, i: number) => (
                                                <tr key={i} className="hover-bg-secondary">
                                                    <td className="font-bold text-[11px] uppercase">{r.subject_name}</td>
                                                    <td className="text-[11px] font-bold uppercase">{r.exam_name}</td>
                                                    <td className="font-black text-[11px] text-primary">{Math.round(r.score || r.marks_attained)}</td>
                                                    <td className="text-[11px] font-black uppercase">{r.grade || '-'}</td>
                                                </tr>
                                            ))
                                        )}
                                        {/* Summary Row */}
                                        {results.length > 0 && (() => {
                                            const validScores = results.map((r: any) => parseFloat(r.score || r.marks_attained || 0)).filter(s => !isNaN(s));
                                            const avgScore = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
                                            const meanGrade = student.average_grade || 'N/A';
                                            return (
                                                <tr className="bg-primary/5 border-top-2 border-primary">
                                                    <td colSpan={2} className="font-black text-[11px] uppercase text-primary px-3 py-3">SUMMARY</td>
                                                    <td className="font-black text-primary text-[11px] px-3">{avgScore.toFixed(1)}%</td>
                                                    <td className="font-black text-primary text-[11px] px-3 uppercase">{meanGrade}</td>
                                                </tr>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'FINANCE' && (
                        <div className="space-y-6">
                            {/* Financial Summary Cards - Stacked on Mobile, Row on Desktop */}
                            <div className="flex flex-wrap lg:flex-row gap-6 no-print pb-4">
                                {/* Accounting Statement Summary Card */}
                                <div className="card border border-primary/10 flex-1 min-w-full lg:min-w-0">
                                    <div className="p-4 border-bottom bg-secondary-light flex justify-between items-center">
                                        <h3 className="mb-0 text-xs font-black uppercase tracking-widest">Accounting Statement</h3>
                                        <div className="flex gap-2">
                                            <div className="text-right mr-4">
                                                <span className="text-[9px] font-black text-secondary uppercase block">Total Balance</span>
                                                <span className={`text-xs font-black ${Number(student.fee_balance || 0) === 0 ? 'text-success' : Number(student.fee_balance || 0) < 0 ? 'text-info' : 'text-error'}`}>KES {(student.fee_balance || 0).toLocaleString()}</span>
                                            </div>
                                            <Button variant="outline" size="sm" className="font-black py-1" onClick={() => window.print()}>GENERATE REPORT</Button>
                                        </div>
                                    </div>
                                    <div className="table-wrapper max-h-[500px]">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Description</th>
                                                    <th>Reference</th>
                                                    <th className="text-right">Debit</th>
                                                    <th className="text-right">Credit</th>
                                                    <th className="text-right">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {statement.length === 0 ? (
                                                    <tr><td colSpan={6} className="text-center py-8 text-[10px] font-black text-secondary uppercase">No historical transactions detected</td></tr>
                                                ) : (
                                                    statement.map((item, i) => (
                                                        <tr key={i} className="hover-bg-secondary">
                                                            <td className="text-[10px] font-bold whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                                                            <td className="text-[10px] font-bold uppercase text-secondary">{item.description}</td>
                                                            <td className="text-[10px] font-black text-primary">{item.reference}</td>
                                                            <td className="text-[10px] font-black text-error text-right">{item.debit > 0 ? `KES ${item.debit.toLocaleString()}` : '-'}</td>
                                                            <td className="text-[10px] font-black text-success text-right">{item.credit > 0 ? `KES ${item.credit.toLocaleString()}` : '-'}</td>
                                                            <td className={`text-[10px] font-black text-right ${item.balance === 0 ? 'text-success' : item.balance < 0 ? 'text-info' : 'text-error'}`}>KES {item.balance.toLocaleString()}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Right Column for Administrative & Rapid Communication */}
                                <div className="flex flex-col gap-6 w-full lg:w-80 flex-shrink-0">
                                    {/* Administrative Control */}
                                    <div className="card border-top-4 border-primary">
                                        <h4 className="text-[10px] font-black uppercase text-primary border-bottom pb-2 mb-4 tracking-widest flex items-center gap-2">
                                            <ShieldCheck size={14} /> Administrative Control
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-secondary"><span>Admission Date</span> <span className="text-primary">{new Date(student.admission_date).toLocaleDateString()}</span></div>
                                            <div className="flex justify-between items-start text-[10px] font-black uppercase text-secondary">
                                                <span>Primary Guardian</span>
                                                <div className="text-right">
                                                    <span className="text-primary block">{parents.find(p => p.is_primary)?.full_name || student.guardian_name}</span>
                                                    <span className="text-secondary text-[8px] block opacity-70 tracking-normal">{parents.find(p => p.is_primary)?.phone_number || student.guardian_phone}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-secondary"><span>House Unit</span> <span className="text-primary">{student.residence_details || student.hostel_name || 'DAY SCHOLAR'}</span></div>
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-secondary"><span>Transport</span> <span className="text-primary">{student.transport_details || 'NONE'}</span></div>
                                        </div>
                                        <div className="mt-8 space-y-2">
                                            <Button variant="outline" size="sm" className="w-full uppercase font-black py-2 tracking-widest" onClick={() => setIsTransferModalOpen(true)}>Transfer Unit</Button>
                                            <Button variant="ghost" size="sm" className="text-error w-full uppercase font-black py-2 tracking-widest" onClick={handleSuspend}>Restrict / Suspend</Button>
                                            <Button variant="danger" size="sm" className="w-full uppercase font-black py-2 tracking-widest mt-2" onClick={handleForceDelete}>PERMANENTLY DELETE</Button>
                                        </div>
                                    </div>

                                    {/* Rapid Communication */}
                                    <div className="card bg-primary text-white">
                                        <MessageSquare className="mb-4 opacity-50" size={32} />
                                        <h4 className="text-[10px] font-black uppercase mb-1 tracking-widest">Rapid Communication</h4>
                                        <p className="text-[10px] font-bold opacity-80 leading-relaxed mb-4">Instant contact regarding behavior or financial status.</p>

                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            <button onClick={handleWhatsApp} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all gap-1" title="WhatsApp">
                                                <MessageCircle size={18} />
                                                <span className="text-[8px] font-black uppercase">WA</span>
                                            </button>
                                            <button onClick={handleEmail} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all gap-1" title="Email">
                                                <Mail size={18} />
                                                <span className="text-[8px] font-black uppercase">Email</span>
                                            </button>
                                            <button onClick={handleDirectSMS} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all gap-1" title="SMS">
                                                <Send size={18} />
                                                <span className="text-[8px] font-black uppercase">SMS</span>
                                            </button>
                                        </div>

                                        <button className="btn btn-xs bg-white text-primary w-full uppercase font-black shadow-lg" onClick={handleMessage}>Open Messenger</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ACTIVITIES' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-2">
                                <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-secondary">Extra-Curricular Participation</h3>
                                <Button variant="primary" size="sm" className="font-black shadow-lg" onClick={() => {
                                    setActivityId(null);
                                    setActivityForm({ name: '', role: '', year: new Date().getFullYear(), activity_type: 'Club' });
                                    setIsActivityModalOpen(true);
                                }} icon={<Plus size={14} />}>
                                    JOIN CLUB/SPORT
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                {activities.length === 0 ? <p className="text-secondary italic text-xs uppercase font-bold text-center py-8 col-span-2">No extra-curricular activities recorded</p> :
                                    activities.map((act, i) => (
                                        <div key={i} className={`card p-6 border-left-4 border-primary shadow-md relative`}>
                                            <div className="absolute top-2 right-2 flex gap-2 z-50">
                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEditActivity(act); }} icon={<Edit size={14} />} title="Edit" />
                                                <Button variant="ghost" size="sm" className="text-error" onClick={(e) => { e.stopPropagation(); handleDeleteActivity(act.id); }} icon={<Trash2 size={14} />} title="Delete" />
                                            </div>
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-black text-xs uppercase text-primary mb-0">{act.name}</h4>
                                                <span className="text-[9px] font-black text-secondary uppercase bg-secondary-light px-2 py-0.5 rounded">{act.year}</span>
                                            </div>
                                            <p className="text-[10px] font-black text-secondary uppercase mb-2">Role: {act.role}</p>
                                            <div className="flex gap-2">
                                                <span className="badge badge-success badge-xxs px-2 py-0">ACTIVE PARTICIPANT</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'DOCUMENTS' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-2">
                                <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-secondary">Institutional Repository</h3>
                                <Button variant="primary" size="sm" className="font-black shadow-lg" onClick={() => setIsDocumentModalOpen(true)} icon={<FilePlus size={14} />}>
                                    ATTACH FILE
                                </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                {documents.length === 0 ? <p className="text-secondary italic text-xs uppercase font-bold text-center py-8 col-span-3">No documents archived</p> :
                                    documents.map((doc, i) => (
                                        <div key={i} className="card text-center hover-bg-secondary cursor-pointer border-dashed border-2 flex flex-col items-center gap-3 relative">
                                            <Button variant="ghost" size="sm" className="absolute top-2 right-2 text-error z-50" onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }} icon={<Trash2 size={14} />} title="Delete" />
                                            <div className="w-10 h-10 rounded-full bg-secondary-light flex items-center justify-center"><FileText className="text-primary" /></div>
                                            <h4 className="text-[10px] font-black uppercase text-primary mb-0">{doc.doc_type || 'DOCUMENT'}</h4>
                                            <p className="text-[9px] text-secondary font-bold mb-0 truncate w-full">{doc.file.split('/').pop()}</p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Sidebar Context */}
                <div className="col-span-12 lg:col-span-4 space-y-8 no-print">
                    {/* Only show these cards if NOT on the Finance tab, as we moved them to a scrollable row there */}
                    {activeTab !== 'FINANCE' && (
                        <>
                            <div className="card border-top-4 border-primary">
                                <h4 className="text-[10px] font-black uppercase text-primary border-bottom pb-2 mb-4 tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={14} /> Administrative Control
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-secondary"><span>Admission Date</span> <span className="text-primary">{new Date(student.admission_date).toLocaleDateString()}</span></div>
                                    <div className="flex justify-between items-start text-[10px] font-black uppercase text-secondary">
                                        <span>Primary Guardian</span>
                                        <div className="text-right">
                                            <span className="text-primary block">{parents.find(p => p.is_primary)?.full_name || student.guardian_name}</span>
                                            <span className="text-secondary text-[8px] block opacity-70 tracking-normal">{parents.find(p => p.is_primary)?.phone_number || student.guardian_phone}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-secondary"><span>House Unit</span> <span className="text-primary">{student.residence_details || student.hostel_name || 'DAY SCHOLAR'}</span></div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-secondary"><span>Transport</span> <span className="text-primary">{student.transport_details || 'NONE'}</span></div>
                                </div>
                                <div className="mt-8 space-y-2">
                                    <Button variant="outline" size="sm" className="w-full uppercase font-black py-2 tracking-widest" onClick={() => setIsTransferModalOpen(true)}>Transfer Unit</Button>
                                    <Button variant="ghost" size="sm" className="text-error w-full uppercase font-black py-2 tracking-widest" onClick={handleSuspend}>Restrict / Suspend</Button>
                                    <Button variant="danger" size="sm" className="w-full uppercase font-black py-2 tracking-widest mt-2" onClick={handleForceDelete}>PERMANENTLY DELETE</Button>
                                </div>
                            </div>

                            <div className="card bg-primary text-white">
                                <MessageSquare className="mb-4 opacity-50" size={32} />
                                <h4 className="text-[10px] font-black uppercase mb-1 tracking-widest">Rapid Communication</h4>
                                <p className="text-[10px] font-bold opacity-80 leading-relaxed mb-4">Send instant alerts or messages to guardian/parent.</p>

                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <button onClick={handleWhatsApp} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all gap-1" title="WhatsApp">
                                        <MessageCircle size={18} />
                                        <span className="text-[8px] font-black uppercase">WA</span>
                                    </button>
                                    <button onClick={handleEmail} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all gap-1" title="Email">
                                        <Mail size={18} />
                                        <span className="text-[8px] font-black uppercase">Email</span>
                                    </button>
                                    <button onClick={handleDirectSMS} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all gap-1" title="SMS">
                                        <Send size={18} />
                                        <span className="text-[8px] font-black uppercase">SMS</span>
                                    </button>
                                </div>

                                <button className="btn btn-xs bg-white text-primary w-full uppercase font-black shadow-lg" onClick={handleMessage}>Open Messenger</button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modals ... (keep existing) */}
            <Modal isOpen={isDisciplineModalOpen} onClose={() => setIsDisciplineModalOpen(false)} title="New Discipline Intervention" size="md">
                <form onSubmit={handleDisciplineSubmit} className="space-y-4 form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Incident Date</label><input type="date" className="input" value={disciplineForm.incident_date} onChange={e => setDisciplineForm({ ...disciplineForm, incident_date: e.target.value })} required /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Offence Category</label><input type="text" className="input" placeholder="e.g. Lateness, Theft" value={disciplineForm.offence_category} onChange={e => setDisciplineForm({ ...disciplineForm, offence_category: e.target.value })} required /></div>
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Detailed Description</label><textarea className="input" rows={3} value={disciplineForm.description} onChange={e => setDisciplineForm({ ...disciplineForm, description: e.target.value })} required></textarea></div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Action Taken</label><input type="text" className="input" placeholder="e.g. Suspension, Warning" value={disciplineForm.action_taken} onChange={e => setDisciplineForm({ ...disciplineForm, action_taken: e.target.value })} required /></div>
                    <div className="modal-footer pt-4">
                        <Button type="submit" variant="danger" className="w-full font-black uppercase shadow-lg" loading={isSubmitting} loadingText="Saving...">
                            Submit Institutional Record
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Transfer Modal */}
            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer Student Unit" size="sm">
                <form onSubmit={handleTransfer} className="space-y-4 form-container-sm mx-auto">
                    <p className="text-secondary text-xs">Select the new class/unit for this student.</p>
                    <select className="select" value={transferClassId} onChange={e => setTransferClassId(e.target.value)} required>
                        <option value="">Select New Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.stream}</option>)}
                    </select>
                    <div className="modal-footer pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={isSubmitting} loadingText="Processing...">
                            Process Transfer
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isHealthModalOpen} onClose={() => setIsHealthModalOpen(false)} title="Update Medical Integrity" size="md">
                <form onSubmit={handleHealthSubmit} className="space-y-4 form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Blood Group</label><input type="text" className="input" value={healthForm.blood_group} onChange={e => setHealthForm({ ...healthForm, blood_group: e.target.value })} /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Known Allergies</label><input type="text" className="input" value={healthForm.allergies} onChange={e => setHealthForm({ ...healthForm, allergies: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Chronic Conditions</label><textarea className="input" rows={2} value={healthForm.chronic_conditions} onChange={e => setHealthForm({ ...healthForm, chronic_conditions: e.target.value })}></textarea></div>
                    <div className="grid grid-cols-2 gap-md border-top pt-4">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Emergency Contact</label><input type="text" className="input" value={healthForm.emergency_contact_name} onChange={e => setHealthForm({ ...healthForm, emergency_contact_name: e.target.value })} required /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Emergency Phone</label><input type="tel" className="input" value={healthForm.emergency_contact_phone} onChange={e => setHealthForm({ ...healthForm, emergency_contact_phone: e.target.value })} required /></div>
                    </div>
                    <div className="modal-footer pt-4 flex justify-between gap-4">
                        {healthId && <Button type="button" variant="outline" className="text-error font-black uppercase" onClick={handleDeleteHealth}>Delete Record</Button>}
                        <Button type="submit" variant="secondary" className="font-black uppercase shadow-lg flex-grow" loading={isSubmitting} loadingText="Syncing...">
                            Sync Medical Database
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} title="Register Extra-Curricular Activity" size="md">
                <form onSubmit={handleActivitySubmit} className="space-y-4 form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Activity Name</label><input type="text" className="input" placeholder="e.g. Debate Club" value={activityForm.name} onChange={e => setActivityForm({ ...activityForm, name: e.target.value })} required /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Type</label>
                            <select className="select" value={activityForm.activity_type} onChange={e => setActivityForm({ ...activityForm, activity_type: e.target.value })}>
                                <option>Club</option><option>Sport</option><option>Arts</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Role / Position</label><input type="text" className="input" placeholder="e.g. Member, Captain" value={activityForm.role} onChange={e => setActivityForm({ ...activityForm, role: e.target.value })} /></div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Year</label><input type="number" className="input" value={activityForm.year} onChange={e => setActivityForm({ ...activityForm, year: parseInt(e.target.value) })} /></div>
                    <div className="modal-footer pt-4">
                        <Button type="submit" variant="primary" className="w-full font-black uppercase" loading={isSubmitting} loadingText="Registering...">
                            Register Participation
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDocumentModalOpen} onClose={() => setIsDocumentModalOpen(false)} title="Upload Institutional Document" size="sm">
                <form onSubmit={handleDocumentSubmit} className="space-y-4 form-container-sm mx-auto">
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Document Type</label>
                        <select className="select" value={documentForm.doc_type} onChange={e => setDocumentForm({ ...documentForm, doc_type: e.target.value })}>
                            <option value="BIRTH_CERT">Birth Certificate</option>
                            <option value="REPORT_CARD">Report Card</option>
                            <option value="TRANSFER_LETTER">Transfer Letter</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Select File</label><input type="file" className="file-input w-full" onChange={e => setDocumentForm({ ...documentForm, file: e.target.files?.[0] || null })} required /></div>
                    <div className="modal-footer pt-4">
                        <Button type="submit" variant="primary" className="w-full font-black uppercase" loading={isSubmitting} loadingText="Uploading...">
                            Upload to Archive
                        </Button>
                    </div>
                </form>
            </Modal>


            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Student Profile" size="md">
                <form onSubmit={handleEditSubmit} className="space-y-4 form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Full Name</label><input type="text" className="input" value={student.full_name} onChange={e => setStudent({ ...student, full_name: e.target.value })} required /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Admission Number</label><input type="text" className="input" value={student.admission_number} onChange={e => setStudent({ ...student, admission_number: e.target.value })} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Class</label>
                            <select className="select" value={student.current_class} onChange={e => setStudent({ ...student, current_class: e.target.value })}>
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.stream}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Category</label>
                            <select className="select" value={student.category} onChange={e => setStudent({ ...student, category: e.target.value })}>
                                <option value="DAY">Day Scholar</option>
                                <option value="BOARDING">Boarding</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Status</label>
                        <select className="select" value={student.status} onChange={e => setStudent({ ...student, status: e.target.value })}>
                            <option value="ACTIVE">Active</option>
                            <option value="SUSPENDED">Suspended</option>
                            <option value="WITHDRAWN">Withdrawn</option>
                            <option value="ALUMNI">Alumni</option>
                            <option value="TRANSFERRED">Transferred</option>
                        </select>
                    </div>
                    <div className="modal-footer pt-4">
                        <Button type="submit" variant="primary" className="w-full font-black uppercase" loading={isSubmitting} loadingText="Updating...">
                            Update Profile
                        </Button>
                    </div>
                </form>
            </Modal>


            <Modal isOpen={isClearanceModalOpen} onClose={() => setIsClearanceModalOpen(false)} title="Print Student Clearance" size="md">
                <div className="space-y-6 text-center">
                    <p className="text-secondary text-sm px-6">Download or print the official institutional clearance document for <strong>{student.full_name}</strong>. This document verifies the student's status across all departments.</p>
                    <div className="mx-auto max-w-xs p-6 bg-secondary-light/30 rounded-2xl border border-dashed border-primary/20 flex flex-col items-center gap-4 shadow-inner">
                        <FileText size={48} className="text-primary opacity-50" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Official Transcript & Clearance</span>
                    </div>
                    <div className="modal-footer pt-4 flex gap-4">
                        <Button variant="outline" className="flex-grow font-black uppercase" onClick={() => setIsClearanceModalOpen(false)}>Close</Button>
                        <Button variant="primary" className="flex-grow font-black uppercase shadow-lg" onClick={handlePrintClearance} icon={<Printer size={18} />}>
                            GENERATE PDF / PRINT
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Clearance Form Template */}
            <div id="clearance-form" className="hidden">
                <div className="report-container clearance-form">
                    <div className="report-header">
                        <h1>Student Clearance Form</h1>
                        <p>School Administration Details</p>
                    </div>
                    <p>This is to certify that <strong>{student.full_name}</strong> (ADM: <strong>{student.admission_number}</strong>) has successfully cleared with the following departments:</p>

                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Status</th>
                                <th>Signature/Stamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Academics (Books/Exams)</td><td>{unreturnedBooks > 0 ? `PENDING (${unreturnedBooks} Unreturned Books)` : 'CLEARED'}</td><td></td></tr>
                            <tr><td>Boarding/Hostel</td><td>{student.hostel_name ? `PENDING (Allocated to ${student.hostel_name})` : 'CLEARED'}</td><td></td></tr>
                            <tr><td>Finance/Accounts</td><td>{(student.fee_balance || 0) > 0 ? `OUTSTANDING BALANCE (KES ${student.fee_balance.toLocaleString()})` : 'CLEARED'}</td><td></td></tr>
                        </tbody>
                    </table>

                    <div className="signature-group">
                        <div className="signature-line">Student Signature</div>
                        <div className="signature-line">Principal Signature</div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default StudentProfile;

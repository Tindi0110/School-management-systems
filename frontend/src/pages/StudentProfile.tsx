import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, BookOpen, CreditCard, ShieldAlert, Heart, FileText,
    ArrowLeft, Printer, Edit, Phone, TrendingUp, AlertTriangle,
    Plus, MessageSquare, FilePlus, Users, Trash2
} from 'lucide-react';
import { studentsAPI, academicsAPI, financeAPI } from '../api/api';
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
    const [discipline, setDiscipline] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [parents, setParents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
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
                setClasses(res.data);
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
            setStudent(studentRes.data);
            setResults(resultsRes.data);
            setDiscipline(disciplineRes.data);
            setActivities(activitiesRes.data);
            setDocuments(documentsRes.data);
            setParents(parentsRes.data.results || parentsRes.data || []);

            setHealthForm({
                blood_group: studentRes.data.health_record?.blood_group || '',
                allergies: studentRes.data.health_record?.allergies || '',
                chronic_conditions: studentRes.data.health_record?.chronic_conditions || '',
                emergency_contact_name: studentRes.data.health_record?.emergency_contact_name || studentRes.data.guardian_name,
                emergency_contact_phone: studentRes.data.health_record?.emergency_contact_phone || studentRes.data.guardian_phone,
                student: Number(id)
            });
            setHealthId(studentRes.data.health_record?.id || null);

            const paymentsRes = await financeAPI.payments.getAll();
            setPayments(paymentsRes.data.filter((p: any) => p.student === Number(id)));

        } catch (error) {
            // Error
        } finally {
            setLoading(false);
        }
    };

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

    const handleClearancePrint = () => {
        const printContent = document.getElementById('clearance-form');
        const win = window.open('', '', 'height=700,width=800');
        win?.document.write('<html><head><title>Clearance Form</title>');
        win?.document.write('</head><body>');
        win?.document.write(printContent?.innerHTML || '');
        win?.document.write('</body></html>');
        win?.document.close();
        win?.print();
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
    if (!student) return <div className="p-12 text-center text-error font-black uppercase">Institutional integrity error: Student record not found</div>;

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
            loadStudentData();
        } catch (error: any) {
            toast.error(error.message || 'Transfer failed.');
        } finally {
            setIsSubmitting(false);
        }
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
        <div className="fade-in pb-12">
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
            <div className="card mb-8 overflow-hidden bg-white shadow-xl border">
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
                            <span className={`badge ${student.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '10px' }}>
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
                            <h2 className={`font-black mb-0 ${(student.fee_balance || 0) > 0 ? 'text-error' : 'text-success'}`}>
                                KES {(student.fee_balance || 0).toLocaleString()}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="flex border-top bg-secondary-light/30 px-4 overflow-x-auto scrollbar-hide no-print">
                    {tabs.map(tab => (
                        <button key={tab.id}
                            className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-bottom-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'}`}
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
                                <div className="card p-6 bg-white flex flex-col items-center text-center shadow-md border-top-4 border-success">
                                    <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mb-3"><TrendingUp size={24} /></div>
                                    <h4 className="font-black text-xs uppercase text-secondary mb-1">Average Grade</h4>
                                    <h2 className="mb-0 font-black text-primary">{student.average_grade || 'N/A'}</h2>
                                </div>
                                <div className="card p-6 bg-white flex flex-col items-center text-center shadow-md border-top-4 border-info">
                                    <div className="w-12 h-12 rounded-full bg-info/10 text-info flex items-center justify-center mb-3"><History size={24} /></div>
                                    <h4 className="font-black text-xs uppercase text-secondary mb-1">Attendance</h4>
                                    <h2 className="mb-0 font-black text-primary">{student.attendance_percentage}%</h2>
                                </div>
                                <div className="card p-6 bg-white flex flex-col items-center text-center shadow-md border-top-4 border-error">
                                    <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mb-3"><ShieldAlert size={24} /></div>
                                    <h4 className="font-black text-xs uppercase text-secondary mb-1">Incident Rep.</h4>
                                    <h2 className="mb-0 font-black text-primary">{discipline.length}</h2>
                                </div>
                            </div>
                            <div className="card p-0 overflow-hidden shadow-lg border">
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
                                                                <span className="badge badge-success text-[8px] px-2 py-0">GRADE: {r.grade || 'N/A'}</span>
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
                                <div className="card p-12 text-center bg-success/5 border-dashed border-2 border-success/20">
                                    <ShieldCheck size={48} className="mx-auto text-success mb-4" />
                                    <h3 className="text-success font-black uppercase text-sm">Pristine Conduct</h3>
                                    <p className="text-secondary text-xs font-bold uppercase mb-0">Official records show no disciplinary interventions</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {discipline.map((d, i) => (
                                        <div key={i} className="card p-5 border-left-4 border-error relative shadow-sm">
                                            <div className="absolute top-2 right-2 flex gap-2 z-50">
                                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEditDiscipline(d); }} icon={<Edit size={14} />} title="Edit" />
                                                <Button variant="ghost" size="sm" className="text-error" onClick={(e) => { e.stopPropagation(); handleDeleteDiscipline(d.id); }} icon={<Trash2 size={14} />} title="Delete" />
                                            </div>
                                            <div className="absolute top-4 right-12 text-[10px] font-black text-secondary uppercase">{new Date(d.incident_date).toLocaleDateString()}</div>
                                            <h4 className="font-black text-[11px] text-error uppercase mb-1">{d.offence_category}</h4>
                                            <p className="text-xs text-secondary font-bold mb-3">{d.description}</p>
                                            <div className="flex gap-4">
                                                <span className="badge badge-error" style={{ fontSize: '9px' }}>ACTION: {d.action_taken}</span>
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
                                <div className="card p-6 shadow-md border-top-4 border-info">
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
                                <div className="card p-6 shadow-md border-top-4 border-warning">
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
                        <div className="card p-0 overflow-hidden shadow-lg border">
                            <div className="p-4 border-bottom bg-secondary-light flex justify-between items-center">
                                <h3 className="mb-0 text-xs font-black uppercase tracking-widest">Examination Ledger</h3>
                                <Button variant="primary" size="sm" onClick={handleTranscriptPrint}>Download Full Transcript</Button>
                            </div>

                            {/* Hidden Transcript Template inside ACADEMIC Tab */}
                            <div id="transcript-form" className="hidden">
                                <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
                                    <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
                                        <h1>OFFICIAL ACADEMIC TRANSCRIPT</h1>
                                        <p>School Management System</p>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div><strong>Student:</strong> {student.full_name}</div>
                                        <div><strong>ADM:</strong> {student.admission_number}</div>
                                        <div><strong>Class:</strong> {student.class_name}</div>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                                        <thead>
                                            <tr style={{ background: '#eee' }}>
                                                <th style={{ border: '1px solid #000', padding: '5px' }}>Subject</th>
                                                <th style={{ border: '1px solid #000', padding: '5px' }}>Exam</th>
                                                <th style={{ border: '1px solid #000', padding: '5px' }}>Score</th>
                                                <th style={{ border: '1px solid #000', padding: '5px' }}>Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map((r, i) => (
                                                <tr key={i}>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{r.subject_name}</td>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{r.exam_name}</td>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{r.marks_attained}%</td>
                                                    <td style={{ border: '1px solid #000', padding: '5px' }}>{r.grade || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Term / Period</th>
                                        <th>Subject</th>
                                        <th>Score</th>
                                        <th>Grade</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center p-8 uppercase font-bold text-secondary text-xs">No academic records found</td></tr>
                                    ) : (
                                        results.map((r: any, i: number) => (
                                            <tr key={i} className="hover-bg-secondary">
                                                <td className="font-bold text-[11px] uppercase">{r.exam_name}</td>
                                                <td className="text-[11px] font-bold uppercase">{r.subject_name}</td>
                                                <td className="font-black text-[11px] text-primary">{Math.round(r.score || r.marks_attained)}%</td>
                                                <td className="text-[11px] font-black uppercase">{r.grade || 'N/A'}</td>
                                                <td><span className="badge badge-success px-2 py-0" style={{ fontSize: '8px' }}>VERIFIED</span></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'FINANCE' && (
                        <div className="card p-0 overflow-hidden shadow-lg border">
                            {/* ... (Keep Finance Logic) ... */}
                            <div className="p-4 border-bottom bg-secondary-light flex justify-between items-center">
                                <h3 className="mb-0 text-xs font-black uppercase tracking-widest">Accounting Statement</h3>
                                <Button variant="outline" size="sm" className="font-black py-1">GENERATE REPORT</Button>
                            </div>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Reference</th>
                                        <th>Mode</th>
                                        <th>Credit</th>
                                        <th>Equity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p, i) => (
                                        <tr key={i} className="hover-bg-secondary">
                                            <td className="text-[10px] font-bold">{new Date(p.payment_date).toLocaleDateString()}</td>
                                            <td className="text-[10px] font-black text-primary">{p.transaction_id}</td>
                                            <td className="text-[10px] uppercase font-black">{p.payment_method}</td>
                                            <td className="text-[10px] font-black text-success">KES {p.amount.toLocaleString()}</td>
                                            <td className="text-[10px] font-bold">REDUCED</td>
                                        </tr>
                                    ))}
                                    {payments.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[10px] font-black text-secondary uppercase">No historical transactions detected</td></tr>}
                                </tbody>
                            </table>
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
                                                <span className="badge badge-success px-2 py-0" style={{ fontSize: '8px' }}>ACTIVE PARTICIPANT</span>
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
                                        <div key={i} className="card p-5 text-center hover-bg-secondary cursor-pointer border-dashed border-2 flex flex-col items-center gap-3 relative">
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
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    <div className="card p-6 shadow-xl border-top-4 border-primary">
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

                    <div className="card p-6 shadow-xl bg-primary text-white">
                        <MessageSquare className="mb-4 opacity-50" size={32} />
                        <h4 className="text-[10px] font-black uppercase mb-1 tracking-widest">Rapid Communication</h4>
                        <p className="text-[10px] font-bold opacity-80 leading-relaxed mb-4">Send instant SMS alert to guardian regarding behavior or financial status.</p>
                        <button className="btn btn-xs bg-white text-primary w-full uppercase font-black shadow-lg" onClick={handleMessage}>Open Messenger</button>
                    </div>
                </div>
            </div>

            {/* Modals ... (keep existing) */}
            <Modal isOpen={isDisciplineModalOpen} onClose={() => setIsDisciplineModalOpen(false)} title="New Discipline Intervention" size="md">
                <form onSubmit={handleDisciplineSubmit} className="space-y-4">
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
                <form onSubmit={handleTransfer} className="space-y-4">
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
                <form onSubmit={handleHealthSubmit} className="space-y-4">
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
                <form onSubmit={handleActivitySubmit} className="space-y-4">
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
                <form onSubmit={handleDocumentSubmit} className="space-y-4">
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
                <form onSubmit={handleEditSubmit} className="space-y-4">
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

            {/* Clearance Form Template */}
            <div id="clearance-form" className="hidden">
                <div style={{ padding: '40px', fontFamily: 'serif', lineHeight: '1.6' }}>
                    <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '40px' }}>
                        <h1 style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>Student Clearance Form</h1>
                        <p>School Administration Details</p>
                    </div>
                    <p>This is to certify that <strong>{student.full_name}</strong> (ADM: <strong>{student.admission_number}</strong>) has successfully cleared with the following departments:</p>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '30px', marginBottom: '50px' }}>
                        <thead>
                            <tr>
                                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left' }}>Department</th>
                                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left' }}>Status</th>
                                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left' }}>Signature/Stamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td style={{ border: '1px solid #000', padding: '15px' }}>Academics (Books/Exams)</td><td style={{ border: '1px solid #000', padding: '15px' }}>CLEARED</td><td style={{ border: '1px solid #000', padding: '15px' }}></td></tr>
                            <tr><td style={{ border: '1px solid #000', padding: '15px' }}>Boarding/Hostel</td><td style={{ border: '1px solid #000', padding: '15px' }}>{student.category === 'BOARDING' ? 'PENDING' : 'N/A'}</td><td style={{ border: '1px solid #000', padding: '15px' }}></td></tr>
                            <tr><td style={{ border: '1px solid #000', padding: '15px' }}>Sports/Games</td><td style={{ border: '1px solid #000', padding: '15px' }}>CLEARED</td><td style={{ border: '1px solid #000', padding: '15px' }}></td></tr>
                            <tr><td style={{ border: '1px solid #000', padding: '15px' }}>Finance/Accounts</td><td style={{ border: '1px solid #000', padding: '15px' }}>{(student.fee_balance || 0) > 0 ? 'OUTSTANDING BALANCE' : 'CLEARED'}</td><td style={{ border: '1px solid #000', padding: '15px' }}></td></tr>
                        </tbody>
                    </table>

                    <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '5px' }}>Student Signature</div>
                        </div>
                        <div>
                            <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '5px' }}>Principal Signature</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .border-left-4 { border-left-width: 4px; }
                .border-top-4 { border-top-width: 4px; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

export default StudentProfile;

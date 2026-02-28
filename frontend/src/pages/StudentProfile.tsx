import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Modular Components
import ProfileHeader from './students/profile/ProfileHeader';
import ProfileSummary from './students/profile/ProfileSummary';
import AcademicHistory from './students/profile/AcademicHistory';
import FinanceHistory from './students/profile/FinanceHistory';
import DisciplineLog from './students/profile/DisciplineLog';
import HealthWelfare from './students/profile/HealthWelfare';
import ExtraCurriculars from './students/profile/ExtraCurriculars';
import DocumentArchive from './students/profile/DocumentArchive';
import FamilyGuardian from './students/profile/FamilyGuardian';
import ProfileSidebar from './students/profile/ProfileSidebar';
import ProfileModals from './students/profile/ProfileModals';
import { studentsAPI, academicsAPI, financeAPI, libraryAPI } from '../api/api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import type { Student, Parent, DisciplineIncident, StudentDocument, Activity } from '../types/student.types';
import type { StudentResult } from '../types/academic.types';

type TabType = 'SUMMARY' | 'ACADEMIC' | 'FINANCE' | 'DISCIPLINE' | 'HEALTH' | 'ACTIVITIES' | 'DOCUMENTS' | 'FAMILY';

const StudentProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('SUMMARY');
    const [student, setStudent] = useState<Student | null>(null);
    const [results, setResults] = useState<StudentResult[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [adjustments, setAdjustments] = useState<any[]>([]);
    const [discipline, setDiscipline] = useState<DisciplineIncident[]>([]);
    const [documents, setDocuments] = useState<StudentDocument[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [parents, setParents] = useState<Parent[]>([]);
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
    const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [transferClassId, setTransferClassId] = useState('');
    const [classes, setClasses] = useState<any[]>([]);
    const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
    const [searchPhone, setSearchPhone] = useState('');
    const [isSearchingParent, setIsSearchingParent] = useState(false);

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
    const [isCreatingNewGuardian, setIsCreatingNewGuardian] = useState(false);
    const [newGuardianForm, setNewGuardianForm] = useState({ full_name: '', phone: '', email: '', relation: 'PARENT' });



    const loadCoreStudentData = async () => {
        setLoading(true);
        try {
            const [studentRes, parentsRes, libRes, resRes] = await Promise.all([
                studentsAPI.getOne(Number(id)),
                studentsAPI.parents.getForStudent(Number(id)),
                libraryAPI.lendings.getAll({ student_id: Number(id) }), // Fetch all lendings for this student
                academicsAPI.results.getAll({ student_id: Number(id) })
            ]);

            setStudent(studentRes.data);
            setParents(parentsRes.data?.results ?? parentsRes.data ?? []);

            // Calculate unreturned books locally for accuracy
            const allLendings = libRes.data?.results ?? libRes.data ?? [];
            const unreturned = allLendings.filter((l: any) => !l.date_returned).length;
            setUnreturnedBooks(unreturned);

            setResults(resRes.data?.results ?? resRes.data ?? []);

            setHealthForm({
                blood_group: studentRes.data.health_record?.blood_group || '',
                allergies: studentRes.data.health_record?.allergies || '',
                chronic_conditions: studentRes.data.health_record?.chronic_conditions || '',
                emergency_contact_name: studentRes.data.health_record?.emergency_contact_name || studentRes.data.guardian_name || '',
                emergency_contact_phone: studentRes.data.health_record?.emergency_contact_phone || studentRes.data.guardian_phone || '',
                student: Number(id)
            });
            setHealthId(studentRes.data.health_record?.id || null);

        } catch (error: any) {
            console.error("Load Core Student Error:", error);
            setError(error.response?.data?.detail || error.message || "Failed to load student profile.");
        } finally {
            setLoading(false);
        }
    };

    const loadTabData = async () => {
        const d = (r: any) => r?.data?.results ?? r?.data ?? [];
        try {
            if (activeTab === 'ACADEMIC' && results.length === 0) { // Only fetch if not already loaded or empty
                const resultsRes = await academicsAPI.results.getAll({ student_id: Number(id) });
                setResults(d(resultsRes));
            } else if (activeTab === 'FINANCE') {
                const [pRes, iRes, aRes] = await Promise.all([
                    financeAPI.payments.getAll({ invoice__student: Number(id) }),
                    financeAPI.invoices.getAll({ student: Number(id) }),
                    financeAPI.adjustments.getAll({ invoice__student: Number(id) })
                ]);
                setPayments(d(pRes));
                setInvoices(d(iRes));
                setAdjustments(d(aRes));
            } else if (activeTab === 'DISCIPLINE') {
                const disciplineRes = await studentsAPI.discipline.getAll(Number(id));
                setDiscipline(d(disciplineRes));
            } else if (activeTab === 'ACTIVITIES') {
                const activitiesRes = await studentsAPI.activities.getAll(Number(id));
                setActivities(d(activitiesRes));
            } else if (activeTab === 'DOCUMENTS') {
                const documentsRes = await studentsAPI.documents.getAll(Number(id));
                setDocuments(d(documentsRes));
            }
        } catch (e) {
            console.error(`Error loading ${activeTab} data:`, e);
        }
    };

    const loadStudentData = async () => {
        await loadCoreStudentData();
        await loadTabData();
    };

    useEffect(() => {
        if (id) loadCoreStudentData();
    }, [id]);

    useEffect(() => {
        if (id) loadTabData();
    }, [id, activeTab]);

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
        setActivityForm({ ...act });
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

    const handleLinkParent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchPhone) return;
        setIsSearchingParent(true);
        try {
            const res = await studentsAPI.linkParent(Number(id), { phone: searchPhone });
            toast.success(`Linked ${res.data.parent.full_name} successfully`);
            setSearchPhone('');
            loadCoreStudentData();
        } catch (err: any) {
            toast.error(err.message || 'Parent not found or already linked');
        } finally {
            setIsSearchingParent(false);
        }
    };

    const handleUnlinkParent = async (parentId: number) => {
        if (!(await confirm('Remove this guardian link?'))) return;
        try {
            await studentsAPI.unlinkParent(Number(id), { parent_id: parentId });
            toast.success('Guardian unlinked successfully');
            loadCoreStudentData();
        } catch (err: any) {
            toast.error(err.message || 'Failed to unlink guardian');
        }
    };

    const handleMarkPrimary = async (parentId: number) => {
        try {
            await studentsAPI.parents.patch(parentId, { is_primary: true });
            toast.success('Marked as primary guardian');
            loadCoreStudentData();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update guardian');
        }
    };

    const handleCreateGuardian = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await studentsAPI.parents.create({
                ...newGuardianForm,
                student_id: Number(id)
            });
            toast.success('New guardian created and linked successfully!');
            setParents([...parents, res.data]);
            setIsCreatingNewGuardian(false);
            setNewGuardianForm({ full_name: '', phone: '', email: '', relation: 'PARENT' });
            setIsGuardianModalOpen(false);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to create guardian');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase text-secondary tracking-widest animate-pulse">Synchronizing Student Records...</p>
        </div>
    );

    if (error || !student) return (
        <div className="p-12 text-center card border-dashed border-2 border-error/20 bg-error/5 max-w-2xl mx-auto mt-12">
            <AlertTriangle size={48} className="text-error mx-auto mb-4" />
            <h2 className="text-xl font-black text-primary uppercase mb-2">Access Error</h2>
            <p className="text-secondary font-bold mb-6">{error || 'The requested student profile could not be localized in the institutional database.'}</p>
            <div className="flex gap-2 justify-center">
                <Button variant="primary" onClick={() => navigate('/students')} icon={<ArrowLeft size={16} />}>RETURN TO REGISTRY</Button>
                <Button variant="outline" onClick={() => { setError(null); loadStudentData(); }} icon={<HistoryIcon size={16} />}>RETRY SESSION</Button>
            </div>
        </div>
    );

    const tabs: { id: TabType, label: string, icon: any }[] = [
        { id: 'SUMMARY', label: 'Dashboard', icon: <TrendingUp size={16} /> },
        { id: 'ACADEMIC', label: 'Academics', icon: <BookOpen size={16} /> },
        { id: 'FINANCE', label: 'Financials', icon: <CreditCard size={16} /> },
        { id: 'DISCIPLINE', label: 'Discipline', icon: <ShieldAlert size={16} /> },
        { id: 'HEALTH', label: 'Health & Welfare', icon: <Heart size={16} /> },
        { id: 'ACTIVITIES', label: 'Activities & Clubs', icon: <Users size={16} /> },
        { id: 'DOCUMENTS', label: 'Archive/Docs', icon: <FileText size={16} /> },
        { id: 'FAMILY', label: 'Family', icon: <Users size={16} /> },
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
        const printContent = document.getElementById('clearance-form');
        if (!printContent) return;

        // Temporarily reveal for print styles to pick it up if needed, 
        // but window.print() usually handles print-only CSS better.
        window.print();
    };

    const handleSuspend = async () => {
        setIsSuspendModalOpen(false);
        try {
            await studentsAPI.patch(Number(id), { status: 'SUSPENDED' });
            toast.success('Student Suspended.');
            loadStudentData();
        } catch (error) { toast.error('Action failed.'); }
    };

    const handleForceDelete = async () => {
        setIsDeleteModalOpen(false);
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
    };

    const handleWhatsApp = () => {
        const primaryParent = parents.find(p => (p as any).is_primary) || parents[0];
        const phone = (primaryParent as any)?.phone || student?.guardian_phone || '';
        const name = (primaryParent as any)?.full_name || student?.guardian_name || 'Guardian';
        const message = encodeURIComponent(`Hello ${name}, this is regarding ${student?.full_name} (ADM: ${student?.admission_number}). `);
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
    };

    const handleEmail = () => {
        const primaryParent = parents.find(p => (p as any).is_primary) || parents[0];
        const email = (primaryParent as any)?.email || student?.guardian_email || '';
        const subject = encodeURIComponent(`Regarding ${student?.full_name} - ${student?.admission_number}`);
        window.location.href = `mailto:${email}?subject=${subject}`;
    };

    const handleDirectSMS = () => {
        const primaryParent = parents.find(p => (p as any).is_primary) || parents[0];
        const phone = (primaryParent as any)?.phone || student?.guardian_phone || '';
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
        <div className="fade-in pb-12 w-full max-w-full overflow-x-hidden min-w-0">
            <ProfileHeader
                student={student}
                onBack={() => navigate('/students')}
                onClearance={() => setIsClearanceModalOpen(true)}
                onEdit={() => setIsEditModalOpen(true)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tabs={tabs}
            />

            <div className="grid grid-cols-12 gap-8 items-start">
                <div className="col-span-12 lg:col-span-8 space-y-8 min-w-0">
                    {activeTab === 'SUMMARY' && <ProfileSummary student={student} results={results} discipline={discipline} />}
                    {activeTab === 'DISCIPLINE' && (
                        <DisciplineLog
                            discipline={discipline}
                            onReportIncident={() => { setDisciplineId(null); setDisciplineForm({ incident_date: new Date().toISOString().split('T')[0], offence_category: '', description: '', action_taken: '', student: Number(id) }); setIsDisciplineModalOpen(true); }}
                            onEditIncident={(d) => { setDisciplineId(d.id); setDisciplineForm({ ...d, student: Number(id) }); setIsDisciplineModalOpen(true); }}
                            onDeleteIncident={handleDeleteDiscipline}
                        />
                    )}
                    {activeTab === 'HEALTH' && (
                        <HealthWelfare
                            student={student}
                            healthId={healthId}
                            emergencyContactName={student.health_record?.emergency_contact_name || student.guardian_name || 'N/A'}
                            emergencyContactPhone={student.health_record?.emergency_contact_phone || student.guardian_phone || 'N/A'}
                            onUpdateMedical={() => setIsHealthModalOpen(true)}
                            onDeleteHealth={handleDeleteHealth}
                        />
                    )}
                    {activeTab === 'ACADEMIC' && <AcademicHistory student={student} results={results} onGenerateTranscript={handleTranscriptPrint} />}
                    {activeTab === 'FINANCE' && (
                        <FinanceHistory
                            student={student}
                            invoices={invoices}
                            payments={payments}
                            statement={statement}
                            onPrintStatement={() => window.print()}
                        />
                    )}
                    {activeTab === 'ACTIVITIES' && (
                        <ExtraCurriculars
                            activities={activities}
                            onJoinActivity={() => { setActivityId(null); setActivityForm({ name: '', role: '', year: new Date().getFullYear(), activity_type: 'Club', student: Number(id) }); setIsActivityModalOpen(true); }}
                            onEditActivity={handleEditActivity}
                            onDeleteActivity={handleDeleteActivity}
                        />
                    )}
                    {activeTab === 'DOCUMENTS' && (
                        <DocumentArchive
                            documents={documents}
                            onAttachFile={() => setIsDocumentModalOpen(true)}
                            onDeleteDocument={handleDeleteDocument}
                        />
                    )}
                    {activeTab === 'FAMILY' && (
                        <FamilyGuardian
                            parents={parents}
                            onManageGuardians={() => setIsGuardianModalOpen(true)}
                            onMarkPrimary={(pid) => handleMarkPrimary(pid)}
                            onUnlinkGuardian={(pid) => handleUnlinkParent(pid)}
                            onCall={(phone) => window.location.href = `tel:${phone}`}
                            onWhatsApp={(phone) => window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank')}
                        />
                    )}
                </div>

                <ProfileSidebar
                    student={student}
                    primaryGuardian={parents.find(p => (p as any).is_primary) || (parents.length > 0 ? parents[0] : null)}
                    onTransfer={() => setIsTransferModalOpen(true)}
                    onSuspend={() => setIsSuspendModalOpen(true)}
                    onDelete={() => setIsDeleteModalOpen(true)}
                    onWhatsApp={handleWhatsApp}
                    onEmail={handleEmail}
                    onSMS={handleDirectSMS}
                    onOpenMessenger={handleMessage}
                />
            </div>

            {/* Modals ... (keep existing) */}
            <ProfileModals
                student={student}
                setStudent={setStudent}
                isDisciplineModalOpen={isDisciplineModalOpen}
                setIsDisciplineModalOpen={setIsDisciplineModalOpen}
                disciplineForm={disciplineForm}
                setDisciplineForm={setDisciplineForm}
                isSubmitting={isSubmitting}
                handleDisciplineSubmit={handleDisciplineSubmit}
                isTransferModalOpen={isTransferModalOpen}
                setIsTransferModalOpen={setIsTransferModalOpen}
                transferClassId={transferClassId}
                setTransferClassId={setTransferClassId}
                classes={classes}
                handleTransfer={handleTransfer}
                isHealthModalOpen={isHealthModalOpen}
                setIsHealthModalOpen={setIsHealthModalOpen}
                healthForm={healthForm}
                setHealthForm={setHealthForm}
                healthId={healthId}
                handleHealthSubmit={handleHealthSubmit}
                handleDeleteHealth={handleDeleteHealth}
                isActivityModalOpen={isActivityModalOpen}
                setIsActivityModalOpen={setIsActivityModalOpen}
                activityForm={activityForm}
                setActivityForm={setActivityForm}
                handleActivitySubmit={handleActivitySubmit}
                isDocumentModalOpen={isDocumentModalOpen}
                setIsDocumentModalOpen={setIsDocumentModalOpen}
                documentForm={documentForm}
                setDocumentForm={setDocumentForm}
                handleDocumentSubmit={handleDocumentSubmit}
                isEditModalOpen={isEditModalOpen}
                setIsEditModalOpen={setIsEditModalOpen}
                handleEditSubmit={handleEditSubmit}
                isClearanceModalOpen={isClearanceModalOpen}
                setIsClearanceModalOpen={setIsClearanceModalOpen}
                handlePrintClearance={handlePrintClearance}
                unreturnedBooks={unreturnedBooks}
                results={results}
                isSuspendModalOpen={isSuspendModalOpen}
                setIsSuspendModalOpen={setIsSuspendModalOpen}
                handleSuspend={handleSuspend}
                isDeleteModalOpen={isDeleteModalOpen}
                setIsDeleteModalOpen={setIsDeleteModalOpen}
                handleForceDelete={handleForceDelete}
                isGuardianModalOpen={isGuardianModalOpen}
                setIsGuardianModalOpen={setIsGuardianModalOpen}
                isCreatingNewGuardian={isCreatingNewGuardian}
                setIsCreatingNewGuardian={setIsCreatingNewGuardian}
                searchPhone={searchPhone}
                setSearchPhone={setSearchPhone}
                isSearchingParent={isSearchingParent}
                handleLinkParent={handleLinkParent}
                newGuardianForm={newGuardianForm}
                setNewGuardianForm={setNewGuardianForm}
                handleCreateGuardian={handleCreateGuardian}
                parents={parents}
                handleMarkPrimary={handleMarkPrimary}
                handleUnlinkParent={handleUnlinkParent}
            />

        </div >
    );
};

export default StudentProfile;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { financeAPI, academicsAPI, studentsAPI, classesAPI, mpesaAPI } from '../api/api';
import { CreditCard, FileText, TrendingUp, Bell, Loader2 } from 'lucide-react';
import SearchInput from '../components/common/SearchInput';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';

// Modular Components
import FinanceDashboard from './finance/FinanceDashboard';
import InvoiceManager from './finance/InvoiceManager';
import PaymentManager from './finance/PaymentManager';
import FeeManager from './finance/FeeManager';
import ExpenseManager from './finance/ExpenseManager';
import FinanceModals from './finance/FinanceModals';

// ─── Utilities ────────────────────────────────────────────────────────────────
const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
    } catch { return 'N/A'; }
};

const formatDateTime = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
    } catch { return 'N/A'; }
};

const Finance = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success, error: toastError } = useToast();
    const { confirm } = useConfirm();
    const { user } = useSelector((state: any) => state.auth);

    // Authorization
    const isReadOnly = ['ACCOUNTANT', 'ADMIN', 'PRINCIPAL', 'DIRECTOR'].includes(user?.role)
        ? false
        : !user?.permissions?.includes('finance.add_invoice');

    // Data State
    const [stats, setStats] = useState({
        totalInvoiced: 0, totalCollected: 0, totalOutstanding: 0,
        collectionRate: 0, dailyCollection: 0,
        totalCapacity: 0, enrolledStudents: 0, revenuePerSeat: 0
    });
    const [invoices, setInvoices] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [years, setYears] = useState<any[]>([]);
    const [activeStudentInvoices, setActiveStudentInvoices] = useState<any[]>([]);

    // UI/Modal State
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showMpesaModal, setShowMpesaModal] = useState(false);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [activeTabLoading, setActiveTabLoading] = useState(true);

    // Form States
    const [genForm, setGenForm] = useState({ class_id: '', level: '', term: '1', year_id: '' });
    const [payForm, setPayForm] = useState({ student_id: '', invoice_id: '', amount: '', method: 'CASH', reference: '' });
    const [feeForm, setFeeForm] = useState({ name: '', amount: '', term: '1', year_id: '', class_id: '' });
    const [expenseForm, setExpenseForm] = useState({ category: 'SUPPLIES', amount: '', description: '', paid_to: '', date_occurred: new Date().toISOString().split('T')[0], receipt_scan: null as File | null });
    const [mpesaForm, setMpesaForm] = useState({ admission_number: '', phone_number: '', amount: '' });
    const [reminderForm, setReminderForm] = useState({
        template: 'Dear Parent, this is a reminder regarding {student_name}\'s outstanding fee balance of KES {balance}. Please settle as soon as possible.',
        send_sms: true, send_email: true
    });
    const [editingFeeId, setEditingFeeId] = useState<number | null>(null);

    // Pagination & Search
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 50;
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [invFilters, setInvFilters] = useState({ class_id: '', stream: '', year_id: '', term: '', status: '', expenseCategory: '' });
    const [isAllTime, setIsAllTime] = useState(false);
    const [statsContext, setStatsContext] = useState<any>(null);
    const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(new Set());

    const uniqueClassNames = useMemo(() => Array.from(new Set(classes.map((c: any) => c.name))).sort(), [classes]);

    // Data Loaders
    const loadData = useCallback(async () => {
        setActiveTabLoading(true);
        try {
            const d = (r: any) => r?.data?.results ?? r?.data ?? [];
            if (activeTab === 'dashboard') {
                const res = await financeAPI.invoices.dashboardStats(isAllTime ? { all_time: true } : {});
                setStats({
                    totalInvoiced: res.data.totalInvoiced || 0,
                    totalCollected: res.data.totalCollected || 0,
                    totalOutstanding: res.data.totalOutstanding || 0,
                    collectionRate: res.data.collectionRate || 0,
                    dailyCollection: res.data.dailyCollection || 0,
                    totalCapacity: res.data.totalCapacity || 0,
                    enrolledStudents: res.data.enrolledStudents || 0,
                    revenuePerSeat: res.data.revenuePerSeat || 0,
                });
                setInvoices(res.data.recentInvoices || []);
                setStatsContext(res.data.context || null);
                if (!invFilters.year_id && res.data.context?.year_id) {
                    setInvFilters(prev => ({ ...prev, year_id: String(res.data.context.year_id), term: String(res.data.context.term_num || '') }));
                }
            } else if (activeTab === 'invoices') {
                const [cls, yrRes] = await Promise.all([classesAPI.getAll({ page_size: 100 }), academicsAPI.years.getAll({ page_size: 20 })]);
                setClasses(d(cls)); setYears(d(yrRes));
                const params: any = { page, page_size: pageSize, search: debouncedSearch, ...invFilters };
                if (invFilters.year_id) params.academic_year = invFilters.year_id;
                const res = await financeAPI.invoices.getAll(params);
                setInvoices(d(res));
                setTotalItems(res.data?.count ?? d(res).length);
            } else if (activeTab === 'payments') {
                const params: any = { page, page_size: pageSize, search: debouncedSearch };
                if (!debouncedSearch && statsContext?.year_id) {
                    params.invoice__academic_year = statsContext.year_id;
                    params.invoice__term = statsContext.term_num;
                }
                const res = await financeAPI.payments.getAll(params);
                setPayments(d(res));
                setTotalItems(res.data?.count ?? d(res).length);
            } else if (activeTab === 'fees') {
                const res = await financeAPI.feeStructures.getAll({ page, page_size: pageSize, search: debouncedSearch });
                setFeeStructures(d(res));
                setTotalItems(res.data?.count ?? d(res).length);
            } else if (activeTab === 'expenses') {
                const params: any = { page, page_size: pageSize, search: debouncedSearch };
                if (invFilters.expenseCategory) params.category = invFilters.expenseCategory;
                const res = await financeAPI.expenses.getAll(params);
                setExpenses(d(res));
                setTotalItems(res.data?.count ?? d(res).length);
            }
        } catch (error: any) {
            toastError(error?.response?.data?.message || 'Failed to load finance data');
        } finally {
            setActiveTabLoading(false);
        }
    }, [activeTab, isAllTime, page, debouncedSearch, invFilters, statsContext, toastError]);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => { setPage(1); }, [debouncedSearch, invFilters, activeTab, isAllTime]);
    useEffect(() => { loadData(); }, [activeTab, isAllTime, page, invFilters, debouncedSearch, loadData]);

    // Handlers
    const handleGenerateInvoices = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await financeAPI.invoices.generateBatch({ level: genForm.level, class_id: genForm.class_id || "all", year_id: Number(genForm.year_id), term: Number(genForm.term) });
            success('Invoices generated successfully');
            setShowInvoiceModal(false);
            loadData();
        } catch (err: any) { toastError(err.response?.data?.error || 'Failed to generate invoices'); }
        finally { setIsSubmitting(false); }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if ((payForm.method === 'MPESA' || payForm.method === 'BANK') && !payForm.reference.trim()) {
            toastError('Reference Number required');
            setIsSubmitting(false);
            return;
        }
        try {
            await financeAPI.payments.create({ invoice: Number(payForm.invoice_id), amount: parseFloat(payForm.amount), method: payForm.method, reference_number: payForm.reference || null, date_received: new Date().toISOString().split('T')[0] });
            success('Payment recorded');
            setShowPaymentModal(false);
            setPayForm({ student_id: '', invoice_id: '', amount: '', method: 'CASH', reference: '' });
            loadData();
        } catch (err: any) { toastError(err.response?.data?.error || 'Payment failed'); }
        finally { setIsSubmitting(false); }
    };

    const handleFeeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { name: feeForm.name, amount: parseFloat(feeForm.amount), term: Number(feeForm.term), academic_year: Number(feeForm.year_id), class_level: feeForm.class_id ? Number(feeForm.class_id) : null };
            if (editingFeeId) await financeAPI.feeStructures.update(editingFeeId, payload);
            else await financeAPI.feeStructures.create(payload);
            success('Fee structure saved');
            setShowFeeModal(false);
            setEditingFeeId(null);
            setFeeForm({ name: '', amount: '', term: '1', year_id: '', class_id: '' });
            loadData();
        } catch (err: any) { toastError('Failed to save fee structure'); }
        finally { setIsSubmitting(false); }
    };

    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('category', expenseForm.category); fd.append('amount', expenseForm.amount);
            fd.append('description', expenseForm.description); fd.append('paid_to', expenseForm.paid_to);
            if (expenseForm.date_occurred) fd.append('date_occurred', expenseForm.date_occurred);
            if (expenseForm.receipt_scan) fd.append('receipt_scan', expenseForm.receipt_scan);
            await financeAPI.expenses.create(fd);
            success('Expense recorded');
            setShowExpenseModal(false);
            setExpenseForm({ category: 'SUPPLIES', amount: '', description: '', paid_to: '', date_occurred: new Date().toISOString().split('T')[0], receipt_scan: null });
            loadData();
        } catch (err: any) { toastError('Failed to record expense'); }
        finally { setIsSubmitting(false); }
    };

    const handleMpesaPush = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await mpesaAPI.push({ ...mpesaForm, amount: parseFloat(mpesaForm.amount) });
            success('STK Push sent');
            setShowMpesaModal(false);
        } catch (err: any) { toastError('Failed to send STK push'); }
        finally { setIsSubmitting(false); }
    };

    const handleSendReminders = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await financeAPI.invoices.sendReminders({ selected_ids: Array.from(selectedInvoices), message_template: reminderForm.template, send_sms: reminderForm.send_sms, send_email: reminderForm.send_email });
            success('Reminders queued');
            setShowReminderModal(false);
            setSelectedInvoices(new Set());
        } catch (err: any) { toastError('Failed to send reminders'); }
        finally { setIsSubmitting(false); }
    };

    const toggleInvoiceSelection = (id: number) => {
        setSelectedInvoices(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // ── Fee manager callbacks ─────────────────────────────────────────────────
    const handleEditFee = (f: any) => {
        setFeeForm({
            name: f.name,
            amount: String(f.amount),
            term: String(f.term),
            year_id: f.academic_year ? String(f.academic_year) : '',
            class_id: f.class_level ? String(f.class_level) : '',
        });
        setEditingFeeId(f.id);
        setShowFeeModal(true);
    };

    const handleDeleteFee = async (id: number) => {
        if (!await confirm('Delete this fee structure? This cannot be undone.', { type: 'danger' })) return;
        try {
            await financeAPI.feeStructures.delete(id);
            success('Fee structure deleted');
            loadData();
        } catch (err: any) {
            toastError(err.response?.data?.error || 'Failed to delete fee structure');
        }
    };

    // ── Expense manager callbacks ─────────────────────────────────────────────
    const handleApproveExpense = (id: number) =>
        financeAPI.expenses.approve(id).then(() => { success('Expense approved'); loadData(); });

    const handleDeclineExpense = (id: number) =>
        financeAPI.expenses.decline(id).then(() => { success('Expense declined'); loadData(); });

    return (
        <div className="fade-in px-4 pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Finance Center</h1>
                    <p className="text-secondary text-sm font-medium">Financial operations and audit center</p>
                </div>
                {!isReadOnly && (
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <Button variant="ghost" icon={<TrendingUp size={18} />} onClick={() => financeAPI.invoices.syncAll().then(r => success(r.data.message))}>Sync</Button>
                        <Button variant="outline" className="text-green-600 border-green-200" onClick={() => setShowMpesaModal(true)}>M-Pesa</Button>
                        <Button variant="outline" icon={<CreditCard size={18} />} onClick={() => setShowPaymentModal(true)}>Payment</Button>
                        <Button variant="primary" icon={<FileText size={18} />} onClick={() => setShowInvoiceModal(true)}>Invoices</Button>
                        {selectedInvoices.size > 0 && <Button variant="secondary" icon={<Bell size={18} />} className="bg-orange-600" onClick={() => setShowReminderModal(true)}>Remind ({selectedInvoices.size})</Button>}
                    </div>
                )}
            </div>

            <div className="nav-tab-container no-print mb-8">
                {['dashboard', 'invoices', 'payments', 'fees', 'expenses'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`nav-tab ${activeTab === tab ? 'active' : ''}`}>{tab.toUpperCase()}</button>
                ))}
            </div>

            {activeTabLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 size={36} className="animate-spin text-primary opacity-70" />
                </div>
            ) : (
                <div className="space-y-6">
                    {activeTab !== 'dashboard' && (
                        <div className="flex justify-end mb-4 no-print">
                            <SearchInput placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={setSearchTerm} className="w-80" />
                        </div>
                    )}

                    {activeTab === 'dashboard' && (
                        <FinanceDashboard
                            stats={stats} invoices={invoices} statsContext={statsContext}
                            isAllTime={isAllTime} setIsAllTime={setIsAllTime}
                            formatDate={formatDate} setSelectedInvoice={setSelectedInvoice}
                            selectedInvoices={selectedInvoices} toggleInvoiceSelection={toggleInvoiceSelection}
                            setSelectedInvoices={setSelectedInvoices}
                        />
                    )}
                    {activeTab === 'invoices' && (
                        <InvoiceManager
                            invoices={invoices} filteredInvoices={invoices}
                            invFilters={invFilters} setInvFilters={setInvFilters}
                            uniqueClassNames={uniqueClassNames} classes={classes} years={years}
                            page={page} setPage={setPage} pageSize={pageSize} totalItems={totalItems}
                            loadData={loadData} formatDate={formatDate}
                            setSelectedInvoice={setSelectedInvoice} selectedInvoices={selectedInvoices}
                            setSelectedInvoices={setSelectedInvoices} toggleInvoiceSelection={toggleInvoiceSelection}
                        />
                    )}
                    {activeTab === 'payments' && (
                        <PaymentManager
                            filteredPayments={payments} isReadOnly={isReadOnly}
                            setShowPaymentModal={setShowPaymentModal} formatDate={formatDate}
                            totalItems={totalItems} page={page} setPage={setPage} pageSize={pageSize}
                        />
                    )}
                    {activeTab === 'fees' && (
                        <FeeManager
                            filteredFees={feeStructures} isReadOnly={isReadOnly}
                            setShowFeeModal={setShowFeeModal}
                            handleEditFee={handleEditFee}
                            handleDeleteFee={handleDeleteFee}
                            totalItems={totalItems} page={page} setPage={setPage} pageSize={pageSize}
                        />
                    )}
                    {activeTab === 'expenses' && (
                        <ExpenseManager
                            filteredExpenses={expenses} isReadOnly={isReadOnly}
                            setShowExpenseModal={setShowExpenseModal}
                            invFilters={invFilters} setInvFilters={setInvFilters}
                            formatDate={formatDate} totalItems={totalItems}
                            page={page} setPage={setPage} pageSize={pageSize}
                            isSubmitting={isSubmitting}
                            handleApprove={handleApproveExpense}
                            handleDecline={handleDeclineExpense}
                        />
                    )}
                </div>
            )}

            <FinanceModals
                showInvoiceModal={showInvoiceModal} setShowInvoiceModal={setShowInvoiceModal} genForm={genForm} setGenForm={setGenForm} handleGenerateInvoices={handleGenerateInvoices}
                showPaymentModal={showPaymentModal} setShowPaymentModal={setShowPaymentModal} payForm={payForm} setPayForm={setPayForm} handlePaymentSubmit={handlePaymentSubmit}
                showFeeModal={showFeeModal} setShowFeeModal={setShowFeeModal} feeForm={feeForm} setFeeForm={setFeeForm} handleFeeSubmit={handleFeeSubmit} editingFeeId={editingFeeId}
                showExpenseModal={showExpenseModal} setShowExpenseModal={setShowExpenseModal} expenseForm={expenseForm} setExpenseForm={setExpenseForm} handleExpenseSubmit={handleExpenseSubmit}
                showMpesaModal={showMpesaModal} setShowMpesaModal={setShowMpesaModal} mpesaForm={mpesaForm} setMpesaForm={setMpesaForm} handleMpesaPush={handleMpesaPush}
                showReminderModal={showReminderModal} setShowReminderModal={setShowReminderModal} reminderForm={reminderForm} setReminderForm={setReminderForm} handleSendReminders={handleSendReminders} selectedInvoicesSize={selectedInvoices.size}
                selectedInvoice={selectedInvoice} setSelectedInvoice={setSelectedInvoice} formatDate={formatDate} formatDateTime={formatDateTime}
                years={years} classes={classes} uniqueClassNames={uniqueClassNames} students={students} setStudents={setStudents} activeStudentInvoices={activeStudentInvoices} setActiveStudentInvoices={setActiveStudentInvoices} isSubmitting={isSubmitting}
                studentsAPI={studentsAPI} financeAPI={financeAPI}
            />
        </div>
    );
};

export default Finance;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { financeAPI, academicsAPI, studentsAPI, classesAPI, mpesaAPI } from '../api/api';
import { CreditCard, FileText, TrendingUp, CheckCircle, Plus, Printer, Bell, Send, Mail, MessageSquare, Edit, Trash2 } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import SearchInput from '../components/common/SearchInput';
import Modal from '../components/Modal';
import { StatCard } from '../components/Card';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import PremiumDateInput from '../components/common/DatePicker';

const Finance = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success, error: toastError } = useToast();
    const { user } = useSelector((state: any) => state.auth);
    // Admin is Read Only for Finance
    const isReadOnly = ['ACCOUNTANT', 'ADMIN', 'PRINCIPAL', 'DIRECTOR'].includes(user?.role) ? false : !user?.permissions?.includes('finance.add_invoice');

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString();
        } catch (e) {
            return 'N/A';
        }
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleString();
        } catch (e) {
            return 'N/A';
        }
    };

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

    // Forms State
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showMpesaModal, setShowMpesaModal] = useState(false);

    // Invoice Generation Form
    const [genForm, setGenForm] = useState({ class_id: '', level: '', term: '1', year_id: '' });

    // Payment Form
    const [payForm, setPayForm] = useState({ student_id: '', invoice_id: '', amount: '', method: 'CASH', reference: '' });

    // Fee Form
    const [feeForm, setFeeForm] = useState({ name: '', amount: '', term: '1', year_id: '', class_id: '' });

    // Expense Form
    const [expenseForm, setExpenseForm] = useState({ category: 'SUPPLIES', amount: '', description: '', paid_to: '', date_occurred: '', receipt_scan: null as File | null });

    // Mpesa Form
    const [mpesaForm, setMpesaForm] = useState({ admission_number: '', phone_number: '', amount: '' });

    // Pagination State
    const [page, setPage] = useState(1);
    const [__totalItems, set_totalItems] = useState(0);
    const pageSize = 50;

    // Perf & Context Optimization
    const [isAllTime, setIsAllTime] = useState(false);
    const [statsContext, setStatsContext] = useState<any>(null);

    // Invoice Filters
    const [invFilters, setInvFilters] = useState({ class_id: '', stream: '', year_id: '', term: '', status: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(new Set());
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminderForm, setReminderForm] = useState({
        template: 'Dear Parent, this is a reminder regarding {student_name}\'s outstanding fee balance of KES {balance}. Please settle as soon as possible.',
        send_sms: true,
        send_email: true
    });

    const filteredInvoices = invoices;
    const filteredPayments = payments;
    const filteredExpenses = expenses;
    const filteredFees = feeStructures;


    // Options
    const [classes, setClasses] = useState([]);
    const uniqueClassNames = useMemo(() => {
        return Array.from(new Set(classes.map((c: any) => c.name))).sort();
    }, [classes]);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [years, setYears] = useState([]);
    const [activeStudentInvoices, setActiveStudentInvoices] = useState<any[]>([]);

    // Debounced search effect syncs searchTerm to debouncedSearch
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Reset page on filter or search term change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, invFilters, activeTab, isAllTime]);

    // Unified data loading effect
    useEffect(() => {
        loadData();
    }, [activeTab, isAllTime, page, invFilters, debouncedSearch]);

    const loadData = useCallback(async () => {
        setLoading(true);
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

                // Auto-set filters if they are empty and context is available
                if (!invFilters.year_id && res.data.context?.year_id) {
                    setInvFilters(prev => ({ ...prev, year_id: String(res.data.context.year_id), term: String(res.data.context.term_num || '') }));
                }
            } else if (activeTab === 'invoices') {
                // Targeted fetch for invoices tab
                const [cls, yrRes] = await Promise.all([
                    classesAPI.getAll({ page_size: 50 }),
                    academicsAPI.years.getAll({ page_size: 10 })
                ]);
                setClasses(d(cls)); setYears(d(yrRes));

                const params: any = {
                    page,
                    page_size: pageSize,
                    search: debouncedSearch,
                    ...invFilters
                };
                if (invFilters.year_id) params.academic_year = invFilters.year_id;

                const res = await financeAPI.invoices.getAll(params);
                setInvoices(d(res));
                set_totalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'payments') {
                const params: any = {
                    page,
                    page_size: pageSize,
                    search: debouncedSearch
                };

                // Default to active term if no search or specific filter
                if (!debouncedSearch && statsContext?.year_id) {
                    params.invoice__academic_year = statsContext.year_id;
                    params.invoice__term = statsContext.term_num;
                }

                const res = await financeAPI.payments.getAll(params);
                setPayments(d(res));
                set_totalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'fees') {
                const res = await financeAPI.feeStructures.getAll({
                    page,
                    page_size: pageSize,
                    search: debouncedSearch
                });
                setFeeStructures(d(res));
                set_totalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'expenses') {
                const res = await financeAPI.expenses.getAll({
                    page,
                    page_size: pageSize,
                    search: debouncedSearch
                });
                setExpenses(d(res));
                set_totalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            }
        } catch (error: any) {
            console.error('Error loading finance data:', error);
            const msg = error?.response?.data?.message || error?.message || 'Failed to load finance data.';
            toastError(String(msg));
        } finally {
            setLoading(false);
        }
    }, [activeTab, isAllTime, page, debouncedSearch, invFilters, pageSize, statsContext?.year_id, statsContext?.term_num, toastError, success]);

    // Ensure data is loaded when modals open (in case user hasn't visited the tab)
    useEffect(() => {
        const d = (r: any) => r?.data?.results ?? r?.data ?? [];
        const loadModalData = async () => {
            try {
                if (showInvoiceModal || showFeeModal) {
                    if (classes.length === 0 || years.length === 0) {
                        const [cls, yrs] = await Promise.all([
                            classesAPI.getAll({ page_size: 50 }),
                            academicsAPI.years.getAll({ is_active: true })
                        ]);
                        setClasses(d(cls)); setYears(d(yrs));
                    }
                }
                if (showPaymentModal || showMpesaModal) {
                    // Optimized: Fetch minimal student data with debt for selectors
                    // This ensures "lookup data" error doesn't happen and we only show relevant students
                    const studs = await studentsAPI.minimalSearch({ has_debt: true });
                    setStudents(d(studs));
                }
            } catch (err: any) {
                console.error('Error loading modal data:', err);
                toastError('Could not load lookup data. Please try again.');
            }
        };
        loadModalData();
    }, [showInvoiceModal, showPaymentModal, showFeeModal, showMpesaModal]);


    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if ((payForm.method === 'MPESA' || payForm.method === 'BANK') && !payForm.reference.trim()) {
            toastError('Please provide a Reference Number for ' + payForm.method + ' payments');
            setIsSubmitting(false);
            return;
        }

        try {
            await financeAPI.payments.create({
                invoice: Number(payForm.invoice_id),
                amount: parseFloat(payForm.amount),
                method: payForm.method,
                reference_number: payForm.reference || null,
                date_received: new Date().toISOString().split('T')[0]
            });

            success('Payment received successfully!');
            setShowPaymentModal(false);
            setPayForm({ student_id: '', invoice_id: '', amount: '', method: 'CASH', reference: '' });
            loadData();
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to process payment';
            toastError(String(errorMsg));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateInvoices = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await financeAPI.invoices.generateBatch({
                level: genForm.level,
                class_id: genForm.class_id || "all",
                year_id: Number(genForm.year_id),
                term: Number(genForm.term)
            });
            success('Invoices generation process completed!');
            setShowInvoiceModal(false);
            loadData();
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to generate invoices';
            toastError(String(msg));
        } finally {
            setIsSubmitting(false);
        }
    };

    const [editingFeeId, setEditingFeeId] = useState<number | null>(null);

    const handleFeeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                name: feeForm.name,
                amount: parseFloat(feeForm.amount),
                term: Number(feeForm.term),
                academic_year: Number(feeForm.year_id),
                class_level: feeForm.class_id ? Number(feeForm.class_id) : null
            };

            if (editingFeeId) {
                await financeAPI.feeStructures.update(editingFeeId, payload);
                success('Fee structure updated!');
            } else {
                await financeAPI.feeStructures.create(payload);
                success('Fee structure created!');
            }
            setShowFeeModal(false);
            setEditingFeeId(null);
            setFeeForm({ name: '', amount: '', term: '1', year_id: '', class_id: '' });
            loadData();
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to save fee structure';
            toastError(String(msg));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditFee = (fee: any) => {
        setFeeForm({
            name: fee.name,
            amount: String(fee.amount),
            term: String(fee.term),
            year_id: fee.academic_year ? String(fee.academic_year) : '',
            class_id: fee.class_level ? String(fee.class_level) : ''
        });
        setEditingFeeId(fee.id);
        setShowFeeModal(true);
    };

    const handleDeleteFee = async (feeId: number) => {
        if (!window.confirm("Are you sure you want to delete this fee structure? This action cannot be undone.")) return;
        setIsSubmitting(true);
        try {
            await financeAPI.feeStructures.delete(feeId);
            success("Fee structure deleted successfully");
            loadData();
        } catch (err: any) {
            toastError("Failed to delete fee structure");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('category', expenseForm.category);
            formData.append('amount', parseFloat(expenseForm.amount).toString());
            formData.append('description', expenseForm.description);
            formData.append('paid_to', expenseForm.paid_to);
            if (expenseForm.date_occurred) formData.append('date_occurred', expenseForm.date_occurred);
            if (expenseForm.receipt_scan) formData.append('receipt_scan', expenseForm.receipt_scan);

            await financeAPI.expenses.create(formData);
            success('Expense recorded successfully');
            setShowExpenseModal(false);
            setExpenseForm({ category: 'SUPPLIES', amount: '', description: '', paid_to: '', date_occurred: new Date().toISOString().split('T')[0], receipt_scan: null });
            loadData();
        } catch (err: any) {
            toastError(err.message || 'Failed to record expense');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSyncAll = async () => {
        setIsSubmitting(true);
        try {
            const res = await financeAPI.invoices.syncAll();
            success(res.data?.message || 'Synchronization started in background.');
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to sync financials';
            toastError(String(msg));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMpesaPush = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await mpesaAPI.push({ ...mpesaForm, amount: parseFloat(mpesaForm.amount) });
            success('STK Push sent to phone!');
            setShowMpesaModal(false);
            setMpesaForm({ admission_number: '', phone_number: '', amount: '' });
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to initiate M-Pesa push';
            toastError(String(msg));
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleInvoiceSelection = (id: number) => {
        setSelectedInvoices(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSendReminders = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await financeAPI.invoices.sendReminders({
                selected_ids: Array.from(selectedInvoices),
                message_template: reminderForm.template,
                send_sms: reminderForm.send_sms,
                send_email: reminderForm.send_email
            });
            success(res.data.message);
            setShowReminderModal(false);
            setSelectedInvoices(new Set());
        } catch (err: any) {
            toastError(err.message || 'Failed to send reminders');
        } finally {
            setIsSubmitting(false);
        }
    };

    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    return (
        <div className="fade-in px-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="w-full lg:w-auto">
                    <h1 className="text-3xl font-black tracking-tight">Finance Center</h1>
                    <p className="text-secondary text-sm font-medium">Financial operations and audit center</p>
                </div>
                {!isReadOnly && (
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-start lg:justify-end">
                        <Button variant="ghost" icon={<TrendingUp size={18} />} className="no-print flex-1 sm:flex-none" onClick={handleSyncAll} loading={isSubmitting}>
                            Sync
                        </Button>
                        <Button variant="outline" className="no-print text-green-600 border-green-200 hover:bg-green-50 flex-1 sm:flex-none" onClick={() => setShowMpesaModal(true)}>
                            M-Pesa
                        </Button>
                        <Button variant="outline" icon={<CreditCard size={18} />} className="no-print flex-1 sm:flex-none" onClick={() => setShowPaymentModal(true)}>
                            Payment
                        </Button>
                        <Button variant="primary" icon={<FileText size={18} />} className="no-print flex-1 sm:flex-none" onClick={() => setShowInvoiceModal(true)}>
                            Invoices
                        </Button>
                        {selectedInvoices.size > 0 && (
                            <Button variant="secondary" icon={<Bell size={18} />} className="no-print bg-orange-600 border-orange-600 hover:bg-orange-700 text-white flex-1 sm:flex-none" onClick={() => setShowReminderModal(true)}>
                                Remind ({selectedInvoices.size})
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <div className="nav-tab-container no-print">
                {['dashboard', 'invoices', 'payments', 'fees', 'expenses'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`nav-tab ${activeTab === tab ? 'active' : ''} `}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="spinner-container"><div className="spinner"></div></div>
            ) : (
                <div className="space-y-6">
                    {activeTab !== 'dashboard' && (
                        <div className="mb-4 no-print flex justify-end">
                            <SearchInput
                                placeholder={`Search ${activeTab}...`}
                                value={searchTerm}
                                onChange={setSearchTerm}
                                className="w-80"
                            />
                        </div>
                    )}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-20">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isAllTime ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} `}>
                                        {isAllTime ? '🌐 Global History' : `📅 ${statsContext?.term_name || 'Active Term'} ${statsContext?.year || ''} `}
                                    </span>
                                    {!isAllTime && <p className="text-[10px] text-gray-400 font-bold uppercase italic border-l pl-3">Performance Optimized</p>}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[10px] uppercase font-black tracking-widest"
                                    onClick={() => setIsAllTime(!isAllTime)}
                                >
                                    {isAllTime ? 'Switch to Active Term' : 'View All Time Stats'}
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-12">
                                <StatCard title="Total Invoiced" value={`KES ${stats.totalInvoiced.toLocaleString()} `} icon={<FileText size={18} />} gradient="linear-gradient(135deg, #3b82f6, #2563eb)" />
                                <StatCard title="Total Collected" value={`KES ${stats.totalCollected.toLocaleString()} `} icon={<CheckCircle size={18} />} gradient="linear-gradient(135deg, #10b981, #059669)" />
                                <StatCard title="Outstanding" value={`KES ${stats.totalOutstanding.toLocaleString()} `} icon={<CreditCard size={18} />} gradient="linear-gradient(135deg, #ef4444, #dc2626)" />
                                <StatCard title="Daily Collection" value={`KES ${stats.dailyCollection.toLocaleString()} `} icon={<TrendingUp size={18} />} gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
                            </div>

                            <div className="grid grid-cols-2 gap-12">
                                <StatCard title="Enrolled Students" value={stats.enrolledStudents.toLocaleString()} icon={<TrendingUp size={18} />} gradient="linear-gradient(135deg, #06b6d4, #0891b2)" />
                                <StatCard title="Total Capacity" value={stats.totalCapacity.toLocaleString()} icon={<CheckCircle size={18} />} gradient="linear-gradient(135deg, #6366f1, #4f46e5)" />
                                <StatCard title="Revenue / Seat" value={`KES ${stats.revenuePerSeat.toLocaleString()} `} icon={<CreditCard size={18} />} gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
                                <StatCard title="Collection Rate" value={`${stats.collectionRate}% `} icon={<FileText size={18} />} gradient="linear-gradient(135deg, #10b981, #059669)" />
                            </div>

                            <div className="card">
                                <h3 className="text-lg font-bold mb-4">Recent Invoices</h3>
                                <div className="table-wrapper">
                                    <table className="table min-w-[800px]">
                                        <thead>
                                            <tr>
                                                <th className="w-10">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-xs"
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                const outstanding = invoices.filter(i => Number(i.balance) > 0).map(i => i.id);
                                                                setSelectedInvoices(new Set(outstanding));
                                                            } else {
                                                                setSelectedInvoices(new Set());
                                                            }
                                                        }}
                                                        checked={selectedInvoices.size > 0 && selectedInvoices.size === invoices.filter(i => Number(i.balance) > 0).length}
                                                    />
                                                </th>
                                                <th>Reference</th>
                                                <th>Student</th>
                                                <th>Total</th>
                                                <th>Balance</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoices.length === 0 ? (
                                                <tr><td colSpan={7} className="text-center py-10 text-slate-400 italic">No recent invoices found</td></tr>
                                            ) : (
                                                invoices.slice(0, 5).map((inv: any) => (
                                                    <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer" onClick={(e) => {
                                                        if ((e.target as HTMLElement).tagName === 'INPUT') return;
                                                        setSelectedInvoice(inv);
                                                    }}>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                className="checkbox checkbox-xs"
                                                                checked={selectedInvoices.has(inv.id)}
                                                                onChange={() => toggleInvoiceSelection(inv.id)}
                                                                disabled={Number(inv.balance) <= 0}
                                                            />
                                                        </td>
                                                        <td className="font-bold">#INV-{inv.id}</td>
                                                        <td>{inv.student_name}</td>
                                                        <td>KES {Number(inv.total_amount).toLocaleString()}</td>
                                                        <td className={`font-bold ${Number(inv.balance) === 0 ? 'text-success' : Number(inv.balance) < 0 ? 'text-info' : 'text-error'}`}>KES {Number(inv.balance).toLocaleString()}</td>
                                                        <td>
                                                            <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : inv.status === 'OVERPAID' ? 'badge-info text-white' : inv.status === 'PARTIAL' ? 'badge-warning' : 'badge-error'}`}>
                                                                {inv.status}
                                                            </span>
                                                        </td>
                                                        <td className="text-xs text-gray-500">{formatDate(inv.date_generated)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'invoices' && (
                        <div className="card">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <h3 className="text-lg font-bold">All Invoices</h3>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="w-40">
                                        <SearchableSelect
                                            placeholder="All Classes"
                                            options={uniqueClassNames.map(name => ({ id: name, label: name }))}
                                            value={invFilters.class_id}
                                            onChange={(val) => setInvFilters({ ...invFilters, class_id: val.toString() })}
                                        />
                                    </div>

                                    <div className="w-40">
                                        <SearchableSelect
                                            placeholder="All Streams"
                                            options={Array.from(new Set(classes.map((c: any) => c.stream).filter(Boolean))).map((stream: any) => ({ id: stream, label: stream }))}
                                            value={invFilters.stream}
                                            onChange={(val) => setInvFilters({ ...invFilters, stream: val.toString() })}
                                        />
                                    </div>

                                    <div className="w-40">
                                        <SearchableSelect
                                            placeholder="All Years"
                                            options={years.map((y: any) => ({ id: y.id.toString(), label: y.name }))}
                                            value={invFilters.year_id}
                                            onChange={(val) => setInvFilters({ ...invFilters, year_id: val.toString() })}
                                        />
                                    </div>

                                    <div className="w-40">
                                        <SearchableSelect
                                            placeholder="All Terms"
                                            options={[
                                                { id: '1', label: 'Term 1' },
                                                { id: '2', label: 'Term 2' },
                                                { id: '3', label: 'Term 3' }
                                            ]}
                                            value={invFilters.term}
                                            onChange={(val) => setInvFilters({ ...invFilters, term: val.toString() })}
                                        />
                                    </div>

                                    <div className="w-40">
                                        <SearchableSelect
                                            placeholder="All Status"
                                            options={[
                                                { id: 'UNPAID', label: 'Unpaid' },
                                                { id: 'PARTIAL', label: 'Partial' },
                                                { id: 'PAID', label: 'Paid' },
                                                { id: 'OVERPAID', label: 'Overpaid' }
                                            ]}
                                            value={invFilters.status}
                                            onChange={(val) => setInvFilters({ ...invFilters, status: val.toString() })}
                                        />
                                    </div>

                                    <button className="btn btn-sm btn-primary no-print" onClick={() => { setPage(1); loadData(); }}>Apply</button>
                                    <button className="btn btn-sm btn-outline no-print ml-4" onClick={() => window.print()} title="Print Filtered Invoices">
                                        <Printer size={14} className="mr-1" /> Print All
                                    </button>
                                </div>
                            </div>

                            <div className="table-wrapper">
                                <table className="table min-w-[800px]">
                                    <thead>
                                        <tr>
                                            <th className="w-10">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-xs"
                                                    onChange={(e) => {
                                                        const visibleOutstanding = invoices.filter((inv: any) =>
                                                            Number(inv.balance) > 0
                                                        ).map(i => i.id);

                                                        if (e.target.checked) {
                                                            setSelectedInvoices(prev => {
                                                                const next = new Set(prev);
                                                                visibleOutstanding.forEach(id => next.add(id));
                                                                return next;
                                                            });
                                                        } else {
                                                            setSelectedInvoices(prev => {
                                                                const next = new Set(prev);
                                                                visibleOutstanding.forEach(id => next.delete(id));
                                                                return next;
                                                            });
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th>Reference</th>
                                            <th>Student</th>
                                            <th>Total</th>
                                            <th>Balance</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredInvoices.length === 0 ? (
                                            <tr><td colSpan={7} className="text-center py-10 text-slate-400 italic">No invoices match your search criteria</td></tr>
                                        ) : (
                                            filteredInvoices.map((inv: any) => (
                                                <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer" onClick={(e) => {
                                                    if ((e.target as HTMLElement).tagName === 'INPUT') return;
                                                    setSelectedInvoice(inv);
                                                }}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox checkbox-xs"
                                                            checked={selectedInvoices.has(inv.id)}
                                                            onChange={() => toggleInvoiceSelection(inv.id)}
                                                            disabled={Number(inv.balance) <= 0}
                                                        />
                                                    </td>
                                                    <td className="font-bold">#INV-{inv.id}</td>
                                                    <td>{inv.student_name}</td>
                                                    <td>KES {Number(inv.total_amount).toLocaleString()}</td>
                                                    <td className={`font-bold ${Number(inv.balance) === 0 ? 'text-success' : Number(inv.balance) < 0 ? 'text-info' : 'text-error'}`}>KES {Number(inv.balance).toLocaleString()}</td>
                                                    <td>
                                                        <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : inv.status === 'OVERPAID' ? 'badge-info text-white' : inv.status === 'PARTIAL' ? 'badge-warning' : 'badge-error'}`}>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-xs text-gray-500">{formatDate(inv.date_generated || inv.created_at)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-between items-center mt-4 no-print px-2">
                                <div className="text-xs text-secondary font-medium">
                                    Showing <span className="text-primary font-bold">{filteredInvoices.length}</span> of <span className="text-primary font-bold">{__totalItems}</span> invoices
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                                    <div className="flex items-center px-4 text-xs font-bold bg-slate-100 rounded-lg">Page {page}</div>
                                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={filteredInvoices.length < pageSize}>Next</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="card">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-bold">Payment Transactions</h3>
                                {!isReadOnly && <Button variant="primary" size="sm" onClick={() => setShowPaymentModal(true)} icon={<Plus size={16} />}>Receive Payment</Button>}
                            </div>
                            <div className="table-wrapper">
                                <table className="table min-w-[800px]">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Ref</th>
                                            <th>Student</th>
                                            <th>Amount</th>
                                            <th>Method</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPayments.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center py-10 text-slate-400 italic">No payment transactions found</td></tr>
                                        ) : (
                                            filteredPayments.map((p: any) => (
                                                <tr key={p.id}>
                                                    <td>{formatDate(p.date_received)}</td>
                                                    <td className="font-bold">#{p.reference_number || p.id}</td>
                                                    <td>{p.student_name}</td>
                                                    <td className="font-bold text-success">KES {Number(p.amount).toLocaleString()}</td>
                                                    <td>{p.method}</td>
                                                    <td><span className="badge badge-success">COMPLETED</span></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-between items-center mt-4 no-print px-2">
                                <div className="text-xs text-secondary font-medium">
                                    Showing <span className="text-primary font-bold">{filteredPayments.length}</span> of <span className="text-primary font-bold">{__totalItems}</span> payments
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                                    <div className="flex items-center px-4 text-xs font-bold bg-slate-100 rounded-lg">Page {page}</div>
                                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={filteredPayments.length < pageSize}>Next</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div className="card">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <h3 className="text-lg font-bold">Expense History</h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="w-40">
                                        <SearchableSelect
                                            placeholder="All Categories"
                                            options={[
                                                { id: '', label: 'All Categories' },
                                                { id: 'SALARY', label: 'Salary' },
                                                { id: 'UTILITIES', label: 'Utilities' },
                                                { id: 'MAINTENANCE', label: 'Maintenance' },
                                                { id: 'SUPPLIES', label: 'Supplies' },
                                                { id: 'FOOD', label: 'Food' },
                                                { id: 'OTHER', label: 'Other' }
                                            ]}
                                            value={invFilters.status /* Reusing filter state temporarily */}
                                            onChange={(val) => setInvFilters({ ...invFilters, status: val.toString() })}
                                        />
                                    </div>
                                    {!isReadOnly && (
                                        <Button variant="secondary" size="sm" onClick={() => setShowExpenseModal(true)} icon={<Plus size={16} />}>
                                            Record Expense
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="table-wrapper">
                                <table className="table min-w-[900px]">
                                    <thead>
                                        <tr>
                                            <th>Date & Origin</th>
                                            <th>Category</th>
                                            <th>Description</th>
                                            <th>Paid To</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.length === 0 ? (
                                            <tr><td colSpan={7} className="text-center py-10 text-slate-400 italic">No expenses recorded for this selection</td></tr>
                                        ) : (
                                            filteredExpenses.map((exp: any) => (
                                                <tr key={exp.id} className="hover:bg-gray-50">
                                                    <td>
                                                        <div className="font-bold">{formatDate(exp.date_occurred)}</div>
                                                        {exp.origin_model && (
                                                            <div className="text-[10px] uppercase font-bold text-primary opacity-60 flex items-center gap-1 mt-1">
                                                                <TrendingUp size={10} /> {exp.origin_model.split('.').pop()} INT
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td><span className="badge badge-outline text-xs">{exp.category}</span></td>
                                                    <td className="max-w-[200px] truncate" title={exp.description}>{exp.description}</td>
                                                    <td>{exp.paid_to}</td>
                                                    <td className="font-bold">KES {Number(exp.amount).toLocaleString()}</td>
                                                    <td>
                                                        <span className={`badge text-xs font-bold ${exp.status === 'APPROVED' ? 'badge-success text-white' : exp.status === 'DECLINED' ? 'badge-error text-white' : 'badge-warning text-yellow-900 border-yellow-300'}`}>
                                                            {exp.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center justify-end gap-2">
                                                            {exp.receipt_scan && (
                                                                <a href={exp.receipt_scan} target="_blank" rel="noreferrer" className="btn btn-ghost btn-xs text-blue-500" title="View Receipt">
                                                                    <FileText size={14} />
                                                                </a>
                                                            )}
                                                            {!isReadOnly && exp.status === 'PENDING' && (
                                                                <>
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (window.confirm('Approve this expense?')) {
                                                                                setIsSubmitting(true);
                                                                                try {
                                                                                    await financeAPI.expenses.approve(exp.id);
                                                                                    success('Expense approved');
                                                                                    loadData();
                                                                                } catch (e: any) {
                                                                                    toastError('Failed to approve');
                                                                                } finally {
                                                                                    setIsSubmitting(false);
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="btn btn-ghost btn-xs text-success hover:bg-success/10"
                                                                        title="Approve"
                                                                        disabled={isSubmitting}
                                                                    >
                                                                        <CheckCircle size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (window.confirm('Decline this expense?')) {
                                                                                setIsSubmitting(true);
                                                                                try {
                                                                                    await financeAPI.expenses.decline(exp.id);
                                                                                    success('Expense declined');
                                                                                    loadData();
                                                                                } catch (e: any) {
                                                                                    toastError('Failed to decline');
                                                                                } finally {
                                                                                    setIsSubmitting(false);
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                                                                        title="Decline"
                                                                        disabled={isSubmitting}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-between items-center mt-4 no-print px-2">
                                <div className="text-xs text-secondary font-medium">
                                    Showing <span className="text-primary font-bold">{filteredExpenses.length}</span> of <span className="text-primary font-bold">{__totalItems}</span> expenses
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                                    <div className="flex items-center px-4 text-xs font-bold bg-slate-100 rounded-lg">Page {page}</div>
                                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={filteredExpenses.length < pageSize}>Next</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'fees' && (
                        <div className="card">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-bold">Fee Structures</h3>
                                {!isReadOnly && (
                                    <Button variant="secondary" size="sm" onClick={() => setShowFeeModal(true)} icon={<Plus size={16} />}>
                                        Add New Fee
                                    </Button>
                                )}
                            </div>
                            <div className="table-wrapper">
                                <table className="table min-w-[700px]">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Class Level</th>
                                            <th>Term</th>
                                            <th>Amount</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFees.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-10 text-slate-400 italic">No fee structures match your search</td></tr>
                                        ) : (
                                            filteredFees.map((fee: any) => (
                                                <tr key={fee.id}>
                                                    <td className="font-bold">{fee.name}</td>
                                                    <td>{fee.class_level_name || 'All Levels'}</td>
                                                    <td>Term {fee.term} ({fee.academic_year_name})</td>
                                                    <td className="font-bold">KES {Number(fee.amount).toLocaleString()}</td>
                                                    <td>
                                                        {!isReadOnly && (
                                                            <div className="flex gap-2">
                                                                <Button variant="ghost" size="sm" onClick={() => handleEditFee(fee)} icon={<Edit size={14} />} />
                                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteFee(fee.id)} icon={<Trash2 size={14} className="text-red-500" />} />
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-between items-center mt-4 no-print px-2">
                                <div className="text-xs text-secondary font-medium">
                                    Showing <span className="text-primary font-bold">{filteredFees.length}</span> of <span className="text-primary font-bold">{__totalItems}</span> fee structures
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                                    <div className="flex items-center px-4 text-xs font-bold bg-slate-100 rounded-lg">Page {page}</div>
                                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={filteredFees.length < pageSize}>Next</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additional tabs (Invoices, Payments, Expenses) would follow similar patterns */}
                </div>
            )}

            {/* Invoices List / Bulk Gen Modal */}
            <Modal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Bulk Invoice Generation">
                <form onSubmit={handleGenerateInvoices} className="form-container-md mx-auto space-y-6">
                    <p className="text-xs text-secondary-soft bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                        <TrendingUp size={16} className="text-blue-500 mt-0.5 shrink-0" />
                        <span>This will generate invoices for <strong>ALL students</strong> in the selected class who do not already have an invoice for this period.</span>
                    </p>
                    <div className="form-group">
                        <label className="label">Academic Year *</label>
                        <SearchableSelect
                            placeholder="Select Year"
                            options={years.map((y: any) => ({ id: y.id.toString(), label: y.name }))}
                            value={genForm.year_id}
                            onChange={(val) => setGenForm({ ...genForm, year_id: val.toString() })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Class Level *</label>
                            <SearchableSelect
                                placeholder="Select Level"
                                options={[
                                    { id: 'all', label: 'ALL CLASS LEVELS' },
                                    ...uniqueClassNames.map(name => ({ id: name, label: name }))
                                ]}
                                value={genForm.level}
                                onChange={(val) => setGenForm({ ...genForm, level: val.toString(), class_id: '' })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Stream *</label>
                            <SearchableSelect
                                placeholder="Select Stream"
                                options={[
                                    { id: 'all', label: 'ALL STREAMS' },
                                    ...classes.filter((c: any) => c.name === genForm.level).map((c: any) => ({ id: c.id.toString(), label: c.stream }))
                                ]}
                                value={genForm.class_id}
                                onChange={(val) => setGenForm({ ...genForm, class_id: val.toString() })}
                                disabled={!genForm.level || genForm.level === 'all'}
                                required={genForm.level !== 'all'}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="label">Term *</label>
                        <SearchableSelect
                            options={[
                                { id: '1', label: 'Term 1' },
                                { id: '2', label: 'Term 2' },
                                { id: '3', label: 'Term 3' }
                            ]}
                            value={genForm.term}
                            onChange={(val) => setGenForm({ ...genForm, term: val.toString() })}
                        />
                    </div>
                    <div className="modal-footer pt-6 border-top mt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" className="px-8 font-black shadow-lg" loading={isSubmitting} disabled={isSubmitting} loadingText="GENERATING...">
                            GENERATE BATCH
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Receive Fee Payment">
                <form onSubmit={handlePaymentSubmit} className="form-container-md mx-auto space-y-6">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-tight text-primary">Receive Fee Payment</h4>
                            <p className="text-[10px] text-secondary font-bold uppercase opacity-60">Record manual bank or cash transactions</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SearchableSelect
                            label="Search Student"
                            placeholder="Type Name or Admission Number..."
                            options={students.map((s: any) => ({
                                id: s.id,
                                label: `${s.admission_number} - ${s.full_name} `,
                                subLabel: `Balance: KES ${Number(s.fee_balance).toLocaleString()} `
                            }))}
                            value={payForm.student_id}
                            onChange={async (val) => {
                                const studentId = String(val);
                                // Dynamically fetch all invoices for this specific student regardless of global pagination
                                try {
                                    const res = await financeAPI.invoices.getAll({ student: studentId, page_size: 100 });
                                    const studentInvoices = res.data?.results ?? res.data ?? [];
                                    setActiveStudentInvoices(studentInvoices);

                                    const validInvoices = studentInvoices.filter((i: any) => i.status !== 'PAID' && Number(i.balance) !== 0);
                                    const latestInvoice = validInvoices.length > 0 ? validInvoices[0] : null;

                                    setPayForm({
                                        ...payForm,
                                        student_id: studentId,
                                        invoice_id: latestInvoice ? String(latestInvoice.id) : '',
                                        amount: latestInvoice ? String(latestInvoice.balance) : ''
                                    });
                                } catch (err) {
                                    console.error("Failed to load specific student invoices:", err);
                                }
                            }}
                            required
                        />

                        {payForm.student_id && (
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mt-2">
                                <label className="label">Select Invoice *</label>
                                <SearchableSelect
                                    placeholder="Select Active Invoice"
                                    options={activeStudentInvoices
                                        .filter((i: any) => i.status !== 'PAID' && Number(i.balance) !== 0)
                                        .map((i: any) => ({
                                            id: i.id.toString(),
                                            label: `Invoice #${i.id} | ${i.academic_year_name} T${i.term} `,
                                            subLabel: `Remaining: KES ${Number(i.balance).toLocaleString()} `
                                        }))}
                                    value={payForm.invoice_id}
                                    onChange={(val) => {
                                        const invId = val.toString();
                                        const inv = activeStudentInvoices.find(i => String(i.id) === invId);
                                        setPayForm({
                                            ...payForm,
                                            invoice_id: invId,
                                            amount: inv ? String(inv.balance) : payForm.amount
                                        });
                                    }}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="label">Amount (KES) *</label>
                        <input type="number" className="input" required
                            value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Payment Method *</label>
                            <SearchableSelect
                                options={[
                                    { id: 'CASH', label: 'Cash' },
                                    { id: 'MPESA', label: 'M-Pesa' },
                                    { id: 'BANK', label: 'Bank Transfer' }
                                ]}
                                value={payForm.method}
                                onChange={(val) => setPayForm({ ...payForm, method: val.toString() })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Reference No.</label>
                            <input type="text" className="input"
                                placeholder="Ref..."
                                value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="modal-footer pt-6 border-top mt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" className="px-8 font-black shadow-lg" loading={isSubmitting} disabled={isSubmitting} loadingText="PROCESSING...">
                            RECORD PAYMENT
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Fee Modal */}
            <Modal isOpen={showFeeModal} onClose={() => setShowFeeModal(false)} title={editingFeeId ? "Edit Fee Structure" : "New Fee Structure"}>
                <form onSubmit={handleFeeSubmit} className="form-container-md mx-auto space-y-6">
                    <div className="form-group">
                        <label className="label">Structure Name *</label>
                        <input type="text" className="input" placeholder="e.g. Tuition Fee" required
                            value={feeForm.name} onChange={e => setFeeForm({ ...feeForm, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Academic Year *</label>
                            <SearchableSelect
                                placeholder="Select Year"
                                options={years.map((y: any) => ({ id: y.id.toString(), label: y.name }))}
                                value={feeForm.year_id}
                                onChange={(val) => setFeeForm({ ...feeForm, year_id: val.toString() })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Class Level</label>
                            <SearchableSelect
                                placeholder="All Levels"
                                options={classes.map((c: any) => ({ id: c.id.toString(), label: c.name }))}
                                value={feeForm.class_id}
                                onChange={(val) => setFeeForm({ ...feeForm, class_id: val.toString() })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Amount (KES) *</label>
                            <input type="number" className="input" required
                                value={feeForm.amount} onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Term *</label>
                            <SearchableSelect
                                options={[
                                    { id: '1', label: 'Term 1' },
                                    { id: '2', label: 'Term 2' },
                                    { id: '3', label: 'Term 3' }
                                ]}
                                value={feeForm.term}
                                onChange={(val) => setFeeForm({ ...feeForm, term: val.toString() })}
                            />
                        </div>
                    </div>
                    <div className="modal-footer pt-6 border-top mt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setShowFeeModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" className="px-8 font-black shadow-lg" loading={isSubmitting} disabled={isSubmitting} loadingText="SAVING...">
                            SAVE STRUCTURE
                        </Button>
                    </div>
                </form>
            </Modal>
            <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={`Invoice Details - #INV - ${selectedInvoice?.id} `}>
                {selectedInvoice && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
                            <div><p className="text-xs text-secondary uppercase font-black">Student</p><p className="font-bold">{selectedInvoice.student_name}</p></div>
                            <div><p className="text-xs text-secondary uppercase font-black">Admission</p><p className="font-bold">{selectedInvoice.admission_number}</p></div>
                            <div><p className="text-xs text-secondary uppercase font-black">Class</p><p className="font-bold">{selectedInvoice.class_name} {selectedInvoice.stream_name}</p></div>
                            <div><p className="text-xs text-secondary uppercase font-black">Term</p><p className="font-bold">Term {selectedInvoice.term} ({selectedInvoice.academic_year_name})</p></div>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm mb-2 text-gray-500 uppercase tracking-wider">Invoice Items</h4>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="table table-compact w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th>Description</th>
                                            <th className="text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.items?.map((item: any) => (
                                            <tr key={item.id}>
                                                <td>
                                                    {item.description}
                                                    <span className="text-xs text-gray-400 block">{item.created_at ? formatDateTime(item.created_at) : formatDate(selectedInvoice.date_generated)}</span>
                                                </td>
                                                <td className="text-right font-mono">KES {Number(item.amount).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {selectedInvoice.adjustments?.length > 0 && (
                                            <>
                                                <tr className="bg-gray-50"><td colSpan={2} className="text-xs font-bold text-gray-400">ADJUSTMENTS (FINES/WAIVERS)</td></tr>
                                                {selectedInvoice.adjustments.map((adj: any) => (
                                                    <tr key={adj.id}>
                                                        <td>
                                                            {adj.reason} <span className="text-xs text-gray-400">({adj.adjustment_type})</span>
                                                            <span className="text-xs text-gray-400 block">{adj.created_at ? formatDateTime(adj.created_at) : formatDate(adj.date)}</span>
                                                        </td>
                                                        <td className={`text-right font-mono ${adj.adjustment_type === 'DEBIT' ? 'text-error' : 'text-success'}`}>
                                                            {adj.adjustment_type === 'DEBIT' ? '+' : '-'} KES {Number(adj.amount).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}
                                        {selectedInvoice.payments?.length > 0 && (
                                            <>
                                                <tr className="bg-gray-50"><td colSpan={2} className="text-xs font-bold text-gray-400">PAYMENTS</td></tr>
                                                {selectedInvoice.payments.map((pay: any) => (
                                                    <tr key={pay.id}>
                                                        <td>
                                                            Payment - {pay.method} {pay.reference_number && `(Ref: ${pay.reference_number})`}
                                                            <span className="text-xs text-gray-400 block">{pay.created_at ? formatDateTime(pay.created_at) : formatDate(pay.date_received)}</span>
                                                        </td>
                                                        <td className="text-right font-mono text-success">
                                                            - KES {Number(pay.amount).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span>Subtotal</span>
                                <span className="font-bold">KES {Number(selectedInvoice.total_amount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Total Paid</span>
                                <span className="font-bold text-success">KES {Number(selectedInvoice.paid_amount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-t pt-2 text-lg">
                                <span className="font-bold">Balance Due</span>
                                <span className={`font - black ${Number(selectedInvoice.balance) === 0 ? 'text-success' : Number(selectedInvoice.balance) < 0 ? 'text-info' : 'text-error'} `}>KES {Number(selectedInvoice.balance).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="modal-action">
                            <Button variant="ghost" onClick={() => setSelectedInvoice(null)}>Close</Button>
                            <Button variant="outline" icon={<Printer size={16} />} onClick={() => window.print()}>Print / Save PDF</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Expense Modal */}
            <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Record New Expense">
                <form onSubmit={handleExpenseSubmit} className="form-container-md mx-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Category *</label>
                            <SearchableSelect
                                options={[
                                    { id: 'SUPPLIES', label: 'Supplies' },
                                    { id: 'UTILITIES', label: 'Utilities' },
                                    { id: 'SALARIES', label: 'Salaries' },
                                    { id: 'MAINTENANCE', label: 'Maintenance' },
                                    { id: 'OTHER', label: 'Other' }
                                ]}
                                value={expenseForm.category}
                                onChange={(val) => setExpenseForm({ ...expenseForm, category: val.toString() })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Amount (KES) *</label>
                            <input type="number" className="input" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                        </div>
                        <div className="form-group pb-2">
                            <PremiumDateInput
                                label="Date Occurred"
                                value={expenseForm.date_occurred}
                                onChange={(val) => setExpenseForm({ ...expenseForm, date_occurred: val })}
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Paid To / Recipient *</label>
                            <input type="text" className="input" value={expenseForm.paid_to} onChange={e => setExpenseForm({ ...expenseForm, paid_to: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="label">Receipt Scan (Optional)</label>
                            <input type="file" className="file-input file-input-bordered w-full" accept="image/*,.pdf" onChange={e => setExpenseForm({ ...expenseForm, receipt_scan: e.target.files?.[0] || null })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="label">Description *</label>
                        <textarea className="textarea h-24" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} required />
                    </div>
                    <div className="modal-footer pt-6 border-top mt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" className="px-8 font-black shadow-lg" loading={isSubmitting} loadingText="SAVING...">
                            RECORD EXPENSE
                        </Button>
                    </div>
                </form>
            </Modal>
            <Modal isOpen={showMpesaModal} onClose={() => setShowMpesaModal(false)} title="M-Pesa STK Push Payment">
                <form onSubmit={handleMpesaPush} className="form-container-md mx-auto space-y-6">
                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex items-start gap-3">
                        <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <span className="text-xs text-secondary-soft">
                            This will send a secure payment prompt to the parent's phone. Fees will be <strong>automatically updated</strong> once paid.
                        </span>
                    </div>
                    <SearchableSelect
                        label="Search Student"
                        placeholder="Type Name or Admission Number..."
                        options={students.map((s: any) => ({
                            id: s.admission_number,
                            label: `${s.admission_number} - ${s.full_name} `,
                            subLabel: `Arrears: KES ${Number(s.fee_balance).toLocaleString()} `
                        }))}
                        value={mpesaForm.admission_number}
                        onChange={async (val) => {
                            const adminNum = String(val);
                            const stud: any = students.find((s: any) => String(s.admission_number) === adminNum);

                            if (stud) {
                                setMpesaForm({
                                    ...mpesaForm,
                                    admission_number: adminNum,
                                    amount: String(stud.fee_balance || mpesaForm.amount) // Default to GLOBAL debt, not just latest invoice
                                });
                            } else {
                                setMpesaForm({ ...mpesaForm, admission_number: adminNum });
                            }
                        }}
                        required
                    />
                    <div className="form-group">
                        <label className="label">Phone Number (Safaricom) *</label>
                        <input type="text" className="input" placeholder="e.g. 0712345678" required
                            value={mpesaForm.phone_number} onChange={e => setMpesaForm({ ...mpesaForm, phone_number: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">Amount (KES) *</label>
                        <input type="number" className="input font-bold" required
                            value={mpesaForm.amount} onChange={e => setMpesaForm({ ...mpesaForm, amount: e.target.value })}
                        />
                    </div>
                    <div className="modal-footer pt-6 border-top mt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setShowMpesaModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" className="bg-green-600 hover:bg-green-700 border-none px-8 font-black shadow-lg" loading={isSubmitting} disabled={isSubmitting} loadingText="SENDING...">
                            SEND STK PUSH
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Bulk Reminder Modal */}
            <Modal isOpen={showReminderModal} onClose={() => setShowReminderModal(false)} title="Send Automated Fee Reminders">
                <form onSubmit={handleSendReminders} className="space-y-6 form-container-md">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                        <Bell className="text-blue-600 mt-1 shrink-0" size={20} />
                        <div>
                            <h4 className="font-bold text-blue-900 text-sm">Target: {selectedInvoices.size} Parents</h4>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                You are about to send automated reminders to {selectedInvoices.size} selected parents. The system will automatically fetch their contact information and insert the correct student name and balance.
                            </p>
                        </div>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-bold">Message Template</span>
                            <span className="label-text-alt text-gray-400">Use {`{ student_name } `} and {`{ balance } `} as placeholders</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered h-32 text-sm leading-relaxed"
                            required
                            value={reminderForm.template}
                            onChange={e => setReminderForm({ ...reminderForm, template: e.target.value })}
                        />
                        <div className="label">
                            <span className="label-text-alt text-gray-500">Character count: {reminderForm.template.length}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-primary"
                                checked={reminderForm.send_sms}
                                onChange={e => setReminderForm({ ...reminderForm, send_sms: e.target.checked })}
                            />
                            <div className="flex items-center gap-2">
                                <MessageSquare size={18} className="text-gray-400" />
                                <span className="text-sm font-bold">Send SMS</span>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-primary"
                                checked={reminderForm.send_email}
                                onChange={e => setReminderForm({ ...reminderForm, send_email: e.target.checked })}
                            />
                            <div className="flex items-center gap-2">
                                <Mail size={18} className="text-gray-400" />
                                <span className="text-sm font-bold">Send Email</span>
                            </div>
                        </label>
                    </div>

                    <div className="modal-action">
                        <Button type="button" variant="ghost" onClick={() => setShowReminderModal(false)}>Cancel</Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="bg-orange-600 hover:bg-orange-700 border-none px-8"
                            loading={isSubmitting}
                            loadingText="Sending Batch..."
                            icon={<Send size={16} />}
                        >
                            Send Reminders Now
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Finance;

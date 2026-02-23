import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { financeAPI, academicsAPI, studentsAPI, classesAPI, mpesaAPI } from '../api/api';
import { CreditCard, FileText, TrendingUp, CheckCircle, Plus, Printer, Bell, Send, Mail, MessageSquare } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import Modal from '../components/Modal';
import { StatCard } from '../components/Card';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';

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
    const [expenseForm, setExpenseForm] = useState({ category: 'SUPPLIES', amount: '', description: '', paid_to: '', date_occurred: '' });

    // Mpesa Form
    const [mpesaForm, setMpesaForm] = useState({ admission_number: '', phone_number: '', amount: '' });

    // Pagination State
    const [page, setPage] = useState(1);
    const [_totalItems, setTotalItems] = useState(0);
    const pageSize = 50;

    // Perf & Context Optimization
    const [isAllTime, setIsAllTime] = useState(false);
    const [statsContext, setStatsContext] = useState<any>(null);

    // Invoice Filters
    const [invFilters, setInvFilters] = useState({ class_id: '', stream: '', year_id: '', term: '', status: '' });
    const [searchTerm, setSearchTerm] = useState('');
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
    const uniqueClassNames = Array.from(new Set(classes.map((c: any) => c.name))).sort();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [years, setYears] = useState([]);

    useEffect(() => {
        setPage(1); // Reset page on tab switch
        loadData();
    }, [activeTab, isAllTime]);

    useEffect(() => {
        if (activeTab !== 'dashboard') {
            loadData();
        }
    }, [page, invFilters]);

    // Debounced search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (page !== 1) setPage(1);
            else loadData();
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const loadData = async () => {
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
                setInvoices(res.data.recentInvoices);
                setStatsContext(res.data.context);

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
                    search: searchTerm,
                    ...invFilters
                };
                if (invFilters.year_id) params.academic_year = invFilters.year_id;

                const res = await financeAPI.invoices.getAll(params);
                setInvoices(d(res));
                setTotalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'payments') {
                const res = await financeAPI.payments.getAll({
                    page,
                    page_size: pageSize,
                    search: searchTerm
                });
                setPayments(d(res));
                setTotalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'fees') {
                const res = await financeAPI.feeStructures.getAll(); // Usually small
                setFeeStructures(d(res));
                setTotalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'expenses') {
                const res = await financeAPI.expenses.getAll({
                    page,
                    page_size: pageSize,
                    search: searchTerm
                });
                setExpenses(d(res));
                setTotalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            }
        } catch (error: any) {
            console.error('Error loading finance data:', error);
            toastError(error?.message || 'Failed to load finance data.');
        } finally {
            setLoading(false);
        }
    };

    // Ensure data is loaded when modals open (in case user hasn't visited the tab)
    useEffect(() => {
        const d = (r: any) => r?.data?.results ?? r?.data ?? [];
        const loadModalData = async () => {
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
                // Optimized: Fetch minimal student data for selectors instead of full profiles
                if (students.length === 0) {
                    const studs = await studentsAPI.minimalSearch();
                    setStudents(d(studs));
                }
            }
        };
        loadModalData();
    }, [showInvoiceModal, showPaymentModal, showFeeModal, showMpesaModal]);


    const handleReceivePayment = async (e: React.FormEvent) => {
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
            const errorMsg = err.response?.data?.error || err.message || 'Failed to process payment';
            toastError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateInvoices = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await financeAPI.invoices.generateBatch({
                class_id: Number(genForm.class_id),
                year_id: Number(genForm.year_id),
                term: Number(genForm.term)
            });
            success('Invoices generated successfully!');
            setShowInvoiceModal(false);
            loadData();
        } catch (err: any) {
            toastError(err.message || 'Failed to generate invoices');
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
            toastError(err.message || 'Failed to save fee structure');
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

    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await financeAPI.expenses.create({
                ...expenseForm,
                amount: parseFloat(expenseForm.amount)
            });
            success('Expense recorded successfully');
            setShowExpenseModal(false);
            setExpenseForm({ category: 'SUPPLIES', amount: '', description: '', paid_to: '', date_occurred: new Date().toISOString().split('T')[0] });
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
            success(res.data.message || 'Financials synchronized successfully!');
            loadData();
        } catch (err: any) {
            toastError(err.message || 'Failed to sync financials');
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
            toastError(err.message || 'Failed to initiate M-Pesa push');
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
                        className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
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
                            <input
                                type="text"
                                placeholder={`Search ${activeTab.toLowerCase()}...`}
                                className="input input-sm w-64 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-20">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isAllTime ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {isAllTime ? '🌐 Global History' : `📅 ${statsContext?.term_name || 'Active Term'} ${statsContext?.year || ''}`}
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
                            <div className="grid grid-cols-2 gap-6">
                                <StatCard title="Total Invoiced" value={`KES ${stats.totalInvoiced.toLocaleString()}`} icon={<FileText size={18} />} gradient="linear-gradient(135deg, #3b82f6, #2563eb)" />
                                <StatCard title="Total Collected" value={`KES ${stats.totalCollected.toLocaleString()}`} icon={<CheckCircle size={18} />} gradient="linear-gradient(135deg, #10b981, #059669)" />
                                <StatCard title="Outstanding" value={`KES ${stats.totalOutstanding.toLocaleString()}`} icon={<CreditCard size={18} />} gradient="linear-gradient(135deg, #ef4444, #dc2626)" />
                                <StatCard title="Daily Collection" value={`KES ${stats.dailyCollection.toLocaleString()}`} icon={<TrendingUp size={18} />} gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <StatCard title="Enrolled Students" value={stats.enrolledStudents.toLocaleString()} icon={<TrendingUp size={18} />} gradient="linear-gradient(135deg, #06b6d4, #0891b2)" />
                                <StatCard title="Total Capacity" value={stats.totalCapacity.toLocaleString()} icon={<CheckCircle size={18} />} gradient="linear-gradient(135deg, #6366f1, #4f46e5)" />
                                <StatCard title="Revenue / Seat" value={`KES ${stats.revenuePerSeat.toLocaleString()}`} icon={<CreditCard size={18} />} gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
                                <StatCard title="Collection Rate" value={`${stats.collectionRate}%`} icon={<FileText size={18} />} gradient="linear-gradient(135deg, #10b981, #059669)" />
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
                                            {invoices.slice(0, 5).map((inv: any) => (
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
                                            ))}
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
                                    <select
                                        className="select select-sm select-bordered"
                                        value={invFilters.class_id}
                                        onChange={(e) => setInvFilters({ ...invFilters, class_id: e.target.value })}
                                    >
                                        <option value="">All Classes</option>
                                        {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>

                                    <select
                                        className="select select-sm select-bordered"
                                        value={invFilters.stream}
                                        onChange={(e) => setInvFilters({ ...invFilters, stream: e.target.value })}
                                    >
                                        <option value="">All Streams</option>
                                        {Array.from(new Set(classes.map((c: any) => c.stream).filter(Boolean))).map((stream: any) => (
                                            <option key={stream} value={stream}>{stream}</option>
                                        ))}
                                    </select>

                                    <select
                                        className="select select-sm select-bordered"
                                        value={invFilters.year_id}
                                        onChange={(e) => setInvFilters({ ...invFilters, year_id: e.target.value })}
                                    >
                                        <option value="">All Years</option>
                                        {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                                    </select>

                                    <select
                                        className="select select-sm select-bordered"
                                        value={invFilters.term}
                                        onChange={(e) => setInvFilters({ ...invFilters, term: e.target.value })}
                                    >
                                        <option value="">All Terms</option>
                                        <option value="1">Term 1</option>
                                        <option value="2">Term 2</option>
                                        <option value="3">Term 3</option>
                                    </select>

                                    <select
                                        className="select select-sm select-bordered"
                                        value={invFilters.status}
                                        onChange={(e) => setInvFilters({ ...invFilters, status: e.target.value })}
                                    >
                                        <option value="">All Status</option>
                                        <option value="UNPAID">Unpaid</option>
                                        <option value="PARTIAL">Partial</option>
                                        <option value="PAID">Paid</option>
                                        <option value="OVERPAID">Overpaid</option>
                                    </select>

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
                                        {filteredInvoices.map((inv: any) => (
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
                                        ))}
                                    </tbody>
                                </table>
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
                                        {filteredPayments.map((p: any) => (
                                            <tr key={p.id}>
                                                <td>{formatDate(p.date_received)}</td>
                                                <td className="font-bold">#{p.reference_number || p.id}</td>
                                                <td>{p.student_name}</td>
                                                <td className="font-bold text-success">KES {Number(p.amount).toLocaleString()}</td>
                                                <td>{p.method}</td>
                                                <td><span className="badge badge-success">COMPLETED</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div className="card">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-bold">Expense History</h3>
                                {!isReadOnly && (
                                    <Button variant="secondary" size="sm" onClick={() => setShowExpenseModal(true)} icon={<Plus size={16} />}>
                                        Record Expense
                                    </Button>
                                )}
                            </div>
                            <div className="table-wrapper">
                                <table className="table min-w-[800px]">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Category</th>
                                            <th>Description</th>
                                            <th>Paid To</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.map((exp: any) => (
                                            <tr key={exp.id}>
                                                <td>{formatDate(exp.date_occurred)}</td>
                                                <td><span className="badge badge-outline">{exp.category}</span></td>
                                                <td>{exp.description}</td>
                                                <td>{exp.paid_to}</td>
                                                <td className="font-bold">KES {Number(exp.amount).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                        {filteredFees.map((fee: any) => (
                                            <tr key={fee.id}>
                                                <td className="font-bold">{fee.name}</td>
                                                <td>{fee.class_level_name || 'All Levels'}</td>
                                                <td>Term {fee.term} ({fee.academic_year_name})</td>
                                                <td className="font-bold">KES {Number(fee.amount).toLocaleString()}</td>
                                                <td>
                                                    {!isReadOnly && <Button variant="ghost" size="sm" onClick={() => handleEditFee(fee)} icon={<TrendingUp size={14} />} />}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                        <select className="select" value={genForm.year_id} onChange={e => setGenForm({ ...genForm, year_id: e.target.value })} required>
                            <option value="">-- Select Year --</option>
                            {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Class Level *</label>
                            <select className="select" value={genForm.level} onChange={e => setGenForm({ ...genForm, level: e.target.value, class_id: '' })} required>
                                <option value="">-- Select Level --</option>
                                {uniqueClassNames.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Stream *</label>
                            <select className="select" value={genForm.class_id} onChange={e => setGenForm({ ...genForm, class_id: e.target.value })} disabled={!genForm.level} required>
                                <option value="">-- Select Stream --</option>
                                {classes.filter((c: any) => c.name === genForm.level).map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.stream}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="label">Term *</label>
                        <select className="select" value={genForm.term} onChange={e => setGenForm({ ...genForm, term: e.target.value })}>
                            <option value="1">Term 1</option>
                            <option value="2">Term 2</option>
                            <option value="3">Term 3</option>
                        </select>
                    </div>
                    <div className="modal-footer pt-6 border-top mt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" className="px-8 font-black shadow-lg" loading={isSubmitting} loadingText="GENERATING...">
                            GENERATE BATCH
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Receive Payment">
                <form onSubmit={handleReceivePayment} className="form-container-md mx-auto space-y-6">
                    <SearchableSelect
                        label="Student"
                        options={students
                            .filter((s: any) => (s.fee_balance || 0) > 0)
                            .map((s: any) => ({
                                id: s.id,
                                label: `${s.admission_number} - ${s.full_name} (KES ${Number(s.fee_balance).toLocaleString()})`
                            }))}
                        value={payForm.student_id}
                        onChange={(val) => setPayForm({ ...payForm, student_id: String(val) })}
                        required
                    />

                    {payForm.student_id && (
                        <div className="form-group">
                            <label className="label">Select Invoice *</label>
                            <select className="select"
                                value={payForm.invoice_id}
                                onChange={e => setPayForm({ ...payForm, invoice_id: e.target.value })}
                                required
                            >
                                <option value="">-- Select Invoice --</option>
                                {invoices
                                    .filter((i: any) => String(i.student) === String(payForm.student_id) && i.status !== 'PAID')
                                    .map((i: any) => (
                                        <option key={i.id} value={i.id}>
                                            Invoice #{i.id} - {i.academic_year_name} T{i.term} (Bal: {Number(i.balance).toLocaleString()})
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="label">Amount (KES) *</label>
                        <input type="number" className="input" required
                            value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Payment Method *</label>
                            <select className="select" value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
                                <option value="CASH">Cash</option>
                                <option value="MPESA">M-Pesa</option>
                                <option value="BANK">Bank Transfer</option>
                            </select>
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
                        <Button type="submit" variant="primary" className="px-8 font-black shadow-lg" loading={isSubmitting} loadingText="PROCESSING...">
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
                            <select className="select" value={feeForm.year_id} onChange={e => setFeeForm({ ...feeForm, year_id: e.target.value })} required>
                                <option value="">-- Select Year --</option>
                                {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Class Level</label>
                            <select className="select" value={feeForm.class_id} onChange={e => setFeeForm({ ...feeForm, class_id: e.target.value })}>
                                <option value="">-- All Levels --</option>
                                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
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
                            <select className="select" value={feeForm.term} onChange={e => setFeeForm({ ...feeForm, term: e.target.value })}>
                                <option value="1">Term 1</option>
                                <option value="2">Term 2</option>
                                <option value="3">Term 3</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer pt-6 border-top mt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setShowFeeModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" className="px-8 font-black shadow-lg" loading={isSubmitting} loadingText="SAVING...">
                            SAVE STRUCTURE
                        </Button>
                    </div>
                </form>
            </Modal>
            <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={`Invoice Details - #INV-${selectedInvoice?.id}`}>
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
                                                <td>{item.description}</td>
                                                <td className="text-right font-mono">KES {Number(item.amount).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {selectedInvoice.adjustments?.length > 0 && (
                                            <>
                                                <tr className="bg-gray-50"><td colSpan={2} className="text-xs font-bold text-gray-400">ADJUSTMENTS (FINES/WAIVERS)</td></tr>
                                                {selectedInvoice.adjustments.map((adj: any) => (
                                                    <tr key={adj.id}>
                                                        <td>{adj.reason} <span className="text-xs text-gray-400">({adj.adjustment_type})</span></td>
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
                                                            <span className="text-xs text-gray-400 block">{formatDate(pay.date_received)}</span>
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
                                <span className={`font-black ${Number(selectedInvoice.balance) === 0 ? 'text-success' : Number(selectedInvoice.balance) < 0 ? 'text-info' : 'text-error'}`}>KES {Number(selectedInvoice.balance).toLocaleString()}</span>
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
                            <select className="select" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} required>
                                <option value="SUPPLIES">Supplies</option>
                                <option value="UTILITIES">Utilities</option>
                                <option value="SALARIES">Salaries</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Amount (KES) *</label>
                            <input type="number" className="input" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="label">Date *</label>
                            <input
                                type="date"
                                className="input"
                                value={expenseForm.date_occurred}
                                onChange={e => setExpenseForm({ ...expenseForm, date_occurred: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="label">Paid To / Recipient *</label>
                        <input type="text" className="input" value={expenseForm.paid_to} onChange={e => setExpenseForm({ ...expenseForm, paid_to: e.target.value })} required />
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
                        label="Student (Admission Number)"
                        options={students
                            .filter((s: any) => (s.fee_balance || 0) > 0)
                            .map((s: any) => ({
                                id: s.admission_number,
                                label: `${s.admission_number} - ${s.full_name} (KES ${Number(s.fee_balance).toLocaleString()})`
                            }))}
                        value={mpesaForm.admission_number}
                        onChange={(val) => setMpesaForm({ ...mpesaForm, admission_number: String(val) })}
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
                        <Button type="submit" variant="primary" className="bg-green-600 hover:bg-green-700 border-none px-8 font-black shadow-lg" loading={isSubmitting} loadingText="SENDING...">
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
                            <span className="label-text-alt text-gray-400">Use {`{student_name}`} and {`{balance}`} as placeholders</span>
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

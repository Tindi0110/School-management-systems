import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { financeAPI, academicsAPI, studentsAPI, classesAPI, mpesaAPI } from '../api/api';
import { CreditCard, FileText, TrendingUp, CheckCircle, Plus, Printer } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import Modal from '../components/Modal';
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
        collectionRate: 0, dailyCollection: 0
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
    const [genForm, setGenForm] = useState({ class_id: '', term: '1', year_id: '' });

    // Payment Form
    const [payForm, setPayForm] = useState({ student_id: '', invoice_id: '', amount: '', method: 'CASH', reference: '' });

    // Fee Form
    const [feeForm, setFeeForm] = useState({ name: '', amount: '', term: '1', year_id: '', class_id: '' });

    // Expense Form
    const [expenseForm, setExpenseForm] = useState({ category: 'SUPPLIES', amount: '', description: '', paid_to: '', date_occurred: '' });

    // Mpesa Form
    const [mpesaForm, setMpesaForm] = useState({ admission_number: '', phone_number: '', amount: '' });

    // Options
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [years, setYears] = useState([]);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const d = (r: any) => r?.data?.results ?? r?.data ?? [];
            if (activeTab === 'dashboard') {
                // Super-fast dashboard load: stats + 5 recent invoices only
                const res = await financeAPI.invoices.dashboardStats();
                setStats(res.data);
                setInvoices(res.data.recentInvoices);
                // No need to fetch payments here anymore!
            } else if (activeTab === 'invoices') {
                const [cls, yrRes, studs] = await Promise.all([
                    classesAPI.getAll(),
                    academicsAPI.years.getAll(),
                    studentsAPI.getAll()
                ]);
                setClasses(d(cls)); setYears(d(yrRes)); setStudents(d(studs));
                const res = await financeAPI.invoices.getAll(); // Full load
                setInvoices(d(res));
            } else if (activeTab === 'payments') {
                const [studs, invs] = await Promise.all([studentsAPI.getAll(), financeAPI.invoices.getAll()]);
                setStudents(d(studs)); setInvoices(d(invs));
                const res = await financeAPI.payments.getAll();
                setPayments(d(res));
            } else if (activeTab === 'fees') {
                const [cls, yrs] = await Promise.all([classesAPI.getAll(), academicsAPI.years.getAll()]);
                setClasses(d(cls)); setYears(d(yrs));
                const res = await financeAPI.feeStructures.getAll();
                setFeeStructures(d(res));
            } else if (activeTab === 'expenses') {
                const res = await financeAPI.expenses.getAll();
                setExpenses(d(res));
            }
        } catch (error: any) {
            console.error('Error loading finance data:', error);
            toastError(error?.message || 'Failed to load finance data. Check console for details.');
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
                    const [cls, yrs] = await Promise.all([classesAPI.getAll(), academicsAPI.years.getAll()]);
                    setClasses(d(cls)); setYears(d(yrs));
                }
            }
            if (showPaymentModal) {
                if (students.length === 0) setStudents(d(await studentsAPI.getAll()));
                if (invoices.length === 0) setInvoices(d(await financeAPI.invoices.getAll()));
            }
        };
        loadModalData();
    }, [showInvoiceModal, showPaymentModal, showFeeModal]);

    const StatsCard = ({ title, value, icon, color }: any) => (
        <div className="card shadow-md flex flex-row items-center gap-4 p-6 border border-gray-100 transition-all hover:shadow-lg">
            <div className={`p-3 rounded-xl bg-opacity-10 ${color.replace('text-', 'bg-')} ${color}`}>
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-black">{value}</h3>
            </div>
        </div>
    );

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

    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    return (
        <div className="fade-in px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black">Finance Center</h1>
                    <p className="text-secondary text-sm">Financial operations and audit center</p>
                </div>
                {!isReadOnly && (
                    <div className="flex gap-2">
                        <Button variant="ghost" icon={<TrendingUp size={18} />} className="no-print" onClick={handleSyncAll} loading={isSubmitting}>
                            Sync Financials
                        </Button>
                        <Button variant="outline" className="no-print text-green-600 border-green-200 hover:bg-green-50" onClick={() => setShowMpesaModal(true)}>
                            Push M-Pesa Pay
                        </Button>
                        <Button variant="outline" icon={<CreditCard size={18} />} className="no-print" onClick={() => setShowPaymentModal(true)}>
                            Receive Payment
                        </Button>
                        <Button variant="primary" icon={<FileText size={18} />} className="no-print" onClick={() => setShowInvoiceModal(true)}>
                            Generate Invoices
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex gap-1 mb-8 overflow-x-auto p-1 bg-gray-100/50 rounded-xl no-print">
                {['dashboard', 'invoices', 'payments', 'fees', 'expenses'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-gray-600 hover:text-primary hover:bg-white/50'
                            }`}
                    >
                        {tab.charAt(0) + tab.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="spinner-container"><div className="spinner"></div></div>
            ) : (
                <div className="space-y-6">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatsCard title="Total Invoiced" value={`KES ${stats.totalInvoiced.toLocaleString()}`} icon={<FileText />} color="text-blue-500" />
                                <StatsCard title="Total Collected" value={`KES ${stats.totalCollected.toLocaleString()}`} icon={<CheckCircle />} color="text-green-500" />
                                <StatsCard title="Outstanding" value={`KES ${stats.totalOutstanding.toLocaleString()}`} icon={<CreditCard />} color="text-red-500" />
                                <StatsCard title="Daily Collection" value={`KES ${stats.dailyCollection.toLocaleString()}`} icon={<TrendingUp />} color="text-purple-500" />
                            </div>

                            <div className="card">
                                <h3 className="text-lg font-bold mb-4">Recent Invoices</h3>
                                <div className="overflow-x-auto">
                                    <table className="table w-full">
                                        <thead>
                                            <tr>
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
                                                <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                                                    <td className="font-bold">#INV-{inv.id}</td>
                                                    <td>{inv.student_name}</td>
                                                    <td>KES {Number(inv.total_amount).toLocaleString()}</td>
                                                    <td className="text-error font-bold">KES {Number(inv.balance).toLocaleString()}</td>
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
                            <h3 className="text-lg font-bold mb-4">All Invoices</h3>
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th>Reference</th>
                                            <th>Student</th>
                                            <th>Total</th>
                                            <th>Balance</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.map((inv: any) => (
                                            <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                                                <td className="font-bold">#INV-{inv.id}</td>
                                                <td>{inv.student_name}</td>
                                                <td>KES {Number(inv.total_amount).toLocaleString()}</td>
                                                <td className="text-error font-bold">KES {Number(inv.balance).toLocaleString()}</td>
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
                            <div className="overflow-x-auto">
                                <table className="table w-full">
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
                                        {payments.map((p: any) => (
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
                            <div className="overflow-x-auto">
                                <table className="table w-full">
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
                                        {expenses.map((exp: any) => (
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
                            <div className="overflow-x-auto">
                                <table className="table w-full">
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
                                        {feeStructures.map((fee: any) => (
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
                <form onSubmit={handleGenerateInvoices} className="space-y-4">
                    <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        This will generate invoices for ALL students in the selected class who don't already have an invoice for this period.
                    </p>
                    <div className="form-control">
                        <label className="label">Academic Year</label>
                        <select className="select select-bordered" value={genForm.year_id} onChange={e => setGenForm({ ...genForm, year_id: e.target.value })} required>
                            <option value="">-- Select Year --</option>
                            {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">Class Level</label>
                            <select className="select select-bordered" value={genForm.class_id} onChange={e => setGenForm({ ...genForm, class_id: e.target.value })} required>
                                <option value="">-- All Levels --</option>
                                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label">Term</label>
                            <select className="select select-bordered" value={genForm.term} onChange={e => setGenForm({ ...genForm, term: e.target.value })}>
                                <option value="1">Term 1</option>
                                <option value="2">Term 2</option>
                                <option value="3">Term 3</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-action">
                        <Button type="button" variant="ghost" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={isSubmitting} loadingText="Generating...">Process Invoices</Button>
                    </div>
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Receive Payment">
                <form onSubmit={handleReceivePayment} className="space-y-4">
                    <SearchableSelect
                        label="Student"
                        options={students.map((s: any) => ({ id: s.id, label: `${s.admission_number} - ${s.full_name}` }))}
                        value={payForm.student_id}
                        onChange={(val) => setPayForm({ ...payForm, student_id: String(val) })}
                        required
                    />

                    {payForm.student_id && (
                        <div className="form-control">
                            <label className="label">Select Invoice</label>
                            <select className="select select-bordered"
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

                    <div className="form-control">
                        <label className="label">Amount (KES)</label>
                        <input type="number" className="input input-bordered" required
                            value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">Method</label>
                            <select className="select select-bordered" value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
                                <option value="CASH">Cash</option>
                                <option value="MPESA">M-Pesa</option>
                                <option value="BANK">Bank Transfer</option>
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label">Reference No.</label>
                            <input type="text" className="input input-bordered"
                                placeholder="Ref..."
                                value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="modal-action">
                        <Button type="button" variant="ghost" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={isSubmitting} loadingText="Processing...">Process Payment</Button>
                    </div>
                </form>
            </Modal>

            {/* Fee Modal */}
            <Modal isOpen={showFeeModal} onClose={() => setShowFeeModal(false)} title={editingFeeId ? "Edit Fee Structure" : "New Fee Structure"}>
                <form onSubmit={handleFeeSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">Structure Name</label>
                        <input type="text" className="input input-bordered" placeholder="e.g. Tuition Fee" required
                            value={feeForm.name} onChange={e => setFeeForm({ ...feeForm, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">Academic Year</label>
                            <select className="select select-bordered" value={feeForm.year_id} onChange={e => setFeeForm({ ...feeForm, year_id: e.target.value })} required>
                                <option value="">-- Select Year --</option>
                                {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label">Class Level</label>
                            <select className="select select-bordered" value={feeForm.class_id} onChange={e => setFeeForm({ ...feeForm, class_id: e.target.value })}>
                                <option value="">-- All Levels --</option>
                                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">Amount (KES)</label>
                            <input type="number" className="input input-bordered" required
                                value={feeForm.amount} onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">Term</label>
                            <select className="select select-bordered" value={feeForm.term} onChange={e => setFeeForm({ ...feeForm, term: e.target.value })}>
                                <option value="1">Term 1</option>
                                <option value="2">Term 2</option>
                                <option value="3">Term 3</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-action">
                        <Button type="button" variant="ghost" onClick={() => setShowFeeModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={isSubmitting} loadingText="Saving...">Save Structure</Button>
                    </div>
                </form>
            </Modal>
            <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={`Invoice Details - #INV-${selectedInvoice?.id}`}>
                {selectedInvoice && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-xs text-secondary uppercase font-black">Student</p><p className="font-bold">{selectedInvoice.student_name}</p></div>
                            <div><p className="text-xs text-secondary uppercase font-black">Admission</p><p className="font-bold">{selectedInvoice.admission_number}</p></div>
                        </div>
                        <div className="p-4 bg-secondary-light rounded-lg">
                            <div className="flex justify-between items-center mb-2"><span>Total Amount</span><span className="font-black text-primary">KES {Number(selectedInvoice.total_amount).toLocaleString()}</span></div>
                            <div className="flex justify-between items-center mb-2"><span>Paid Amount</span><span className="font-black text-success">KES {Number(selectedInvoice.paid_amount).toLocaleString()}</span></div>
                            <div className="flex justify-between items-center border-t pt-2"><span>Balance Due</span><span className="font-black text-error">KES {Number(selectedInvoice.balance).toLocaleString()}</span></div>
                        </div>
                        <div className="modal-action">
                            <Button variant="ghost" onClick={() => setSelectedInvoice(null)}>Close</Button>
                            <Button variant="outline" icon={<Printer size={16} />} onClick={() => window.print()}>Print Invoice</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Expense Modal */}
            <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Record New Expense">
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">Category</label>
                            <select className="select select-bordered" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} required>
                                <option value="SUPPLIES">Supplies</option>
                                <option value="UTILITIES">Utilities</option>
                                <option value="SALARIES">Salaries</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label">Amount (KES)</label>
                            <input type="number" className="input input-bordered" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                        </div>
                    </div>
                    <div className="form-control">
                        <label className="label">Paid To / Recipient</label>
                        <input type="text" className="input input-bordered" value={expenseForm.paid_to} onChange={e => setExpenseForm({ ...expenseForm, paid_to: e.target.value })} required />
                    </div>
                    <div className="form-control">
                        <label className="label">Description</label>
                        <textarea className="textarea textarea-bordered" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} required />
                    </div>
                    <div className="modal-action">
                        <Button type="button" variant="ghost" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={isSubmitting} loadingText="Saving...">Record Expense</Button>
                    </div>
                </form>
            </Modal>
            {/* M-Pesa STK Push Modal */}
            <Modal isOpen={showMpesaModal} onClose={() => setShowMpesaModal(false)} title="M-Pesa STK Push Payment">
                <form onSubmit={handleMpesaPush} className="space-y-4">
                    <p className="text-xs text-gray-500 bg-green-50 p-3 rounded-lg border border-green-100">
                        This will send a secure payment prompt to the parent's phone. Fees will be automatically updated once paid.
                    </p>
                    <SearchableSelect
                        label="Student (Admission Number)"
                        options={students.map((s: any) => ({ id: s.admission_number, label: `${s.admission_number} - ${s.full_name}` }))}
                        value={mpesaForm.admission_number}
                        onChange={(val) => setMpesaForm({ ...mpesaForm, admission_number: String(val) })}
                        required
                    />
                    <div className="form-control">
                        <label className="label">Phone Number (Safaricom)</label>
                        <input type="text" className="input input-bordered" placeholder="e.g. 0712345678" required
                            value={mpesaForm.phone_number} onChange={e => setMpesaForm({ ...mpesaForm, phone_number: e.target.value })}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label">Amount (KES)</label>
                        <input type="number" className="input input-bordered" required
                            value={mpesaForm.amount} onChange={e => setMpesaForm({ ...mpesaForm, amount: e.target.value })}
                        />
                    </div>
                    <div className="modal-action">
                        <Button type="button" variant="ghost" onClick={() => setShowMpesaModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" className="bg-green-600 hover:bg-green-700 border-none" loading={isSubmitting} loadingText="Sending...">Send STK Push</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Finance;

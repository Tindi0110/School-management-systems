import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { financeAPI, academicsAPI, studentsAPI, classesAPI } from '../api/api';
import { CreditCard, FileText, TrendingUp, CheckCircle, AlertCircle, Plus, X, Download } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import { exportToCSV } from '../utils/export';
import Modal from '../components/Modal';

const Finance = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const { user } = useSelector((state: any) => state.auth);
    // Admin is Read Only for Finance
    // Logic: 
    // 1. ACCOUNTANT = Full Access
    // 2. ADMIN = Read Only
    // 3. Others = Check 'finance.add_invoice' permission
    const isReadOnly = user?.role === 'ADMIN' ? true : (user?.role === 'ACCOUNTANT' ? false : !user?.permissions?.includes('finance.add_invoice'));

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

    // Invoice Generation Form
    const [genForm, setGenForm] = useState({ class_id: '', term: '1', year_id: '' });

    // Payment Form
    const [payForm, setPayForm] = useState({ student_id: '', invoice_id: '', amount: '', method: 'CASH', reference: '' });

    // Fee Form
    const [feeForm, setFeeForm] = useState({ name: '', amount: '', term: '1', year_id: '', class_id: '' });

    // Expense Form
    const [expenseForm, setExpenseForm] = useState({ category: 'SUPPLIES', amount: '', description: '', paid_to: '', date_occurred: '' });

    // Options
    const [classes, setClasses] = useState([]);
    const [years, setYears] = useState([]);
    const [students, setStudents] = useState([]);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'dashboard') {
                const [invRes, payRes, expRes] = await Promise.all([
                    financeAPI.invoices.getAll(),
                    financeAPI.payments.getAll(),
                    financeAPI.expenses.getAll()
                ]);

                const totalInv = invRes.data.reduce((acc: number, i: any) => acc + parseFloat(i.total_amount), 0);
                const totalCol = invRes.data.reduce((acc: number, i: any) => acc + parseFloat(i.paid_amount), 0);
                const today = new Date().toISOString().split('T')[0];
                const daily = payRes.data.filter((p: any) => p.date_received === today).reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0);

                setStats({
                    totalInvoiced: totalInv,
                    totalCollected: totalCol,
                    totalOutstanding: totalInv - totalCol,
                    collectionRate: totalInv ? Math.round((totalCol / totalInv) * 100) : 0,
                    dailyCollection: daily
                });
                setInvoices(invRes.data); // Keep recent
            } else if (activeTab === 'invoices') {
                const [cls, yrs, studs] = await Promise.all([
                    classesAPI.getAll(),
                    academicsAPI.years.getAll(),
                    studentsAPI.getAll()
                ]);
                setClasses(cls.data); setYears(yrs.data); setStudents(studs.data);
                const res = await financeAPI.invoices.getAll();
                setInvoices(res.data);
            } else if (activeTab === 'payments') {
                const [studs, invs] = await Promise.all([studentsAPI.getAll(), financeAPI.invoices.getAll()]);
                setStudents(studs.data); setInvoices(invs.data);
                const res = await financeAPI.payments.getAll();
                setPayments(res.data);
            } else if (activeTab === 'fees') {
                const [cls, yrs] = await Promise.all([classesAPI.getAll(), academicsAPI.years.getAll()]);
                setClasses(cls.data); setYears(yrs.data);
                const res = await financeAPI.feeStructures.getAll();
                setFeeStructures(res.data);
            } else if (activeTab === 'expenses') {
                const res = await financeAPI.expenses.getAll();
                setExpenses(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateInvoices = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm('Generate invoices for this class? This action cannot be undone.')) return;

        try {
            await financeAPI.invoices.generateBatch({
                class_id: Number(genForm.class_id),
                term: Number(genForm.term),
                year_id: Number(genForm.year_id)
            });
            alert('Invoices generated successfully!');
            setShowInvoiceModal(false);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Generation failed');
        }
    };



    // Sort/Filter State
    const [filterClass, setFilterClass] = useState('');
    const [filterStream, setFilterStream] = useState('');
    const [filterTerm, setFilterTerm] = useState('');
    const [filterYear, setFilterYear] = useState('');

    const getFilteredInvoices = () => {
        return invoices.filter((inv: any) => {
            const matchC = !filterClass || (inv.class_name === filterClass);
            const matchS = !filterStream || (inv.stream_name === filterStream);
            const matchT = !filterTerm || String(inv.term) === String(filterTerm);
            const matchY = !filterYear || (inv.academic_year_name === filterYear);
            return matchC && matchS && matchT && matchY;
        });
    };

    // Auto-load data for modals if missing
    useEffect(() => {
        if (showPaymentModal && students.length === 0) {
            Promise.all([studentsAPI.getAll(), financeAPI.invoices.getAll()])
                .then(([s, i]) => { setStudents(s.data); setInvoices(i.data); });
        }
    }, [showPaymentModal]);



    const handleReceivePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Auto-find invoice if not set (simple logic: find unpaid invoice for student)
            let finalInvoiceId = payForm.invoice_id;
            if (!payForm.invoice_id) {
                alert('Please select an invoice to pay.');
                return;
            }

            await financeAPI.payments.create({
                invoice: payForm.invoice_id,
                amount: payForm.amount,
                method: payForm.method,
                reference_number: payForm.reference,
                date_received: new Date().toISOString().split('T')[0]
            });

            alert('Payment received successfully!');
            setShowPaymentModal(false);
            setPayForm({ student_id: '', invoice_id: '', amount: '', method: 'CASH', reference: '' });
            loadData();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || err.message || 'Payment failed');
        }
    };

    const [editingFeeId, setEditingFeeId] = useState<number | null>(null);

    const handleFeeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingFeeId) {
                await financeAPI.feeStructures.update(editingFeeId, {
                    ...feeForm,
                    academic_year: feeForm.year_id,
                    class_level: feeForm.class_id || null
                });
                alert('Fee structure updated!');
            } else {
                await financeAPI.feeStructures.create({
                    ...feeForm,
                    academic_year: feeForm.year_id,
                    class_level: feeForm.class_id || null
                });
                alert('Fee structure created!');
            }
            setShowFeeModal(false);
            setEditingFeeId(null);
            setFeeForm({ name: '', amount: '', term: '1', year_id: '', class_id: '' });
            loadData();
        } catch (err: any) {
            alert('Failed to save fee structure');
        }
    };

    const handleDeleteFee = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this fee structure?')) return;
        try {
            await financeAPI.feeStructures.delete(id);
            alert('Fee structure deleted successfully');
            loadData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete fee');
        }
    };

    const openEditFee = (fee: any) => {
        setFeeForm({
            name: fee.name,
            amount: fee.amount,
            term: String(fee.term),
            year_id: String(fee.academic_year),
            class_id: fee.class_level ? String(fee.class_level) : ''
        });
        setEditingFeeId(fee.id);
        setShowFeeModal(true);
    };

    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            window.confirm('Record this expense?') && await financeAPI.expenses.create(expenseForm);
            setShowExpenseModal(false);
            setExpenseForm({ category: 'SUPPLIES', amount: '', description: '', paid_to: '', date_occurred: '' });
            loadData();
        } catch (err: any) {
            alert('Failed to record expense');
        }
    };

    const handleExpenseStatusChange = async (expenseId: number, newStatus: string) => {
        try {
            await financeAPI.expenses.patch(expenseId, { status: newStatus });
            loadData();
        } catch (err: any) {
            alert('Failed to update expense status');
        }
    };

    const StatsCard = ({ title, value, icon, color }: any) => (
        <div className="card stat-card hover-lift">
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 w-fit`}>
                {React.cloneElement(icon, { className: `${color}` })}
            </div>
            <div className="mt-4">
                <p className="text-secondary text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold mt-1">{value}</h3>
            </div>
        </div>
    );

    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [showViewModal, setShowViewModal] = useState(false);

    // ... existing loadData ...

    // ... existing handlers ...

    const handleViewInvoice = (inv: any) => {
        setSelectedInvoice(inv);
        setShowViewModal(true);
    };

    const handlePayInvoice = (inv: any) => {
        setPayForm({
            ...payForm,
            student_id: String(inv.student),
            invoice_id: inv.id,
            amount: inv.balance // Pre-fill with outstanding balance
        });
        setShowPaymentModal(true);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        Finance & Accounts
                    </h1>
                    <p className="text-secondary mt-1">Manage fees, payments, and school expenses</p>
                </div>
                <div className="flex gap-2">
                    {/* Added Receive Payment to main header for quick access */}
                    {!isReadOnly && (
                        <>
                            <button className="btn btn-outline gap-2 no-print" onClick={() => setShowPaymentModal(true)}>
                                <CreditCard size={18} /> Receive Payment
                            </button>
                            <button className="btn btn-primary gap-2 no-print" onClick={() => setShowInvoiceModal(true)}>
                                <FileText size={18} /> Generate Invoices
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b border-border no-print">
                {['dashboard', 'invoices', 'payments', 'fees', 'expenses'].map(tab => (
                    <button key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-secondary hover:bg-base-200'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="spinner"></div></div>
            ) : (
                <>
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            {/* 2x2 Grid Layout for Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                <StatsCard title="Total Invoiced" value={`KES ${stats.totalInvoiced.toLocaleString()}`} icon={<FileText />} color="text-blue-500" />
                                <StatsCard title="Total Collected" value={`KES ${stats.totalCollected.toLocaleString()}`} icon={<CheckCircle />} color="text-green-500" />
                                <StatsCard title="Outstanding" value={`KES ${stats.totalOutstanding.toLocaleString()}`} icon={<AlertCircle />} color="text-red-500" />
                                <StatsCard title="Daily Collection" value={`KES ${stats.dailyCollection.toLocaleString()}`} icon={<TrendingUp />} color="text-purple-500" />
                            </div>

                            <div className="card">
                                <h3 className="text-lg font-bold mb-4">Recent Invoices</h3>
                                <div className="table-container">
                                    <table className="table w-full">
                                        <thead>
                                            <tr>
                                                <th>Invoice #</th>
                                                <th>Student</th>
                                                <th>Class</th>
                                                <th>Term</th>
                                                <th>Amount</th>
                                                <th>Paid</th>
                                                <th>Balance</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...invoices].sort((a, b) => b.id - a.id).slice(0, 5).map((inv: any) => (
                                                <tr key={inv.id}>
                                                    <td>#{inv.id}</td>
                                                    <td>{inv.student_name}</td>
                                                    <td>{inv.class_name} {inv.stream_name}</td>
                                                    <td>T{inv.term} {inv.academic_year_name}</td>
                                                    <td>{Number(inv.total_amount).toLocaleString()}</td>
                                                    <td>{Number(inv.paid_amount).toLocaleString()}</td>
                                                    <td>{Number(inv.balance).toLocaleString()}</td>
                                                    <td>
                                                        <span className={`badge ${inv.status === 'PAID' ? 'badge-success' :
                                                            inv.status === 'PARTIAL' ? 'badge-warning' : 'badge-error'
                                                            }`}>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="btn btn-xs btn-ghost" onClick={() => handleViewInvoice(inv)}>View</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'fees' && (
                        <div className="card">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-bold">Fee Structures</h3>
                                {!isReadOnly && (
                                    <button className="btn btn-sm btn-secondary" onClick={() => setShowFeeModal(true)}>
                                        <Plus size={16} className="mr-1" /> Add New Fee
                                    </button>
                                )}
                            </div>
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>For Class</th>
                                        <th>Term</th>
                                        <th>Amount</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feeStructures.map((fee: any) => (
                                        <tr key={fee.id}>
                                            <td>{fee.name}</td>
                                            <td>{String(fee.class_level || 'All')}</td>
                                            <td>Term {fee.term}</td>
                                            <td className="font-mono">{Number(fee.amount).toLocaleString()}</td>
                                            <td className="flex gap-2">
                                                <button className="btn btn-xs btn-outline" onClick={() => openEditFee(fee)}>Edit</button>
                                                <button className="btn btn-xs btn-error" onClick={() => handleDeleteFee(fee.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div className="card">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg font-bold">School Expenses</h3>
                                <div className="flex gap-2">
                                    <button className="btn btn-sm btn-outline" onClick={() => exportToCSV(expenses, 'expenses_report')}>
                                        <Download size={16} /> Export CSV
                                    </button>
                                    {!isReadOnly && (
                                        <button className="btn btn-sm btn-secondary" onClick={() => setShowExpenseModal(true)}>
                                            <Plus size={16} className="mr-1" /> Add Expense
                                        </button>
                                    )}
                                </div>
                            </div>
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Category</th>
                                        <th>Description</th>
                                        <th>Paid To</th>
                                        <th>Approved By</th>
                                        <th>Amount</th>
                                        <th className="text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map((exp: any) => (
                                        <tr key={exp.id}>
                                            <td>{exp.date_occurred}</td>
                                            <td><span className="badge badge-ghost">{exp.category}</span></td>
                                            <td>{exp.description}</td>
                                            <td>{exp.paid_to}</td>
                                            <td>{exp.approved_by_name || '-'}</td>
                                            <td className="font-bold">{Number(exp.amount).toLocaleString()}</td>
                                            <td className="text-center">
                                                {user?.role === 'ACCOUNTANT' ? (
                                                    <select
                                                        className={`select select-xs select-bordered font-bold ${exp.status === 'APPROVED' ? 'text-success' : exp.status === 'DECLINED' ? 'text-error' : 'text-warning'}`}
                                                        value={exp.status}
                                                        onChange={(e) => handleExpenseStatusChange(exp.id, e.target.value)}
                                                    >
                                                        <option value="PENDING">Pending</option>
                                                        <option value="APPROVED">Approve</option>
                                                        <option value="DECLINED">Decline</option>
                                                    </select>
                                                ) : (
                                                    <span className={`badge badge-sm font-bold ${exp.status === 'APPROVED' ? 'badge-success' : exp.status === 'DECLINED' ? 'badge-error' : 'badge-warning'}`}>
                                                        {exp.status}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'invoices' && (
                        <div className="card">
                            <div className="flex flex-col md:flex-row justify-between mb-4 gap-4 items-end">
                                <div>
                                    <h3 className="text-lg font-bold">All Invoices</h3>
                                    <div className="flex gap-2 mt-2">
                                        <select className="select select-sm select-bordered" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                                            <option value="">All Classes</option>
                                            {[...new Set(invoices.map((i: any) => i.class_name).filter(Boolean))].map((c: any) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        <select className="select select-sm select-bordered" value={filterStream} onChange={e => setFilterStream(e.target.value)}>
                                            <option value="">All Streams</option>
                                            {[...new Set(invoices.map((i: any) => i.stream_name).filter(Boolean))].map((s: any) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                        <select className="select select-sm select-bordered" value={filterTerm} onChange={e => setFilterTerm(e.target.value)}>
                                            <option value="">All Terms</option>
                                            {[1, 2, 3].map(t => <option key={t} value={t}>Term {t}</option>)}
                                        </select>
                                        <select className="select select-sm select-bordered" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                                            <option value="">All Years</option>
                                            {[...new Set(invoices.map((i: any) => i.academic_year_name).filter(Boolean))].map((y: any) => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2 no-print">
                                    <button className="btn btn-sm btn-outline" onClick={() => window.print()}>Print</button>
                                    <button className="btn btn-sm btn-secondary" onClick={() => exportToCSV(invoices, 'invoices_report')}>Download CSV</button>
                                </div>
                            </div>
                            <div className="table-container max-h-[600px] overflow-y-auto">
                                <table className="table w-full">
                                    <thead className="sticky top-0 bg-base-100 z-10">
                                        <tr>
                                            <th>ID</th>
                                            <th>Student</th>
                                            <th>Class</th>
                                            <th>Term</th>
                                            <th>Year</th>
                                            <th>Total</th>
                                            <th>Balance</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredInvoices().map((inv: any) => (
                                            <tr key={inv.id} className="hover:bg-base-200">
                                                <td>#{inv.id}</td>
                                                <td>
                                                    <div className="font-medium">{inv.student_name}</div>
                                                    <div className="text-xs text-secondary">{inv.admission_number}</div>
                                                </td>
                                                <td>{inv.class_name} {inv.stream_name}</td>
                                                <td>T{inv.term}</td>
                                                <td>{inv.academic_year_name}</td>
                                                <td>{Number(inv.total_amount).toLocaleString()}</td>
                                                <td className="font-bold text-error">{Number(inv.balance).toLocaleString()}</td>
                                                <td>
                                                    <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : inv.status === 'PARTIAL' ? 'badge-warning' : 'badge-error'}`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="flex gap-2">
                                                    <button className="btn btn-xs btn-ghost" onClick={() => handleViewInvoice(inv)}>View</button>
                                                    {!isReadOnly && inv.status !== 'PAID' && (
                                                        <button className="btn btn-xs btn-primary" onClick={() => handlePayInvoice(inv)}>Pay</button>
                                                    )}
                                                </td>
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
                                <h3 className="text-lg font-bold">Payment History</h3>
                                <div className="flex gap-2">
                                    <button className="btn btn-sm btn-outline" onClick={() => exportToCSV(payments, 'payments_report')}>
                                        <Download size={16} /> Export CSV
                                    </button>
                                    {!isReadOnly && (
                                        <button className="btn btn-sm btn-primary" onClick={() => setShowPaymentModal(true)}>
                                            <Plus size={16} className="mr-1" /> Receive Payment
                                        </button>
                                    )}
                                </div>
                            </div>
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>Ref #</th>
                                        <th>Date</th>
                                        <th>Student</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Received By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p: any) => (
                                        <tr key={p.id}>
                                            <td className="font-mono text-xs">{p.reference_number || '-'}</td>
                                            <td>{p.date_received}</td>
                                            <td>{p.student_name}</td>
                                            <td className="text-success font-bold">+{Number(p.amount).toLocaleString()}</td>
                                            <td>{p.method}</td>
                                            <td className="text-sm text-secondary">{p.received_by_name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* View Invoice Modal */}
            <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={`Invoice #${selectedInvoice?.id}`} size="lg">
                {selectedInvoice && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold">{selectedInvoice.student_name}</p>
                                <p className="text-sm opacity-70">{selectedInvoice.admission_number}</p>
                            </div>
                            <div className={`badge ${selectedInvoice.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                                {selectedInvoice.status}
                            </div>
                        </div>

                        <div className="divider my-0"></div>

                        <div className="overflow-x-auto">
                            <table className="table w-full table-compact">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th className="text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedInvoice.items && selectedInvoice.items.map((item: any) => (
                                        <tr key={item.id}>
                                            <td>{item.description}</td>
                                            <td className="text-right">{Number(item.amount).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="font-bold border-t-2">
                                        <td>Total</td>
                                        <td className="text-right">{Number(selectedInvoice.total_amount).toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                            <>
                                <div className="divider my-0">Payments</div>
                                <table className="table w-full table-compact">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Ref</th>
                                            <th>Method</th>
                                            <th className="text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.payments.map((pay: any) => (
                                            <tr key={pay.id}>
                                                <td>{pay.date_received}</td>
                                                <td className="font-mono text-xs">{pay.reference_number || '-'}</td>
                                                <td>{pay.method}</td>
                                                <td className="text-right text-success">-{Number(pay.amount).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t mt-4">
                            <div className="text-lg font-bold">
                                Balance Due: <span className="text-error">{Number(selectedInvoice.balance).toLocaleString()}</span>
                            </div>
                            <div className="flex gap-2">
                                <button className="btn btn-ghost" onClick={() => setShowViewModal(false)}>Close</button>
                                {selectedInvoice.status !== 'PAID' && (
                                    <button className="btn btn-primary" onClick={() => {
                                        setShowViewModal(false);
                                        handlePayInvoice(selectedInvoice);
                                    }}>Make Payment</button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ... other modals (Invoice, Fee, Expense, Payment) remain the same ... */}

            {/* Invoicing Modal */}
            {/* Invoicing Modal */}
            <Modal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Generate Termly Invoices">
                <form onSubmit={handleGenerateInvoices} className="space-y-4">
                    <SearchableSelect
                        label="Academic Year"
                        options={years.map((y: any) => ({ id: y.id, label: y.name }))}
                        value={genForm.year_id}
                        onChange={(val) => setGenForm({ ...genForm, year_id: String(val) })}
                        required
                    />
                    <div className="form-control">
                        <label className="label">Term</label>
                        <select className="select select-bordered" value={genForm.term} onChange={e => setGenForm({ ...genForm, term: e.target.value })}>
                            <option value="1">Term 1</option>
                            <option value="2">Term 2</option>
                            <option value="3">Term 3</option>
                        </select>
                    </div>
                    <SearchableSelect
                        label="Class Level"
                        options={classes.map((c: any) => ({ id: c.id, label: c.name }))}
                        value={genForm.class_id}
                        onChange={(val) => setGenForm({ ...genForm, class_id: String(val) })}
                        required
                    />
                    <div className="modal-action">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Generate Invoices</button>
                    </div>
                </form>
            </Modal>

            {/* Fee Modal */}
            <Modal isOpen={showFeeModal} onClose={() => setShowFeeModal(false)} title="Create Fee Structure">
                <form onSubmit={handleFeeSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">Fee Name</label>
                        <input type="text" className="input input-bordered" placeholder="e.g. Tuition Term 1" required
                            value={feeForm.name} onChange={e => setFeeForm({ ...feeForm, name: e.target.value })}
                        />
                    </div>
                    <SearchableSelect
                        label="Academic Year"
                        options={years.map((y: any) => ({ id: y.id, label: y.name }))}
                        value={feeForm.year_id}
                        onChange={(val) => setFeeForm({ ...feeForm, year_id: String(val) })}
                        required
                    />
                    <div className="form-control">
                        <label className="label">Amount (KES)</label>
                        <input type="number" className="input input-bordered" required
                            value={feeForm.amount} onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">Term</label>
                            <select className="select select-bordered" value={feeForm.term} onChange={e => setFeeForm({ ...feeForm, term: e.target.value })}>
                                <option value="1">Term 1</option>
                                <option value="2">Term 2</option>
                                <option value="3">Term 3</option>
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label">Class (Optional)</label>
                            <select className="select select-bordered" value={feeForm.class_id} onChange={e => setFeeForm({ ...feeForm, class_id: e.target.value })}>
                                <option value="">All Classes</option>
                                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="modal-action">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowFeeModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Create Fee</button>
                    </div>
                </form>
            </Modal>

            {/* Expense Modal */}
            <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Record New Expense">
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">Description</label>
                        <input type="text" className="input input-bordered" placeholder="e.g. Broken Window Repair" required
                            value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">Amount (KES)</label>
                            <input type="number" className="input input-bordered" required
                                value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">Category</label>
                            <select className="select select-bordered" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                                <option value="SUPPLIES">Supplies</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="UTILITIES">Utilities</option>
                                <option value="SALARY">Salary</option>
                                <option value="FOOD">Food</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-control">
                        <label className="label">Paid To (Vendor/Person)</label>
                        <input type="text" className="input input-bordered" placeholder="e.g. John Doe Hardware" required
                            value={expenseForm.paid_to} onChange={e => setExpenseForm({ ...expenseForm, paid_to: e.target.value })}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label">Date Occurred</label>
                        <input type="date" className="input input-bordered" required
                            value={expenseForm.date_occurred} onChange={e => setExpenseForm({ ...expenseForm, date_occurred: e.target.value })}
                        />
                    </div>
                    <div className="modal-action">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Record Expense</button>
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

                    {/* Invoice Selector (Dynamic) */}
                    {payForm.student_id && (
                        <div className="form-control">
                            <label className="label">Select Invoice to Pay</label>
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
                            {invoices.filter((i: any) => String(i.student) === String(payForm.student_id) && i.status !== 'PAID').length === 0 && (
                                <span className="text-xs text-error mt-1">No unpaid invoices found for this student.</span>
                            )}
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
                                placeholder="e.g. QWE123LM"
                                value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="modal-action">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Process Payment</button>
                    </div>
                </form>
            </Modal>


            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .card { box-shadow: none !important; border: 1px solid #ddd; }
                    body { background: white; }
                    .table-container { max-height: none !important; overflow: visible !important; }
                }
            `}</style>
        </div >
    );
};


export default Finance;

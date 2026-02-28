import React from 'react';
import { CreditCard, FileText, TrendingUp, CheckCircle, Bell, Send, Mail, MessageSquare } from 'lucide-react';
import Modal from '../../components/Modal';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/SearchableSelect';
import PremiumDateInput from '../../components/common/DatePicker';

interface FinanceModalsProps {
    // Invoice Gen
    showInvoiceModal: boolean;
    setShowInvoiceModal: (val: boolean) => void;
    genForm: any;
    setGenForm: (val: any) => void;
    handleGenerateInvoices: (e: React.FormEvent) => void;

    // Payment
    showPaymentModal: boolean;
    setShowPaymentModal: (val: boolean) => void;
    payForm: any;
    setPayForm: (val: any) => void;
    handlePaymentSubmit: (e: React.FormEvent) => void;

    // Fee Structure
    showFeeModal: boolean;
    setShowFeeModal: (val: boolean) => void;
    feeForm: any;
    setFeeForm: (val: any) => void;
    handleFeeSubmit: (e: React.FormEvent) => void;
    editingFeeId: number | null;

    // Expense
    showExpenseModal: boolean;
    setShowExpenseModal: (val: boolean) => void;
    expenseForm: any;
    setExpenseForm: (val: any) => void;
    handleExpenseSubmit: (e: React.FormEvent) => void;

    // M-Pesa
    showMpesaModal: boolean;
    setShowMpesaModal: (val: boolean) => void;
    mpesaForm: any;
    setMpesaForm: (val: any) => void;
    handleMpesaPush: (e: React.FormEvent) => void;

    // Reminders
    showReminderModal: boolean;
    setShowReminderModal: (val: boolean) => void;
    reminderForm: any;
    setReminderForm: (val: any) => void;
    handleSendReminders: (e: React.FormEvent) => void;
    selectedInvoicesSize: number;

    // Invoice Detail
    selectedInvoice: any;
    setSelectedInvoice: (val: any) => void;
    formatDate: (d: string) => string;
    formatDateTime: (d: string) => string;

    // Shared Data
    years: any[];
    classes: any[];
    uniqueClassNames: string[];
    students: any[];
    setStudents: React.Dispatch<React.SetStateAction<any[]>>;
    activeStudentInvoices: any[];
    setActiveStudentInvoices: React.Dispatch<React.SetStateAction<any[]>>;
    isSubmitting: boolean;
    studentsAPI: any;
    financeAPI: any;
}

const FinanceModals: React.FC<FinanceModalsProps> = ({
    showInvoiceModal, setShowInvoiceModal, genForm, setGenForm, handleGenerateInvoices,
    showPaymentModal, setShowPaymentModal, payForm, setPayForm, handlePaymentSubmit,
    showFeeModal, setShowFeeModal, feeForm, setFeeForm, handleFeeSubmit, editingFeeId,
    showExpenseModal, setShowExpenseModal, expenseForm, setExpenseForm, handleExpenseSubmit,
    showMpesaModal, setShowMpesaModal, mpesaForm, setMpesaForm, handleMpesaPush,
    showReminderModal, setShowReminderModal, reminderForm, setReminderForm, handleSendReminders, selectedInvoicesSize,
    selectedInvoice, setSelectedInvoice, formatDate, formatDateTime,
    years, classes, uniqueClassNames, students, setStudents, activeStudentInvoices, setActiveStudentInvoices, isSubmitting,
    studentsAPI, financeAPI
}) => {
    return (
        <>
            {/* Invoice Generation Modal */}
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
                            onSearch={async (term) => {
                                if (term.length > 2) {
                                    try {
                                        const res = await studentsAPI.minimalSearch({ search: term, has_debt: true });
                                        const results = res.data?.results ?? res.data ?? [];
                                        setStudents(prev => {
                                            const map = new Map(prev.map((s: any) => [s.id, s]));
                                            results.forEach((r: any) => map.set(r.id, r));
                                            return Array.from(map.values()) as any;
                                        });
                                    } catch (e) {
                                        console.error("Student search failed", e);
                                    }
                                }
                            }}
                            value={payForm.student_id}
                            onChange={async (val) => {
                                const studentId = String(val);
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

            {/* Invoice Detail Modal */}
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
                                <span className={`font-black ${Number(selectedInvoice.balance) === 0 ? 'text-success' : Number(selectedInvoice.balance) < 0 ? 'text-info' : 'text-error'} `}>KES {Number(selectedInvoice.balance).toLocaleString()}</span>
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

            {/* Mpesa Modal */}
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
                                setMpesaForm({ ...mpesaForm, admission_number: adminNum, amount: String(stud.fee_balance || mpesaForm.amount) });
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
                            <h4 className="font-bold text-blue-900 text-sm">Target: {selectedInvoicesSize} Parents</h4>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Reminders to {selectedInvoicesSize} selected parents. Correct student name and balance will be inserted.
                            </p>
                        </div>
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-bold">Message Template</span>
                            <span className="label-text-alt text-gray-400">Use {`{ student_name } `} and {`{ balance } `}</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered h-32 text-sm leading-relaxed"
                            required
                            value={reminderForm.template}
                            onChange={e => setReminderForm({ ...reminderForm, template: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="checkbox" className="checkbox checkbox-primary" checked={reminderForm.send_sms} onChange={e => setReminderForm({ ...reminderForm, send_sms: e.target.checked })} />
                            <div className="flex items-center gap-2"><MessageSquare size={18} className="text-gray-400" /><span className="text-sm font-bold">SMS</span></div>
                        </label>
                        <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="checkbox" className="checkbox checkbox-primary" checked={reminderForm.send_email} onChange={e => setReminderForm({ ...reminderForm, send_email: e.target.checked })} />
                            <div className="flex items-center gap-2"><Mail size={18} className="text-gray-400" /><span className="text-sm font-bold">Email</span></div>
                        </label>
                    </div>
                    <div className="modal-action">
                        <Button type="button" variant="ghost" onClick={() => setShowReminderModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" className="bg-orange-600 hover:bg-orange-700 border-none px-8" loading={isSubmitting} icon={<Send size={16} />}>
                            Send Reminders
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default FinanceModals;

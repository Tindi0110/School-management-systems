import React, { useState, type FormEvent } from 'react';
import { CreditCard, Printer, TrendingUp, CheckCircle, Bell, Mail, MessageSquare } from 'lucide-react';
import Modal from '../../components/Modal';
import SearchableSelect from '../../components/SearchableSelect';
import PremiumDateInput from '../../components/common/DatePicker';

interface Student {
    id: number;
    admission_number: string;
    full_name: string;
    fee_balance: string | number;
}

interface AcademicYear {
    id: number;
    name: string;
}

interface SchoolClass {
    id: number;
    name: string;
    stream: string;
}

interface InvoiceItem {
    id: number;
    description: string;
    amount: string | number;
    created_at?: string;
}

export interface Invoice {
    id: number;
    student: number;
    student_name: string;
    admission_number: string;
    class_name: string;
    stream_name?: string;
    academic_year: number | string;
    academic_year_name?: string;
    term: number | string;
    total_amount: number | string;
    paid_amount: number | string;
    balance: number | string;
    status: string;
    date_generated: string;
    items?: InvoiceItem[];
}

export interface Payment {
    id: number;
    invoice: number;
    student_name?: string;
    amount: number;
    method: string;
    reference_number?: string;
    date_received: string;
    created_at?: string;
}

export interface Adjustment {
    id: number;
    invoice: number;
    adjustment_type: 'CREDIT' | 'DEBIT';
    amount: string | number;
    reason: string;
    date: string;
    created_at?: string;
}

interface InvoiceDetail {
    id: number;
    student: number; // Added to fix build error
    status: string;
    balance: string | number;
    academic_year_name: string;
    academic_year_id?: number;
    term: string | number;
    date_generated: string;
    student_name: string;
    admission_number: string;
    class_name: string;
    stream_name: string;
    total_amount: string | number;
    paid_amount: string | number;
    items?: InvoiceItem[];
    adjustments?: Adjustment[];
    payments?: Payment[];
}

interface FinanceModalsProps {
    // Invoice Gen
    showInvoiceModal: boolean;
    setShowInvoiceModal: (val: boolean) => void;
    genForm: { class_id: string; level: string; term: string; year_id: string };
    setGenForm: (val: any) => void;
    handleGenerateInvoices: (e: FormEvent) => void;

    // Payment
    showPaymentModal: boolean;
    setShowPaymentModal: (val: boolean) => void;
    payForm: { student_id: string; invoice_id: string; amount: string; method: string; reference: string };
    setPayForm: (val: any) => void;
    handlePaymentSubmit: (e: FormEvent) => void;

    // Fee Structure
    showFeeModal: boolean;
    setShowFeeModal: (val: boolean) => void;
    feeForm: { name: string; amount: string; term: string; year_id: string; class_id: string };
    setFeeForm: (val: any) => void;
    handleFeeSubmit: (e: FormEvent) => void;
    editingFeeId: number | null;

    // Expense
    showExpenseModal: boolean;
    setShowExpenseModal: (val: boolean) => void;
    expenseForm: { category: string; amount: string; description: string; paid_to: string; date_occurred: string; receipt_scan: File | null };
    setExpenseForm: (val: any) => void;
    handleExpenseSubmit: (e: FormEvent) => void;

    // M-Pesa
    showMpesaModal: boolean;
    setShowMpesaModal: (val: boolean) => void;
    mpesaForm: { admission_number: string; phone_number: string; amount: string };
    setMpesaForm: (val: any) => void;
    handleMpesaPush: (e: FormEvent) => void;

    // Reminders
    showReminderModal: boolean;
    setShowReminderModal: (val: boolean) => void;
    reminderForm: { template: string; send_sms: boolean; send_email: boolean };
    setReminderForm: (val: any) => void;
    handleSendReminders: (e: FormEvent) => void;
    selectedInvoicesSize: number;

    // Adjustment
    showAdjustmentModal: boolean;
    setShowAdjustmentModal: (val: boolean) => void;
    adjForm: { student_id: string; invoice_id: string; amount: string; type: string; reason: string };
    setAdjForm: (val: any) => void;
    handleAdjustmentSubmit: (e: FormEvent) => void;

    // Invoice Detail
    selectedInvoice: InvoiceDetail | null;
    setSelectedInvoice: (val: InvoiceDetail | null) => void;
    formatDate: (d: string) => string;
    formatDateTime: (d: string) => string;

    // Shared Data
    years: AcademicYear[];
    classes: SchoolClass[];
    uniqueClassNames: string[];
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    activeStudentInvoices: InvoiceDetail[];
    setActiveStudentInvoices: React.Dispatch<React.SetStateAction<InvoiceDetail[]>>;
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
    showAdjustmentModal, setShowAdjustmentModal, adjForm, setAdjForm, handleAdjustmentSubmit,
    selectedInvoice, setSelectedInvoice, formatDate, formatDateTime,
    years, classes, uniqueClassNames, students, setStudents, activeStudentInvoices, setActiveStudentInvoices, isSubmitting,
    studentsAPI, financeAPI
}) => {
    const [showOnlyWithDebt, setShowOnlyWithDebt] = useState(true);

    return (
        <>
            {/* Invoice Generation Modal */}
            <Modal 
                isOpen={showInvoiceModal} 
                onClose={() => setShowInvoiceModal(false)} 
                title="Bulk Invoice Generation"
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
                        <button type="submit" form="invoice-gen-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "GENERATING..." : "GENERATE BATCH"}
                        </button>
                    </>
                }
            >
                <form id="invoice-gen-form" onSubmit={handleGenerateInvoices} className="space-y-6">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                        <TrendingUp size={16} className="text-blue-500 mt-0.5 shrink-0" />
                        <span className="text-[11px] font-medium text-blue-700 leading-relaxed italic">
                            This will generate invoices for <strong>ALL students</strong> in the selected class who do not already have an invoice for this period.
                        </span>
                    </div>
                    <div className="form-group">
                        <label>Academic Year</label>
                        <SearchableSelect
                            placeholder="Select Year"
                            options={years.map((y: AcademicYear) => ({ id: y.id.toString(), label: y.name }))}
                            value={genForm.year_id}
                            onChange={(val) => setGenForm({ ...genForm, year_id: val.toString() })}
                            required
                        />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Class Level</label>
                            <SearchableSelect
                                placeholder="Select Level"
                                options={[
                                    { id: 'all', label: 'ALL CLASS LEVELS' },
                                    ...uniqueClassNames.map((name: string) => ({ id: name, label: name }))
                                ]}
                                value={genForm.level}
                                onChange={(val) => setGenForm({ ...genForm, level: val.toString(), class_id: '' })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Specific Stream</label>
                            <SearchableSelect
                                placeholder="Select Stream"
                                options={[
                                    { id: 'all', label: 'ALL STREAMS' },
                                    ...classes.filter((c: SchoolClass) => c.name === genForm.level).map((c: SchoolClass) => ({ id: c.id.toString(), label: c.stream }))
                                ]}
                                value={genForm.class_id}
                                onChange={(val) => setGenForm({ ...genForm, class_id: val.toString() })}
                                disabled={!genForm.level || genForm.level === 'all'}
                                required={genForm.level !== 'all'}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Academic Term</label>
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
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal 
                isOpen={showPaymentModal} 
                onClose={() => setShowPaymentModal(false)} 
                title="Receive Fee Payment"
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                        <button type="submit" form="payment-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "PROCESSING..." : "RECORD PAYMENT"}
                        </button>
                    </>
                }
            >
                <form id="payment-form" onSubmit={handlePaymentSubmit} className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-primary">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Manual Transaction</h4>
                            <p className="text-xs font-bold text-slate-700">Record direct cash, bank, or cheque payments</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="checkbox" 
                                    checked={showOnlyWithDebt}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowOnlyWithDebt(e.target.checked)}
                                />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Only students with arrears</span>
                            </label>
                        </div>

                        <div className="form-group">
                            <label>Search Student Candidate</label>
                            <SearchableSelect
                                placeholder="Type Name or Admission Number..."
                                options={students.map((s: Student) => ({
                                    id: s.id,
                                    label: `${s.admission_number} - ${s.full_name} `,
                                    subLabel: (
                                        <span className={Number(s.fee_balance) > 0 ? 'text-rose-600 font-black uppercase text-[9px]' : 'text-emerald-600 font-black uppercase text-[9px]'}>
                                            BALANCE: KES {Number(s.fee_balance).toLocaleString()}
                                        </span>
                                    )
                                }))}
                                onSearch={async (term: string) => {
                                    if (term.length > 0 || term === '*') {
                                        try {
                                            const res = await studentsAPI.minimalSearch({ 
                                                search: term, 
                                                has_debt: showOnlyWithDebt 
                                            });
                                            const results = res.data?.results ?? res.data ?? [];
                                            setStudents((prev: Student[]) => {
                                                const map = new Map(prev.map((s: Student) => [s.id, s]));
                                                results.forEach((r: Student) => map.set(r.id, r));
                                                return Array.from(map.values());
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
                                        const validInvoices = studentInvoices.filter((i: InvoiceDetail) => i.status !== 'PAID' && Number(i.balance) !== 0);
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
                        </div>

                        {payForm.student_id && (
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                <div className="form-group">
                                    <label>Select Target Invoice</label>
                                    <SearchableSelect
                                        placeholder="Select Active Invoice"
                                        options={activeStudentInvoices
                                            .filter((i: InvoiceDetail) => i.status !== 'PAID' && Number(i.balance) !== 0)
                                            .map((i: InvoiceDetail) => ({
                                                id: i.id.toString(),
                                                label: `Invoice #${i.id} | ${i.academic_year_name} T${i.term} `,
                                                subLabel: `REMAINING: KES ${Number(i.balance).toLocaleString()} `
                                            }))}
                                        value={payForm.invoice_id}
                                        onChange={(val) => {
                                            const invId = val.toString();
                                            const inv = activeStudentInvoices.find((i: InvoiceDetail) => String(i.id) === invId);
                                            setPayForm({
                                                ...payForm,
                                                invoice_id: invId,
                                                amount: inv ? String(inv.balance) : payForm.amount
                                            });
                                        }}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Payment Amount (KES)</label>
                        <input 
                            type="number" 
                            className="text-lg font-black"
                            required
                            value={payForm.amount} 
                            onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                        />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Payment Channel</label>
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
                            <label>Transaction Reference</label>
                            <input 
                                type="text" 
                                placeholder="Ref Number..."
                                value={payForm.reference} 
                                onChange={e => setPayForm({ ...payForm, reference: e.target.value })}
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Fee Modal */}
            <Modal 
                isOpen={showFeeModal} 
                onClose={() => setShowFeeModal(false)} 
                title={editingFeeId ? "Edit Fee Structure" : "New Fee Structure"}
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setShowFeeModal(false)}>Cancel</button>
                        <button type="submit" form="fee-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "SAVING..." : "SAVE STRUCTURE"}
                        </button>
                    </>
                }
            >
                <form id="fee-form" onSubmit={handleFeeSubmit} className="space-y-6">
                    <div className="form-group">
                        <label>Structure Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Tuition Fee" 
                            required
                            value={feeForm.name} 
                            onChange={e => setFeeForm({ ...feeForm, name: e.target.value })}
                        />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Academic Year</label>
                            <SearchableSelect
                                placeholder="Select Year"
                                options={years.map((y: AcademicYear) => ({ id: y.id.toString(), label: y.name }))}
                                value={feeForm.year_id}
                                onChange={(val) => setFeeForm({ ...feeForm, year_id: val.toString() })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Target Class Level</label>
                            <SearchableSelect
                                placeholder="All Levels"
                                options={classes.map((c: SchoolClass) => ({ id: c.id.toString(), label: c.name }))}
                                value={feeForm.class_id}
                                onChange={(val) => setFeeForm({ ...feeForm, class_id: val.toString() })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Base Amount (KES)</label>
                            <input 
                                type="number" 
                                required
                                value={feeForm.amount} 
                                onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Academic Term</label>
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
                </form>
            </Modal>

            {/* Invoice Detail Modal */}
            <Modal 
                isOpen={!!selectedInvoice} 
                onClose={() => setSelectedInvoice(null)} 
                title={`Invoice Details - #INV-${selectedInvoice?.id}`}
                footer={
                    <div className="flex justify-between items-center w-full">
                        <button 
                            type="button" 
                            className="modern-btn modern-btn-outline" 
                            onClick={() => {
                                if (selectedInvoice) {
                                    setAdjForm({ 
                                        student_id: String((selectedInvoice as any).student), 
                                        invoice_id: String(selectedInvoice.id), 
                                        amount: '', 
                                        type: 'CREDIT', 
                                        reason: '' 
                                    });
                                    setShowAdjustmentModal(true);
                                }
                            }}
                        >
                            <TrendingUp size={14} className="mr-2" /> APPLY WAIVER/FINE
                        </button>
                        <div className="flex gap-3">
                            <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setSelectedInvoice(null)}>Close</button>
                            <button type="button" className="modern-btn modern-btn-primary" onClick={() => window.print()}>
                                <Printer size={14} className="mr-2" /> PRINT / PDF
                            </button>
                        </div>
                    </div>
                }
            >
                {selectedInvoice && (
                    <div className="space-y-8">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Student Candidate</p>
                                <p className="font-black text-slate-800">{selectedInvoice.student_name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Admission ID</p>
                                <p className="font-mono text-xs font-bold text-slate-600 uppercase tracking-tight">{selectedInvoice.admission_number}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Class Scope</p>
                                <p className="font-bold text-slate-700">{selectedInvoice.class_name} {selectedInvoice.stream_name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Period</p>
                                <p className="font-bold text-slate-700">Term {selectedInvoice.term} ({selectedInvoice.academic_year_name})</p>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Transaction Items</h4>
                                <span className="badge bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-full">
                                    {(selectedInvoice.items?.length || 0) + (selectedInvoice.adjustments?.length || 0) + (selectedInvoice.payments?.length || 0)} RECORDS
                                </span>
                            </div>
                            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount (KES)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedInvoice.items?.map((item: InvoiceItem) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-xs font-bold text-slate-700">{item.description}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                                                        {item.created_at ? formatDateTime(item.created_at) : formatDate(selectedInvoice.date_generated)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-xs font-black text-slate-600">
                                                    {Number(item.amount).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {selectedInvoice.adjustments && selectedInvoice.adjustments.length > 0 && (
                                            <>
                                                <tr className="bg-slate-50/50"><td colSpan={2} className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Financial Adjustments</td></tr>
                                                {selectedInvoice.adjustments.map((adj: Adjustment) => (
                                                    <tr key={adj.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="text-xs font-bold text-slate-700">{adj.reason}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                                                                {adj.adjustment_type} &bull; {adj.created_at ? formatDateTime(adj.created_at) : formatDate(adj.date || '')}
                                                            </div>
                                                        </td>
                                                        <td className={`px-6 py-4 text-right font-mono text-xs font-black ${adj.adjustment_type === 'DEBIT' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                            {adj.adjustment_type === 'DEBIT' ? '+' : '-'} {Number(adj.amount).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}
                                        {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                                            <>
                                                <tr className="bg-slate-50/50"><td colSpan={2} className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Payments Received</td></tr>
                                                {selectedInvoice.payments.map((pay: Payment) => (
                                                    <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="text-xs font-bold text-slate-700">Payment - {pay.method}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                                                                {pay.reference_number && `REF: ${pay.reference_number} • `} {pay.created_at ? formatDateTime(pay.created_at) : formatDate(pay.date_received || '')}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono text-xs font-black text-emerald-500">
                                                            - {Number(pay.amount).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-8 rounded-2xl shadow-xl text-white space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-50">
                                <span>Subtotal Revenue</span>
                                <span>KES {Number(selectedInvoice.total_amount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                <span>Total Remitted</span>
                                <span>- KES {Number(selectedInvoice.paid_amount).toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-white/10 my-4"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Current Balance Due</span>
                                <span className={`text-2xl font-black ${Number(selectedInvoice.balance) === 0 ? 'text-emerald-400' : Number(selectedInvoice.balance) < 0 ? 'text-sky-400' : 'text-rose-400'} `}>
                                    KES {Number(selectedInvoice.balance).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Expense Modal */}
            <Modal 
                isOpen={showExpenseModal} 
                onClose={() => setShowExpenseModal(false)} 
                title="Record New Expense"
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                        <button type="submit" form="expense-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "SAVING..." : "RECORD EXPENSE"}
                        </button>
                    </>
                }
            >
                <form id="expense-form" onSubmit={handleExpenseSubmit} className="space-y-6">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Expense Category</label>
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
                            <label>Amount (KES)</label>
                            <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Transaction Date</label>
                            <PremiumDateInput
                                value={expenseForm.date_occurred}
                                onChange={(val) => setExpenseForm({ ...expenseForm, date_occurred: val })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Paid To / Vendor</label>
                            <input type="text" value={expenseForm.paid_to} onChange={e => setExpenseForm({ ...expenseForm, paid_to: e.target.value })} required />
                        </div>
                        <div className="form-group col-span-2">
                            <label>Supporting Receipt (Optional)</label>
                            <input 
                                type="file" 
                                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" 
                                accept="image/*,.pdf" 
                                onChange={e => setExpenseForm({ ...expenseForm, receipt_scan: e.target.files?.[0] || null })} 
                            />
                        </div>
                        <div className="form-group col-span-2">
                            <label>Detailed Description</label>
                            <textarea className="h-24" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} required />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Mpesa Modal */}
            <Modal 
                isOpen={showMpesaModal} 
                onClose={() => setShowMpesaModal(false)} 
                title="M-Pesa STK Push"
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setShowMpesaModal(false)}>Cancel</button>
                        <button type="submit" form="mpesa-form" className="modern-btn bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200" disabled={isSubmitting}>
                            {isSubmitting ? "SENDING PROMPT..." : "SEND STK PUSH"}
                        </button>
                    </>
                }
            >
                <form id="mpesa-form" onSubmit={handleMpesaPush} className="space-y-6">
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
                        <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-[11px] font-medium text-emerald-700 leading-relaxed italic">
                            This will send a secure payment prompt to the parent's phone. Fees will be <strong>automatically updated</strong> once paid.
                        </span>
                    </div>
                    <div className="form-group">
                        <label>Candidate Search</label>
                        <SearchableSelect
                            placeholder="Type Name or Admission Number..."
                            options={students.map((s: Student) => ({
                                id: s.admission_number,
                                label: `${s.admission_number} - ${s.full_name} `,
                                subLabel: (
                                    <span className={Number(s.fee_balance) > 0 ? 'text-rose-600 font-black uppercase text-[9px]' : 'text-emerald-600 font-black uppercase text-[9px]'}>
                                        ARREARS: KES {Number(s.fee_balance).toLocaleString()}
                                    </span>
                                )
                            }))}
                            onSearch={async (term: string) => {
                                if (term.length > 0 || term === '*') {
                                    try {
                                        const res = await studentsAPI.minimalSearch({
                                            search: term,
                                            has_debt: showOnlyWithDebt
                                        });
                                        const results = res.data?.results ?? res.data ?? [];
                                        setStudents((prev: Student[]) => {
                                            const map = new Map(prev.map((s: Student) => [s.id, s]));
                                            results.forEach((r: Student) => map.set(r.id, r));
                                            return Array.from(map.values());
                                        });
                                    } catch (e) {
                                        console.error("Student search failed", e);
                                    }
                                }
                            }}
                            value={mpesaForm.admission_number}
                            onChange={async (val) => {
                                const adminNum = String(val);
                                const stud = students.find((s: Student) => String(s.admission_number) === adminNum);
                                if (stud) {
                                    setMpesaForm({ ...mpesaForm, admission_number: adminNum, amount: String(stud.fee_balance || mpesaForm.amount) });
                                } else {
                                    setMpesaForm({ ...mpesaForm, admission_number: adminNum });
                                }
                            }}
                            required
                        />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Safaricom Phone Number</label>
                            <input 
                                type="text" 
                                placeholder="e.g. 0712345678" 
                                required
                                value={mpesaForm.phone_number} 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMpesaForm({ ...mpesaForm, phone_number: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Payment Amount (KES)</label>
                            <input 
                                type="number" 
                                className="font-black text-slate-800"
                                required
                                value={mpesaForm.amount} 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMpesaForm({ ...mpesaForm, amount: e.target.value })}
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Bulk Reminder Modal */}
            <Modal 
                isOpen={showReminderModal} 
                onClose={() => setShowReminderModal(false)} 
                title="Send Automated Fee Reminders"
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setShowReminderModal(false)}>Cancel</button>
                        <button type="submit" form="reminder-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "SENDING..." : "SEND REMINDERS"}
                        </button>
                    </>
                }
            >
                <form id="reminder-form" onSubmit={handleSendReminders} className="space-y-6">
                    <div className="bg-sky-50 p-6 rounded-2xl border border-sky-100 flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-sky-100 flex items-center justify-center text-sky-500 shrink-0">
                            <Bell size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-sky-900 text-xs uppercase tracking-widest mb-1">Targeting {selectedInvoicesSize} Parents</h4>
                            <p className="text-[11px] text-sky-700 leading-relaxed font-medium italic">
                                Personalized reminders will be dispatched to {selectedInvoicesSize} selected recipients. Student names and outstanding balances will be automatically injected.
                            </p>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="flex justify-between items-center">
                            <span>Communication Template</span>
                            <span className="text-[9px] font-black uppercase text-slate-400">Tokens: {'{student_name}'}, {'{balance}'}</span>
                        </label>
                        <textarea
                            className="h-32 text-sm leading-relaxed"
                            required
                            placeholder="Dear Parent, this is a reminder that {student_name} has an outstanding balance of KES {balance}..."
                            value={reminderForm.template}
                            onChange={e => setReminderForm({ ...reminderForm, template: e.target.value })}
                        />
                    </div>
                    <div className="form-grid">
                        <label className="group flex items-center gap-4 p-4 bg-slate-50 border-2 border-transparent hover:border-primary hover:bg-white rounded-2xl cursor-pointer transition-all">
                            <input type="checkbox" className="checkbox" checked={reminderForm.send_sms} onChange={e => setReminderForm({ ...reminderForm, send_sms: e.target.checked })} />
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400 group-hover:text-primary transition-colors"><MessageSquare size={18} /></div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-600">SMS Channel</span>
                            </div>
                        </label>
                        <label className="group flex items-center gap-4 p-4 bg-slate-50 border-2 border-transparent hover:border-primary hover:bg-white rounded-2xl cursor-pointer transition-all">
                            <input type="checkbox" className="checkbox" checked={reminderForm.send_email} onChange={e => setReminderForm({ ...reminderForm, send_email: e.target.checked })} />
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400 group-hover:text-primary transition-colors"><Mail size={18} /></div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-600">Email Channel</span>
                            </div>
                        </label>
                    </div>
                </form>
            </Modal>

            {/* Adjustment Modal */}
            <Modal 
                isOpen={showAdjustmentModal} 
                onClose={() => setShowAdjustmentModal(false)} 
                title="Invoice Adjustment"
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setShowAdjustmentModal(false)}>Cancel</button>
                        <button type="submit" form="adjustment-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "PROCESSING..." : "APPLY ADJUSTMENT"}
                        </button>
                    </>
                }
            >
                <form id="adjustment-form" onSubmit={handleAdjustmentSubmit} className="space-y-6">
                    <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex items-start gap-3">
                        <TrendingUp size={16} className="text-purple-500 mt-0.5 shrink-0" />
                        <span className="text-[11px] font-medium text-purple-700 leading-relaxed italic">
                            Use <strong>Credit Note</strong> for Waivers (reduces balance) and <strong>Debit Note</strong> for Fines or Corrections (increases balance).
                        </span>
                    </div>

                    <div className="form-group">
                        <label>Target Candidate</label>
                        <SearchableSelect
                            placeholder="Select Student..."
                            options={students.map((s: Student) => ({
                                id: s.id,
                                label: `${s.admission_number} - ${s.full_name}`,
                                subLabel: `BALANCE: KES ${Number(s.fee_balance).toLocaleString()}`
                            }))}
                            value={adjForm.student_id}
                            onSearch={async (term: string) => {
                                if (term.length > 0 || term === '*') {
                                    try {
                                        const res = await studentsAPI.minimalSearch({ search: term });
                                        const results = res.data?.results ?? res.data ?? [];
                                        setStudents((prevItem: Student[]) => {
                                            const map = new Map(prevItem.map((s: Student) => [s.id, s]));
                                            results.forEach((r: Student) => map.set(r.id, r));
                                            return Array.from(map.values());
                                        });
                                    } catch (e) { console.error(e); }
                                }
                            }}
                            onChange={async (val) => {
                                const studentId = String(val);
                                try {
                                    const res = await financeAPI.invoices.getAll({ student: studentId, status: 'UNPAID' });
                                    const studentInvoices = res.data?.results ?? res.data ?? [];
                                    setActiveStudentInvoices(studentInvoices);
                                    setAdjForm({ ...adjForm, student_id: studentId, invoice_id: studentInvoices[0]?.id.toString() || '' });
                                } catch (err) { console.error(err); }
                            }}
                            required
                            disabled={!!selectedInvoice}
                        />
                    </div>

                    {adjForm.student_id && (
                        <div className="form-group">
                            <label>Target Invoice Reference</label>
                            <SearchableSelect
                                placeholder="Select Invoice"
                                options={activeStudentInvoices.map((i: InvoiceDetail) => ({
                                    id: i.id.toString(),
                                    label: `Invoice #${i.id} | Term ${i.term} (${i.academic_year_name})`,
                                    subLabel: `CURRENT BALANCE: KES ${Number(i.balance).toLocaleString()}`
                                }))}
                                value={adjForm.invoice_id}
                                onChange={(val) => setAdjForm({ ...adjForm, invoice_id: val.toString() })}
                                required
                            />
                        </div>
                    )}

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Adjustment Classification</label>
                            <SearchableSelect
                                options={[
                                    { id: 'CREDIT', label: 'Waiver / Credit Note (-)' },
                                    { id: 'DEBIT', label: 'Fine / Debit Note (+)' }
                                ]}
                                value={adjForm.type}
                                onChange={(val) => setAdjForm({ ...adjForm, type: val.toString() })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Adjustment Amount (KES)</label>
                            <input type="number" value={adjForm.amount} onChange={e => setAdjForm({ ...adjForm, amount: e.target.value })} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Justification / Reason</label>
                        <textarea className="h-24" value={adjForm.reason} onChange={e => setAdjForm({ ...adjForm, reason: e.target.value })} required />
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default FinanceModals;

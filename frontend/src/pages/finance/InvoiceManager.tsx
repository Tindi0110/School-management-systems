import React from 'react';
import { Printer } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import Button from '../../components/common/Button';

interface InvoiceManagerProps {
    invoices: any[];
    filteredInvoices: any[];
    invFilters: any;
    setInvFilters: (filters: any) => void;
    uniqueClassNames: string[];
    classes: any[];
    years: any[];
    page: number;
    setPage: (page: number | ((p: number) => number)) => void;
    pageSize: number;
    totalItems: number;
    loadData: () => void;
    formatDate: (date: string) => string;
    setSelectedInvoice: (inv: any) => void;
    selectedInvoices: Set<number>;
    setSelectedInvoices: React.Dispatch<React.SetStateAction<Set<number>>>;
    toggleInvoiceSelection: (id: number) => void;
}

const InvoiceManager: React.FC<InvoiceManagerProps> = ({
    invoices,
    filteredInvoices,
    invFilters,
    setInvFilters,
    uniqueClassNames,
    classes,
    years,
    page,
    setPage,
    pageSize,
    totalItems,
    loadData,
    formatDate,
    setSelectedInvoice,
    selectedInvoices,
    setSelectedInvoices,
    toggleInvoiceSelection
}) => {
    return (
        <div className="card shadow-sm border border-slate-200">
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
                            <th className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice & Student</th>
                            <th className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry Info</th>
                            <th className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Invoiced</th>
                            <th className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Outstanding</th>
                            <th className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInvoices.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-10 text-slate-400 italic">No invoices match your search criteria</td></tr>
                        ) : (
                            filteredInvoices.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-slate-50/50 cursor-pointer transition-colors group" onClick={(e) => {
                                    if ((e.target as HTMLElement).tagName === 'INPUT') return;
                                    setSelectedInvoice(inv);
                                }}>
                                    <td className="px-4">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-xs"
                                            checked={selectedInvoices.has(inv.id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                toggleInvoiceSelection(inv.id);
                                            }}
                                            disabled={Number(inv.balance) <= 0}
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors uppercase">
                                                {inv.student_name?.charAt(0) || 'S'}
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{inv.student_name}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                                    #INV-{inv.id} &bull; {formatDate(inv.date_generated || inv.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase">
                                            {inv.admission_number || 'No ID'}
                                        </div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase">
                                            {inv.class_name || 'N/A'} {inv.stream_name || ''}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="text-xs font-black text-slate-600 font-mono">
                                            {Number(inv.total_amount).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className={`text-xs font-black font-mono ${Number(inv.balance) <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {Number(inv.balance).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                            inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                            inv.status === 'OVERPAID' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 
                                            inv.status === 'PARTIAL' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                                            'bg-rose-50 text-rose-600 border border-rose-100'
                                        }`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center mt-4 no-print px-2">
                <div className="text-xs text-secondary font-medium">
                    Showing <span className="text-primary font-bold">{filteredInvoices.length}</span> of <span className="text-primary font-bold">{totalItems}</span> invoices
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <div className="flex items-center px-4 text-xs font-bold bg-slate-100 rounded-lg">Page {page}</div>
                    <Button variant="outline" size="sm" onClick={() => setPage((p: number) => p + 1)} disabled={filteredInvoices.length < pageSize}>Next</Button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceManager;

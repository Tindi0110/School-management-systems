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
                                <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={(e) => {
                                    if ((e.target as HTMLElement).tagName === 'INPUT') return;
                                    setSelectedInvoice(inv);
                                }}>
                                    <td>
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

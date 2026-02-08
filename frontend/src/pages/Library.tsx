import React, { useEffect, useState } from 'react';
import {
    Plus, Edit, Trash2, BookOpen,
    Book, Layers, ShieldAlert,
    Printer, Download, ArrowRight, Bookmark, Archive, Receipt
} from 'lucide-react';
import { libraryAPI, studentsAPI } from '../api/api';
import { exportToCSV } from '../utils/export';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';

const Library = () => {
    const [activeTab, setActiveTab] = useState('catalog');
    const [books, setBooks] = useState<any[]>([]);
    const [copies, setCopies] = useState<any[]>([]);
    const [lendings, setLendings] = useState<any[]>([]);
    const [fines, setFines] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const toast = useToast();
    const { confirm } = useConfirm();

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const isTeacher = user?.role === 'TEACHER';
    const isLibrarian = user?.role === 'LIBRARIAN' || ['ADMIN', 'PRINCIPAL'].includes(user?.role);
    const isReadOnly = isTeacher && !isLibrarian;

    // Modals
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [isLendModalOpen, setIsLendModalOpen] = useState(false);
    const [isFineModalOpen, setIsFineModalOpen] = useState(false);

    const [bookId, setBookId] = useState<number | null>(null);
    const [copyId, setCopyId] = useState<number | null>(null);
    const [lendingId, setLendingId] = useState<number | null>(null);
    const [fineId, setFineId] = useState<number | null>(null);

    // Inventory View State
    const [viewingInventoryBookId, setViewingInventoryBookId] = useState<number | null>(null);

    const getToday = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: '', year: new Date().getFullYear(), initial_copies: 0 });
    const [copyForm, setCopyForm] = useState({ book: '', copy_number: '', condition: 'NEW', status: 'AVAILABLE', purchase_date: getToday() });
    const [lendingForm, setLendingForm] = useState({ copy: '', student: '', due_date: '', });
    const [fineForm, setFineForm] = useState({ student: '', amount: 0, reason: '', status: 'PENDING', date_issued: getToday(), fine_type: 'LATE' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    // Split loading to avoid slow re-fetches
    const fetchAllData = async () => {
        try {
            await Promise.all([loadCatalog(), loadLendings(), loadFines(), loadStudents()]);
        } catch (error) { console.error('Error initializing library:', error); }
        finally { setLoading(false); }
    };

    const loadCatalog = async () => {
        const [b, c] = await Promise.all([libraryAPI.books.getAll(), libraryAPI.copies.getAll()]);
        setBooks(b.data); setCopies(c.data);
    };

    const loadLendings = async () => {
        const res = await libraryAPI.lendings.getAll();
        setLendings(res.data);
    };

    const loadFines = async () => {
        const res = await libraryAPI.fines.getAll();
        setFines(res.data);
    };

    const loadStudents = async () => {
        const res = await studentsAPI.getAll();
        setStudents(res.data);
    };

    // --- Handlers ---

    // Generic Delete Helper
    const handleDelete = async (e: React.MouseEvent, id: number, apiCall: (id: number) => Promise<any>, confirmMsg: string, refreshFn: () => Promise<void>) => {
        e.preventDefault();
        e.stopPropagation();

        if (await confirm(confirmMsg)) {
            try {
                await apiCall(id);
                toast.success('Deleted successfully');
                await refreshFn();
            } catch (error: any) {
                console.error('Delete failed:', error);
                toast.error(error.response?.data?.detail || 'Delete failed.');
            }
        }
    };

    // Books
    const handleBookSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let targetBookId = bookId;

            const payload = { ...bookForm, isbn: bookForm.isbn.trim() || null };
            if (bookId) {
                await libraryAPI.books.update(bookId, payload);
            } else {
                const response = await libraryAPI.books.create(payload);
                targetBookId = response.data.id;
            }

            const count = (bookForm as any).initial_copies || 0;
            if (count > 0 && targetBookId) {
                const copyPromises = [];
                for (let i = 1; i <= count; i++) {
                    copyPromises.push(libraryAPI.copies.create({
                        book: targetBookId,
                        copy_number: `CPY-${targetBookId}-${Date.now()}-${i}`,
                        condition: 'NEW',
                        status: 'AVAILABLE',
                        purchase_date: new Date().toISOString().split('T')[0]
                    }));
                }
                await Promise.all(copyPromises);
            }

            await loadCatalog(); // Only refresh catalog
            setIsBookModalOpen(false);
            setBookId(null);
            setBookForm({ title: '', author: '', isbn: '', category: '', year: new Date().getFullYear(), initial_copies: 0 } as any);
            toast.success('Book saved successfully.');
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.isbn ? `ISBN Error: ${err.response.data.isbn}` : (err.response?.data?.detail || 'Failed to save book.');
            toast.error(msg);
        }
        finally { setIsSubmitting(false); }
    };
    const handleEditBook = (b: any) => {
        setBookId(b.id);
        setBookForm({ ...b, year: b.year || new Date().getFullYear(), initial_copies: 0 });
        setIsBookModalOpen(true);
    };

    // Copies
    const handleCopySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...copyForm, book: Number(copyForm.book) };
            if (copyId) await libraryAPI.copies.update(copyId, payload);
            else await libraryAPI.copies.create(payload);

            await loadCatalog(); // Only refresh catalog
            setIsCopyModalOpen(false);
            setCopyId(null);
            setCopyForm({ book: '', copy_number: '', condition: 'NEW', status: 'AVAILABLE', purchase_date: new Date().toISOString().split('T')[0] });
            toast.success('Inventory updated.');
        } catch (err) { console.error(err); toast.error('Failed to save copy.'); }
        finally { setIsSubmitting(false); }
    };
    const handleEditCopy = (c: any) => { setCopyId(c.id); setCopyForm({ ...c, book: String(c.book) }); setIsCopyModalOpen(true); };

    // Lendings
    const handleLendSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lendingForm.copy || !lendingForm.student) { toast.error('Select copy and student.'); return; }

        const selectedStudent = students.find(s => s.id === Number(lendingForm.student));
        if (!selectedStudent) { toast.error('Invalid student selected.'); return; }

        const userId = selectedStudent.user || selectedStudent.student_user_id;

        if (!userId) {
            toast.error(`Student ${selectedStudent.full_name} needs a linked User Account to borrow books.`);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                copy: Number(lendingForm.copy),
                user: userId,
                due_date: lendingForm.due_date,
            };

            if (lendingId) await libraryAPI.lendings.update(lendingId, payload);
            else await libraryAPI.lendings.create(payload);

            // Optimistic Success: Alert & Close immediately
            const bookTitle = books.find(b => b.id === Number(copies.find(c => c.id === Number(lendingForm.copy))?.book))?.title;
            toast.success(`"${bookTitle}" issued to ${selectedStudent.full_name}. Due by ${lendingForm.due_date}`);

            setIsLendModalOpen(false);
            setLendingId(null);
            setLendingForm({ copy: '', student: '', due_date: '' });

            // Refresh in background
            Promise.all([loadLendings(), loadCatalog()]);

        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.detail || 'Failed to issue book.';
            toast.error(`Error: ${msg}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleEditLending = (l: any) => { setLendingId(l.id); setLendingForm({ ...l, copy: String(l.copy), student: String(l.student) }); setIsLendModalOpen(true); };

    // Fines
    const handleFineSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const selectedStudent = students.find(s => s.id === Number(fineForm.student));
            const payload = {
                user: selectedStudent?.user || Number(fineForm.student),
                amount: fineForm.amount,
                reason: fineForm.reason,
                status: fineForm.status,
                date_issued: fineForm.date_issued,
                fine_type: (fineForm as any).fine_type || 'LATE' // Default fallback
            };

            if (fineId) await libraryAPI.fines.update(fineId, payload);
            else await libraryAPI.fines.create(payload);

            // Optimistic Success
            toast.success('Fine recorded.');
            setIsFineModalOpen(false);
            setFineId(null);
            setFineForm({ student: '', amount: 0, reason: '', status: 'PENDING', date_issued: new Date().toISOString().split('T')[0], fine_type: 'LATE' });

            // Background refresh
            loadFines();
        } catch (err: any) {
            console.error(err);
            toast.error('Failed to save fine.');
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleEditFine = (f: any) => { setFineId(f.id); setFineForm({ ...f, student: String(f.student) }); setIsFineModalOpen(true); };

    // Memoized Stats & Options to prevent render lag
    // Memoized Stats & Options to prevent render lag
    const stats = React.useMemo(() => ({
        totalBooks: books.length,
        totalCopies: copies.length,
        activeLendings: lendings.filter(l => !l.date_returned).length,
        available: copies.filter(c => c.status === 'AVAILABLE').length,
        overdue: lendings.filter(l => !l.date_returned && new Date(l.due_date) < new Date()).length,
        totalFines: fines.filter(f => f.status === 'PENDING').reduce((acc, f) => acc + (Number(f.amount) || 0), 0)
    }), [books, copies, lendings, fines]);

    const studentOptions = React.useMemo(() =>
        students.map(s => ({ id: String(s.id), label: `${s.admission_number || 'No ADM'} - ${s.full_name}`, value: String(s.id) })),
        [students]);

    const copyOptions = React.useMemo(() =>
        copies.filter(c => c.status === 'AVAILABLE').map(c => ({ id: String(c.id), label: `${c.copy_number} - ${books.find(b => b.id === c.book)?.title}`, value: String(c.id) })),
        [copies, books]);

    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1>Institutional Library</h1>
                    <p className="text-secondary text-sm">Resource archiving, circulation, and digital tracking</p>
                </div>
                <div className="flex gap-md no-print">
                    <Button variant="outline" onClick={() => exportToCSV(books, 'Library_Catalog')} icon={<Download size={18} />}>Export CSV</Button>
                    <Button variant="outline" onClick={() => window.print()} icon={<Printer size={18} />}>Catalog Report</Button>
                    {!isReadOnly && (
                        <Button variant="primary" onClick={() => setIsLendModalOpen(true)} icon={<BookOpen size={18} />}>Process Lending</Button>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="card p-4 flex items-center gap-4 border-l-4 border-info">
                    <Bookmark className="text-info" size={24} />
                    <div><p className="text-xs text-secondary font-bold uppercase">Out on Loan</p><h3>{stats.activeLendings}</h3></div>
                </div>
                <div className="card p-4 flex items-center gap-4 border-l-4 border-warning">
                    <Receipt className="text-warning" size={24} />
                    <div><p className="text-xs text-secondary font-bold uppercase">Unpaid Fines</p><h3>KES {stats.totalFines.toLocaleString()}</h3></div>
                </div>
                <div className="card p-4 flex items-center gap-4 border-l-4 border-success">
                    <Layers className="text-success" size={24} />
                    <div><p className="text-xs text-secondary font-bold uppercase">Total Copies</p><h3>{stats.totalCopies}</h3></div>
                </div>
                <div className="card p-4 flex items-center gap-4 border-l-4 border-primary">
                    <Book className="text-primary" size={24} />
                    <div><p className="text-xs text-secondary font-bold uppercase">Unique Titles</p><h3>{stats.totalBooks}</h3></div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs mb-6 no-print overflow-x-auto">
                <button className={`tab-link ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}><Archive size={16} /> Asset Catalog</button>
                <button className={`tab-link ${activeTab === 'copies' ? 'active' : ''}`} onClick={() => setActiveTab('copies')}><Layers size={16} /> Inventory (Copies)</button>
                <button className={`tab-link ${activeTab === 'lendings' ? 'active' : ''}`} onClick={() => setActiveTab('lendings')}><Bookmark size={16} /> Circulation</button>
                <button className={`tab-link ${activeTab === 'fines' ? 'active' : ''}`} onClick={() => setActiveTab('fines')}><ShieldAlert size={16} /> Fines & Discipline</button>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => {
                    const dataToExport = activeTab === 'catalog' ? books : activeTab === 'copies' ? copies : activeTab === 'lendings' ? lendings : fines;
                    exportToCSV(dataToExport, `Library_${activeTab}`);
                }} icon={<Download size={14} />}>
                    Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </Button>

            </div>

            {/* Catalog Content */}
            {activeTab === 'catalog' && (
                <div className="table-container fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3>Asset Catalog</h3>
                        <div className="flex gap-2">
                            {!isReadOnly && (
                                <Button variant="primary" size="sm" onClick={() => { setBookId(null); setIsBookModalOpen(true); }} icon={<Plus size={14} />}>Add Title</Button>
                            )}
                        </div>
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Author</th>
                                <th>ISBN</th>
                                <th>Category</th>
                                <th>Availability</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {books.map(b => {
                                const bookCopies = copies.filter(c => c.book === b.id);
                                const available = bookCopies.filter(c => c.status === 'AVAILABLE').length;
                                return (
                                    <tr key={b.id}>
                                        <td className="font-bold">{b.title}</td>
                                        <td>{b.author}</td>
                                        <td className="font-mono text-xs">{b.isbn || 'N/A'}</td>
                                        <td>{b.category || 'General'}</td>
                                        <td>
                                            <span className={`badge ${available > 0 ? 'badge-success' : 'badge-warning'}`}>
                                                {available} / {bookCopies.length} Units
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                {!isReadOnly && (
                                                    <>
                                                        <Button variant="ghost" size="sm" className="text-primary" onClick={() => handleEditBook(b)} icon={<Edit size={14} />} />
                                                        <Button variant="ghost" size="sm" className="text-error" onClick={(e) => handleDelete(e, b.id, libraryAPI.books.delete, 'Delete this title?', loadCatalog)} icon={<Trash2 size={14} />} />
                                                    </>
                                                )}
                                                <Button variant="outline" size="sm" onClick={() => { setActiveTab('copies'); setViewingInventoryBookId(b.id); }}>View Units</Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Inventory Content */}
            {activeTab === 'copies' && (
                <div className="table-container fade-in">
                    {!viewingInventoryBookId ? (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h3>Inventory Summary</h3>
                                {!isReadOnly && (
                                    <Button variant="primary" size="sm" onClick={() => { setCopyId(null); setIsCopyModalOpen(true); }} icon={<Plus size={14} />}>Add Copy</Button>
                                )}
                            </div>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Book Title</th>
                                        <th>Total Copies</th>
                                        <th>Available</th>
                                        <th>Issued</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {books.map(b => {
                                        const bookCopies = copies.filter(c => c.book === b.id);
                                        const available = bookCopies.filter(c => c.status === 'AVAILABLE').length;
                                        const issued = bookCopies.filter(c => c.status === 'ISSUED').length;

                                        return (
                                            <tr key={b.id}>
                                                <td className="font-bold">{b.title}</td>
                                                <td><span className="badge badge-info">{bookCopies.length}</span></td>
                                                <td><span className="badge badge-success">{available}</span></td>
                                                <td><span className="badge badge-warning">{issued}</span></td>
                                                <td>
                                                    <Button variant="outline" size="sm" onClick={() => setViewingInventoryBookId(b.id)} icon={<ArrowRight size={14} />}>
                                                        View Units
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setViewingInventoryBookId(null)}>← Back</Button>
                                    <h3>{books.find(b => b.id === viewingInventoryBookId)?.title} - Copies</h3>
                                </div>
                                {!isReadOnly && (
                                    <Button variant="primary" size="sm" onClick={() => { setCopyId(null); setCopyForm({ ...copyForm, book: String(viewingInventoryBookId) }); setIsCopyModalOpen(true); }} icon={<Plus size={14} />}>
                                        Add Copy to this Title
                                    </Button>
                                )}
                            </div>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Accession ID</th>
                                        <th>Condition</th>
                                        <th>Status</th>
                                        <th>Purchase Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {copies.filter(c => c.book === viewingInventoryBookId).map(c => (
                                        <tr key={c.id}>
                                            <td><span className="font-mono bg-secondary-light px-2 py-1 rounded text-xs">#{c.copy_number}</span></td>
                                            <td><span className={`badge ${c.condition === 'NEW' ? 'badge-success' : 'badge-info'}`}>{c.condition}</span></td>
                                            <td><span className={`status-badge ${c.status === 'AVAILABLE' ? 'success' : 'secondary'}`}>{c.status}</span></td>
                                            <td>{c.purchase_date || 'N/A'}</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    {!isReadOnly && (
                                                        <>
                                                            <Button variant="ghost" size="sm" className="text-primary" onClick={() => handleEditCopy(c)} icon={<Edit size={14} />} />
                                                            <Button variant="ghost" size="sm" className="text-error" onClick={(e) => handleDelete(e, c.id, libraryAPI.copies.delete, 'Remove this copy completely?', loadCatalog)} icon={<Trash2 size={14} />} />
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {copies.filter(c => c.book === viewingInventoryBookId).length === 0 && (
                                        <tr><td colSpan={5} className="text-center italic text-secondary">No copies found for this title.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            )}

            {/* Lendings Content */}
            {activeTab === 'lendings' && (
                <div className="table-container fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3>Circulation Record</h3>
                        {!isReadOnly && (
                            <Button variant="primary" size="sm" onClick={() => { setLendingId(null); setIsLendModalOpen(true); }} icon={<Plus size={14} />}>Issue Book</Button>
                        )}
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Book Title</th>
                                <th>Copy ID</th>
                                <th>Student</th>
                                <th>Borrowed</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lendings.map(l => (
                                <tr key={l.id}>
                                    <td className="font-bold">{l.book_title}</td>
                                    <td><span className="font-mono text-xs bg-secondary-light px-2 py-1 rounded">{l.copy_number}</span></td>
                                    <td>{l.user_name || l.student_name}</td>
                                    <td>{l.date_issued}</td>
                                    <td><span className={new Date(l.due_date) < new Date() && !l.date_returned ? 'text-error font-bold' : ''}>{l.due_date}</span></td>
                                    <td><span className={`badge ${l.date_returned ? 'badge-success' : 'badge-info'}`}>{l.date_returned ? 'RETURNED' : 'ISSUED'}</span></td>
                                    <td>
                                        <div className="flex gap-2">
                                            {!isReadOnly && !l.date_returned && (
                                                <Button size="sm" onClick={() => libraryAPI.lendings.returnBook(l.id).then(() => { loadLendings(); loadCatalog(); })}>
                                                    Return
                                                </Button>
                                            )}
                                            {!isReadOnly && (
                                                <>
                                                    <Button variant="ghost" size="sm" className="text-primary" onClick={() => handleEditLending(l)} icon={<Edit size={14} />} />
                                                    <Button variant="ghost" size="sm" className="text-error" onClick={(e) => handleDelete(e, l.id, libraryAPI.lendings.delete, 'Delete this lending record?', loadLendings)} icon={<Trash2 size={14} />} />
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Fines Content */}
            {activeTab === 'fines' && (
                <div className="table-container fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3>Library Fines & Discipline</h3>
                        {!isReadOnly && (
                            <Button variant="primary" size="sm" onClick={() => { setFineId(null); setIsFineModalOpen(true); }} icon={<Plus size={14} />}>Record Fine</Button>
                        )}
                    </div>
                    <table className="table">
                        <thead><tr><th>Student</th><th>Amount (KES)</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            {fines.length === 0 && <tr><td colSpan={6} className="text-center italic">No fines recorded.</td></tr>}
                            {fines.map(f => (
                                <tr key={f.id}>
                                    <td>{f.user_name || 'Unknown Student'}</td>
                                    <td className="font-bold">{parseFloat(f.amount).toLocaleString()}</td>
                                    <td>{f.reason}</td>
                                    <td><span className={`badge ${f.status === 'PAID' ? 'badge-success' : 'badge-error'}`}>{f.status}</span></td>
                                    <td>{f.date_issued}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            {!isReadOnly && (
                                                <>
                                                    <Button variant="ghost" size="sm" className="text-primary" onClick={() => handleEditFine(f)} icon={<Edit size={14} />} />
                                                    <Button variant="ghost" size="sm" className="text-error" onClick={(e) => handleDelete(e, f.id, libraryAPI.fines.delete, 'Delete this fine?', loadFines)} icon={<Trash2 size={14} />} />
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals */}
            {/* Modals with Loading State Buttons */}

            <Modal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} title={bookId ? "Edit Book Title" : "Add New Title"}>
                <form onSubmit={handleBookSubmit} className="space-y-4">
                    <div className="form-group"><label className="label">Title</label><input type="text" className="input" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} required /></div>
                    <div className="form-group"><label className="label">Author</label><input type="text" className="input" value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">ISBN</label><input type="text" className="input" value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} /></div>
                        <div className="form-group"><label className="label">Category</label><input type="text" className="input" value={bookForm.category} onChange={e => setBookForm({ ...bookForm, category: e.target.value })} required /></div>
                    </div>
                    <div className="form-group"><label className="label">Year</label><input type="number" className="input" value={(bookForm as any).year} onChange={e => setBookForm({ ...bookForm, year: parseInt(e.target.value) } as any)} required /></div>

                    <div className="form-group border-t pt-2 mt-2">
                        <label className="label text-primary font-bold">{bookId ? "Add More Copies" : "Auto-Generate Copies"}</label>
                        <p className="text-[10px] text-secondary mb-1">
                            {bookId ? "Enter number to generate NEW additional copies." : "Enter number to automatically generate copies."}
                        </p>
                        <input
                            type="number"
                            className="input border-primary"
                            min="0"
                            placeholder="e.g. 5"
                            value={(bookForm as any).initial_copies || ''}
                            onChange={e => setBookForm({ ...bookForm, initial_copies: parseInt(e.target.value) } as any)}
                        />
                    </div>
                    <div className="modal-footer">
                        <Button type="submit" variant="primary" className="w-full" loading={isSubmitting} loadingText="Saving...">
                            {bookId ? "Update Title & Copies" : "Add Title & Copies"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isCopyModalOpen} onClose={() => setIsCopyModalOpen(false)} title={copyId ? "Edit Copy Details" : "Add Inventory Copy"}>
                <form onSubmit={handleCopySubmit} className="space-y-4">
                    <div className="form-group"><label className="label">Book Title</label>
                        <select className="select" value={copyForm.book} onChange={e => setCopyForm({ ...copyForm, book: e.target.value })} required>
                            <option value="">Select Book...</option>
                            {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Copy Number / Barcode</label><input type="text" className="input" value={copyForm.copy_number} onChange={e => setCopyForm({ ...copyForm, copy_number: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Condition</label>
                            <select className="select" value={copyForm.condition} onChange={e => setCopyForm({ ...copyForm, condition: e.target.value })}>
                                <option value="NEW">New</option>
                                <option value="GOOD">Good</option>
                                <option value="FAIR">Fair</option>
                                <option value="POOR">Poor</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Status</label>
                            <select className="select" value={copyForm.status} onChange={e => setCopyForm({ ...copyForm, status: e.target.value })}>
                                <option value="AVAILABLE">Available</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="LOST">Lost</option>
                            </select>
                        </div>
                        <div className="form-group"><label className="label">Purchase Date</label><input type="date" className="input" value={copyForm.purchase_date} onChange={e => setCopyForm({ ...copyForm, purchase_date: e.target.value })} required /></div>
                    </div>
                    <div className="modal-footer">
                        <Button type="submit" variant="primary" className="w-full" loading={isSubmitting} loadingText="Saving...">
                            {copyId ? "Update Copy" : "Add Copy"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isLendModalOpen} onClose={() => setIsLendModalOpen(false)} title={lendingId ? "Edit Lending Record" : "New Resource Circulation"}>
                <form onSubmit={handleLendSubmit} className="space-y-4">
                    <SearchableSelect label="Select Copy *" options={copyOptions} value={String(lendingForm.copy)} onChange={(val) => setLendingForm({ ...lendingForm, copy: val.toString() })} required />
                    <SearchableSelect label="Assign to Student *" options={studentOptions} value={String(lendingForm.student)} onChange={(val) => setLendingForm({ ...lendingForm, student: val.toString() })} required />
                    <div className="form-group"><label className="label">Return Deadline *</label><input type="date" className="input" value={lendingForm.due_date} onChange={e => setLendingForm({ ...lendingForm, due_date: e.target.value })} required /></div>
                    <div className="modal-footer">
                        <Button type="submit" variant="primary" className="w-full" loading={isSubmitting} loadingText="Processing Issue...">
                            {lendingId ? "Update Lending" : "Finalize Lending"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isFineModalOpen} onClose={() => setIsFineModalOpen(false)} title={fineId ? "Edit Fine Record" : "Record Library Fine"}>
                <form onSubmit={handleFineSubmit} className="space-y-4">
                    <SearchableSelect label="Student *" options={studentOptions} value={String(fineForm.student)} onChange={(val) => setFineForm({ ...fineForm, student: val.toString() })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Fine Type</label>
                            <select className="select" value={(fineForm as any).fine_type || 'LATE'} onChange={e => setFineForm({ ...fineForm, fine_type: e.target.value } as any)}>
                                <option value="LATE">Late Return</option>
                                <option value="LOST">Lost Book</option>
                                <option value="DAMAGE">Damage Penalty</option>
                            </select>
                        </div>
                        <div className="form-group"><label className="label">Amount (KES)</label><input type="number" className="input" value={fineForm.amount} onChange={e => setFineForm({ ...fineForm, amount: parseFloat(e.target.value) })} required /></div>
                    </div>
                    <div className="form-group"><label className="label">Reason</label><textarea className="input" rows={3} value={fineForm.reason} onChange={e => setFineForm({ ...fineForm, reason: e.target.value })} required></textarea></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Status</label>
                            <select className="select" value={fineForm.status} onChange={e => setFineForm({ ...fineForm, status: e.target.value })}>
                                <option value="PENDING">Pending</option>
                                <option value="PAID">Paid</option>
                                <option value="WAIVED">Waived</option>
                            </select>
                        </div>
                        <div className="form-group"><label className="label">Date Issued</label><input type="date" className="input" value={fineForm.date_issued} onChange={e => setFineForm({ ...fineForm, date_issued: e.target.value })} required /></div>
                    </div>
                    <div className="modal-footer">
                        <Button type="submit" variant="danger" className="w-full" loading={isSubmitting} loadingText="Recording...">
                            {fineId ? "Update Fine" : "Record Fine"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <style>{`
                .tab-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border-bottom: 2px solid transparent;
                    color: var(--text-secondary);
                    font-weight: 700;
                    transition: all 0.2s;
                    white-space: nowrap;
                    background: none;
                    border-top: none;
                    border-left: none;
                    border-right: none;
                    cursor: pointer;
                }
                .tab-link.active { 
                    border-bottom-color: var(--primary);
                    color: var(--primary);
                    background: rgba(30, 60, 114, 0.05);
                }
                .tab-link:hover:not(.active) { 
                    background: var(--bg-secondary);
                }
                .status-badge.success { 
                    background: var(--success-light);
                    color: var(--success);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .status-badge.secondary { 
                    background: var(--bg-secondary);
                    color: var(--text-secondary);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .badge { 
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .badge-success { background: var(--success); color: white; }
                .badge-info { background: var(--info); color: white; }
                .badge-error { background: var(--error); color: white; }
                .hover-scale { transition: transform 0.2s; }
                .hover-scale:hover { transform: translateY(-4px); }
            `}</style>
        </div>
    );
};

export default Library;

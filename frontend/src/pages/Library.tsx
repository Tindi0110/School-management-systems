import React, { useEffect, useState, useMemo } from 'react';
import {
    Book, Bookmark, Receipt, Layers, Search, Download, Printer
} from 'lucide-react';
import { libraryAPI, studentsAPI } from '../api/api';
import { exportToCSV } from '../utils/export';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { StatCard } from '../components/Card';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';
import PremiumDateInput from '../components/common/DatePicker';

// Import sub-components
import BookCatalog from './library/BookCatalog';
import InventoryManager from './library/InventoryManager';
import CirculationManager from './library/CirculationManager';
import FineManager from './library/FineManager';

const Library = () => {
    const [activeTab, setActiveTab] = useState('catalog');
    const [books, setBooks] = useState<any[]>([]);
    const [copies, setCopies] = useState<any[]>([]);
    const [lendings, setLendings] = useState<any[]>([]);
    const [fines, setFines] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const { confirm } = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state — per tab
    const PAGE_SIZE = 25;
    const [pagination, setPagination] = useState({
        books: { page: 1, total: 0 },
        lendings: { page: 1, total: 0 },
        fines: { page: 1, total: 0 }
    });

    const [stats, setStats] = useState({
        totalBooks: 0,
        totalCopies: 0,
        totalFines: 0,
        activeLendings: 0,
        available: 0,
        overdue: 0
    });

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

    // Extend Due Date state
    const [extendLendingId, setExtendLendingId] = useState<number | null>(null);
    const [extendDays, setExtendDays] = useState<string>('7');

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
    const [lendingForm, setLendingForm] = useState({ copy: '', student: '', due_date: '' });
    const [fineForm, setFineForm] = useState({ student: '', amount: 0, reason: '', status: 'PENDING', date_issued: getToday(), fine_type: 'LATE' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSyncFinesToFinance = async () => {
        setIsSyncing(true);
        try {
            const res = await libraryAPI.fines.syncToFinance();
            const { synced, skipped_no_student, skipped_no_invoice } = res.data;
            toast.success(
                `Sync complete: ${synced} new fine(s) billed to invoices. ` +
                (skipped_no_student ? ` ${skipped_no_student} skipped (no student link).` : '') +
                (skipped_no_invoice ? ` ${skipped_no_invoice} skipped (no invoice found).` : '') +
                ` (Already-billed fines are skipped automatically.)`
            );
            await loadFines();
        } catch (err: any) {
            toast.error(err?.message || 'Sync failed. Please try again.');
        } finally {
            setIsSyncing(false);
        }
    };

    // Reset page on search or tab change
    useEffect(() => {
        setPagination(prev => ({
            ...prev,
            books: { ...prev.books, page: 1 },
            lendings: { ...prev.lendings, page: 1 },
            fines: { ...prev.fines, page: 1 }
        }));
    }, [searchTerm, activeTab]);

    useEffect(() => {
        const initLibrary = async () => {
            try {
                const statsRes = await libraryAPI.books.getDashboardStats();
                setStats(statsRes.data);
                await Promise.all([loadCatalog(), loadLendings(), loadFines(), loadStudents()]);
            } catch (error) { console.error('Error initializing library:', error); }
            finally { setLoading(false); }
        };
        initLibrary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadCatalog = async () => {
        const params: any = { page_size: PAGE_SIZE, page: pagination.books.page };
        if (searchTerm) params.search = searchTerm;
        try {
            const [b, c] = await Promise.all([
                libraryAPI.books.getAll(params),
                libraryAPI.copies.getAll({ page_size: 2000 }),
            ]);
            setBooks(b.data?.results ?? b.data ?? []);
            setPagination(prev => ({ ...prev, books: { ...prev.books, total: b.data?.count ?? 0 } }));
            setCopies(c.data?.results ?? c.data ?? []);
        } catch (error) {
            toast.error("Failed to load catalog.");
        }
    };

    const loadLendings = async () => {
        const params: any = { page: pagination.lendings.page, page_size: PAGE_SIZE };
        if (searchTerm) params.search = searchTerm;
        try {
            const res = await libraryAPI.lendings.getAll(params);
            setLendings(res.data?.results ?? res.data ?? []);
            setPagination(prev => ({ ...prev, lendings: { ...prev.lendings, total: res.data?.count ?? 0 } }));
        } catch (error) {
            toast.error("Failed to load lendings.");
        }
    };

    const loadFines = async () => {
        const params: any = { page: pagination.fines.page, page_size: PAGE_SIZE };
        if (searchTerm) params.search = searchTerm;
        try {
            const res = await libraryAPI.fines.getAll(params);
            setFines(res.data?.results ?? res.data ?? []);
            setPagination(prev => ({ ...prev, fines: { ...prev.fines, total: res.data?.count ?? 0 } }));
        } catch (error) {
            toast.error("Failed to load fines.");
        }
    };

    const loadStudents = async () => {
        const res = await studentsAPI.getAll({ page_size: 500 });
        setStudents(res.data?.results ?? res.data ?? []);
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
            const copyId = Number(lendingForm.copy);
            const copyObj = copies.find(c => c.id === copyId);
            const bookObj = copyObj ? books.find(b => b.id === Number(copyObj.book)) : null;
            const bookTitle = bookObj?.title || 'Book';
            toast.success(`"${bookTitle}" issued to ${selectedStudent.full_name}. Due by ${lendingForm.due_date}`);

            setIsLendModalOpen(false);
            setLendingId(null);
            setLendingForm({ copy: '', student: '', due_date: '' });

            // Refresh in background
            loadLendings().catch(console.error);
            loadCatalog().catch(console.error);

        } catch (err: any) {
            const errorDetail = err.response?.data?.detail;
            const errorMsg = errorDetail || err.message || 'Failed to issue book.';
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                toast.warning('Request timed out, but book might be issued. Please check the list.');
            } else {
                toast.error(`Error: ${errorMsg}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleEditLending = (l: any) => { setLendingId(l.id); setLendingForm({ ...l, copy: String(l.copy), student: String(l.student) }); setIsLendModalOpen(true); };

    const handleExtendDueDate = async (id: number) => {
        setExtendLendingId(id);
        setExtendDays('7');
    };

    const confirmExtendDueDate = async () => {
        if (!extendLendingId) return;
        const days = parseInt(extendDays, 10);
        if (isNaN(days) || days <= 0) {
            toast.error('Please enter a valid number of days.');
            return;
        }
        try {
            await libraryAPI.lendings.extendDueDate(extendLendingId, { days });
            toast.success(`Due date extended by ${days} day(s).`);
            setExtendLendingId(null);
            loadLendings();
            loadCatalog();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || err.response?.data?.error || 'Failed to extend due date.');
        }
    };

    // Fines
    const handleFineSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const selectedStudent = students.find(s => s.id === Number(fineForm.student));
            if (!selectedStudent || (!selectedStudent.user && !selectedStudent.student_user_id)) {
                toast.error(`Student ${selectedStudent?.full_name || 'selected'} needs a linked User Account to have a fine recorded.`);
                setIsSubmitting(false);
                return;
            }
            const userId = selectedStudent.user || selectedStudent.student_user_id;

            const payload = {
                user: userId,
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
            toast.error('Failed to save fine.');
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleEditFine = (f: any) => { setFineId(f.id); setFineForm({ ...f, student: String(f.student) }); setIsFineModalOpen(true); };



    const studentOptions = React.useMemo(() =>
        students.map(s => ({ id: String(s.id), label: `${s.admission_number || 'No ADM'} - ${s.full_name}`, value: String(s.id) })),
        [students]);

    const copyOptions = React.useMemo(() =>
        copies.filter(c => c.status === 'AVAILABLE').map(c => ({ id: String(c.id), label: `${c.copy_number} - ${books.find(b => b.id === c.book)?.title}`, value: String(c.id) })),
        [copies, books]);


    const filteredCopies = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return copies.filter(c =>
            !searchTerm ||
            (c.copy_number || '').toLowerCase().includes(lowerSearch) ||
            (c.status || '').toLowerCase().includes(lowerSearch)
        );
    }, [copies, searchTerm]);


    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

    return (
        <div className="fade-in px-4">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="w-full lg:w-auto">
                    <h1 className="text-3xl font-black tracking-tight">Institutional Library</h1>
                    <p className="text-secondary text-sm font-medium">Resource archiving, circulation, and digital tracking</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-start lg:justify-end no-print">
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <StatCard
                    title="Out on Loan"
                    value={stats.activeLendings}
                    icon={<Bookmark />}
                    gradient="linear-gradient(135deg, #3b82f6, #2563eb)"
                />
                <StatCard
                    title="Unpaid Fines"
                    value={`KES ${stats.totalFines.toLocaleString()}`}
                    icon={<Receipt />}
                    gradient="linear-gradient(135deg, #ef4444, #dc2626)"
                />
                <StatCard
                    title="Total Copies"
                    value={stats.totalCopies}
                    icon={<Layers />}
                    gradient="linear-gradient(135deg, #10b981, #059669)"
                />
                <StatCard
                    title="Unique Titles"
                    value={stats.totalBooks}
                    icon={<Book />}
                    gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
                />
            </div>

            {/* Tabs Navigation */}
            <div className="nav-tab-container no-print">
                <button className={`nav-tab ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}>Catalog</button>
                <button className={`nav-tab ${activeTab === 'copies' ? 'active' : ''}`} onClick={() => setActiveTab('copies')}>Inventory</button>
                <button className={`nav-tab ${activeTab === 'lendings' ? 'active' : ''}`} onClick={() => setActiveTab('lendings')}>Circulation</button>
                <button className={`nav-tab ${activeTab === 'fines' ? 'active' : ''}`} onClick={() => setActiveTab('fines')}>Fines</button>
            </div>

            {/* Search & Actions Area */}
            <div className="card mb-6 no-print p-4">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="relative flex-grow w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-50" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            className="input pl-10 h-11 bg-slate-50 border-transparent focus:bg-white"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => exportToCSV(books, 'Library_Catalog')} icon={<Download size={14} />}>Export</Button>
                        <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer size={14} />}>Reports</Button>
                    </div>
                </div>
            </div>

            {/* Catalog Content */}
            {activeTab === 'catalog' && (
                <BookCatalog
                    books={books}
                    copies={copies}
                    searchTerm={searchTerm}
                    isReadOnly={isReadOnly}
                    onAdd={() => { setBookId(null); setIsBookModalOpen(true); }}
                    onEdit={handleEditBook}
                    onDelete={(e, id) => handleDelete(e, id, libraryAPI.books.delete, 'Delete this title?', loadCatalog)}
                    onViewUnits={(id) => { setActiveTab('copies'); setViewingInventoryBookId(id); }}
                    page={pagination.books.page}
                    total={pagination.books.total}
                    pageSize={PAGE_SIZE}
                    onPageChange={(p) => setPagination(prev => ({ ...prev, books: { ...prev.books, page: p } }))}
                />
            )}

            {/* Inventory Content */}
            {activeTab === 'copies' && (
                <InventoryManager
                    books={books}
                    copies={copies}
                    filteredCopies={filteredCopies}
                    isReadOnly={isReadOnly}
                    viewingInventoryBookId={viewingInventoryBookId}
                    onSetViewingBookId={setViewingInventoryBookId}
                    onAddCopy={(bookId) => {
                        setCopyId(null);
                        if (bookId) setCopyForm({ ...copyForm, book: bookId });
                        setIsCopyModalOpen(true);
                    }}
                    onEditCopy={handleEditCopy}
                    onDeleteCopy={(e, id) => handleDelete(e, id, libraryAPI.copies.delete, 'Remove this copy completely?', loadCatalog)}
                    page={pagination.books.page}
                    total={pagination.books.total}
                    pageSize={PAGE_SIZE}
                    onPageChange={(p) => setPagination(prev => ({ ...prev, books: { ...prev.books, page: p } }))}
                />
            )}

            {/* Lendings Content */}
            {activeTab === 'lendings' && (
                <CirculationManager
                    lendings={lendings}
                    isReadOnly={isReadOnly}
                    onIssue={() => { setLendingId(null); setIsLendModalOpen(true); }}
                    onReturn={(id) => libraryAPI.lendings.returnBook(id).then(() => { loadLendings(); loadCatalog(); })}
                    onExtend={handleExtendDueDate}
                    onEdit={handleEditLending}
                    onDelete={(e, id) => handleDelete(e, id, libraryAPI.lendings.delete, 'Delete this lending record?', loadLendings)}
                    page={pagination.lendings.page}
                    total={pagination.lendings.total}
                    pageSize={PAGE_SIZE}
                    onPageChange={(p) => setPagination(prev => ({ ...prev, lendings: { ...prev.lendings, page: p } }))}
                />
            )}

            {/* Fines Content */}
            {activeTab === 'fines' && (
                <FineManager
                    fines={fines}
                    isReadOnly={isReadOnly}
                    isSyncing={isSyncing}
                    onSync={handleSyncFinesToFinance}
                    onAdd={() => { setFineId(null); setIsFineModalOpen(true); }}
                    onEdit={handleEditFine}
                    onDelete={(e, id) => handleDelete(e, id, libraryAPI.fines.delete, 'Delete this fine?', loadFines)}
                    page={pagination.fines.page}
                    total={pagination.fines.total}
                    pageSize={PAGE_SIZE}
                    onPageChange={(p) => setPagination(prev => ({ ...prev, fines: { ...prev.fines, page: p } }))}
                />
            )}

            {/* Modals */}
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
                    <SearchableSelect
                        label="Book Title"
                        placeholder="Select Book..."
                        options={books.map(b => ({ id: b.id.toString(), label: b.title }))}
                        value={copyForm.book}
                        onChange={(val) => setCopyForm({ ...copyForm, book: val.toString() })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Copy Number / Barcode</label><input type="text" className="input" value={copyForm.copy_number} onChange={e => setCopyForm({ ...copyForm, copy_number: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Condition</label>
                            <SearchableSelect
                                options={[
                                    { id: 'NEW', label: 'New' },
                                    { id: 'GOOD', label: 'Good' },
                                    { id: 'FAIR', label: 'Fair' },
                                    { id: 'POOR', label: 'Poor' }
                                ]}
                                value={copyForm.condition}
                                onChange={(val) => setCopyForm({ ...copyForm, condition: val.toString() })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Status</label>
                            <SearchableSelect
                                options={[
                                    { id: 'AVAILABLE', label: 'Available' },
                                    { id: 'MAINTENANCE', label: 'Maintenance' },
                                    { id: 'LOST', label: 'Lost' }
                                ]}
                                value={copyForm.status}
                                onChange={(val) => setCopyForm({ ...copyForm, status: val.toString() })}
                            />
                        </div>
                        <div className="form-group pb-2">
                            <PremiumDateInput
                                label="Purchase Date"
                                value={copyForm.purchase_date}
                                onChange={(val) => setCopyForm({ ...copyForm, purchase_date: val })}
                                required
                            />
                        </div>
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
                    <div className="form-group pb-2">
                        <PremiumDateInput
                            label="Return Deadline"
                            value={lendingForm.due_date}
                            onChange={(val) => setLendingForm({ ...lendingForm, due_date: val })}
                            required
                        />
                    </div>
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
                            <SearchableSelect
                                options={[
                                    { id: 'LATE', label: 'Late Return' },
                                    { id: 'LOST', label: 'Lost Book' },
                                    { id: 'DAMAGE', label: 'Damage Penalty' }
                                ]}
                                value={(fineForm as any).fine_type || 'LATE'}
                                onChange={(val) => setFineForm({ ...fineForm, fine_type: val.toString() } as any)}
                            />
                        </div>
                        <div className="form-group"><label className="label">Amount (KES)</label><input type="number" className="input" value={fineForm.amount} onChange={e => setFineForm({ ...fineForm, amount: parseFloat(e.target.value) })} required /></div>
                    </div>
                    <div className="form-group"><label className="label">Reason</label><textarea className="input" rows={3} value={fineForm.reason} onChange={e => setFineForm({ ...fineForm, reason: e.target.value })} required></textarea></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Status</label>
                            <SearchableSelect
                                options={[
                                    { id: 'PENDING', label: 'Pending' },
                                    { id: 'PAID', label: 'Paid' },
                                    { id: 'WAIVED', label: 'Waived' }
                                ]}
                                value={fineForm.status}
                                onChange={(val) => setFineForm({ ...fineForm, status: val.toString() })}
                            />
                        </div>
                        <div className="form-group pb-2">
                            <PremiumDateInput
                                label="Date Issued"
                                value={fineForm.date_issued}
                                onChange={(val) => setFineForm({ ...fineForm, date_issued: val })}
                                required
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <Button type="submit" variant="danger" className="w-full" loading={isSubmitting} loadingText="Recording...">
                            {fineId ? "Update Fine" : "Record Fine"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Extend Due Date Modal */}
            <Modal isOpen={!!extendLendingId} onClose={() => setExtendLendingId(null)} title="Extend Due Date">
                <div className="space-y-4">
                    <p className="text-sm text-secondary">Enter the number of days to extend this borrowing's return deadline.</p>
                    <div className="form-group">
                        <label className="label">Days to Extend</label>
                        <input
                            type="number"
                            className="input"
                            min="1"
                            value={extendDays}
                            onChange={e => setExtendDays(e.target.value)}
                        />
                    </div>
                    <div className="modal-footer">
                        <Button variant="ghost" onClick={() => setExtendLendingId(null)}>Cancel</Button>
                        <Button variant="primary" onClick={confirmExtendDueDate}>Confirm Extension</Button>
                    </div>
                </div>
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
                .status-badge.error {
                    background: var(--error);
                    color: white;
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

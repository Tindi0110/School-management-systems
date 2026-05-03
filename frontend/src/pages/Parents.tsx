import React, { useEffect, useState } from 'react';
import {
    Plus, Edit, Phone, Mail, User as UserIcon,
    Download, Printer, Trash2
} from 'lucide-react';
import { studentsAPI, statsAPI } from '../api/api';
import { StatCard } from '../components/Card';
import Skeleton from '../components/common/Skeleton';
import { Users } from 'lucide-react';
import { exportToCSV } from '../utils/export';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';
import SearchableSelect from '../components/SearchableSelect';
import CountryCodeSelect from '../components/CountryCodeSelect';

import SearchInput from '../components/common/SearchInput';

const Parents = () => {
    const [parents, setParents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 50;
    const [editingParent, setEditingParent] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const toast = useToast();
    const { confirm } = useConfirm();
    const [formData, setFormData] = useState({
        full_name: '',
        relationship: 'FATHER',
        phone: '',
        country_code: '+254',
        email: '',
        occupation: '',
        address: '',
        national_id: ''
    });

    useEffect(() => {
        loadParents();
    }, [page]);

    const loadParents = async () => {
        setLoading(true);
        try {
            const parentsRes = await studentsAPI.parents.getAll({ page, page_size: pageSize });
            const data = parentsRes.data?.results ?? parentsRes.data ?? [];
            setParents(Array.isArray(data) ? data : []);
            setTotalItems(parentsRes.data?.count ?? (parentsRes.data?.results ? parentsRes.data.results.length : 0));
            
            // Load stats separately
            try {
                const dashboardRes = await statsAPI.getDashboard();
                setStats(dashboardRes.data?.counts || {});
            } catch (statsErr) {
                console.error("Guardian stats failed:", statsErr);
            }
        } catch (err) {
            console.error('Error loading parents:', err);
            toast.error("Failed to load guardianship registry.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Enforce country code formatting
            let phone = formData.phone.trim();
            if (phone && !phone.startsWith('+')) {
                phone = `${formData.country_code}${phone.startsWith('0') ? phone.slice(1) : phone}`;
            }

            if (!phone.startsWith('+')) {
                toast.error("Phone number must include a country code (e.g., +254)");
                setIsSubmitting(false);
                return;
            }

            const payload = { ...formData, phone };

            if (editingParent) {
                await studentsAPI.parents.update(editingParent.id, payload);
                toast.success('Guardian updated successfully');
            } else {
                await studentsAPI.parents.create(formData);
                toast.success('Guardian enrolled successfully');
            }
            loadParents();
            setIsModalOpen(false);
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.detail || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (await confirm('Are you sure you want to delete this guardian record? This may affect linked student records.')) {
            try {
                await studentsAPI.parents.delete(id);
                toast.success('Guardian record deleted');
                loadParents();
            } catch (err: any) {
                toast.error('Failed to delete guardian');
            }
        }
    };

    const filteredParents = React.useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return parents.filter(p =>
            (p.full_name || '').toLowerCase().includes(lowerSearch) ||
            (p.phone || '').includes(searchTerm)
        );
    }, [parents, searchTerm]);

    if (loading) return <div className="spinner-container flex items-center justify-center p-20"><div className="spinner"></div></div>;

    return (
        <div className="fade-in px-4 pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Guardianship Registry</h1>
                    <p className="text-secondary text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Institutional Parent & Guardian Database</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" className="text-[10px] font-black uppercase" onClick={() => window.print()} icon={<Printer size={16} />}>
                        Reports
                    </Button>
                    <Button variant="ghost" className="text-[10px] font-black uppercase" onClick={() => exportToCSV(parents, 'guardians_registry')} icon={<Download size={16} />}>
                        Export CSV
                    </Button>
                    <Button variant="primary" className="text-[10px] font-black uppercase shadow-lg shadow-primary/25" onClick={() => { setEditingParent(null); setIsModalOpen(true); }} icon={<Plus size={16} />}>
                        New Guardian
                    </Button>
                </div>
            </div>

            {/* Dashboard Stats */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-md mb-8 no-print">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card p-6 bg-white border border-gray-100 rounded-2xl">
                            <Skeleton variant="text" width="60%" className="mb-2" />
                            <Skeleton variant="rect" height="32px" width="40%" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-md mb-8 no-print">
                    <StatCard 
                        title="Registered Guardians" 
                        value={(stats?.total_parents || 0).toString()} 
                        icon={<Users size={18} />} 
                        gradient="linear-gradient(135deg, #4f46e5, #6366f1)" 
                    />
                    <StatCard 
                        title="Family Network" 
                        value={(stats?.total_students || 0).toString()} 
                        icon={<UserIcon size={18} />} 
                        gradient="linear-gradient(135deg, #059669, #10b981)" 
                    />
                    <StatCard 
                        title="Avg. Wards/Parent" 
                        value={stats?.total_parents > 0 ? (stats?.total_students / stats?.total_parents).toFixed(1) : '0.0'} 
                        icon={<Users size={18} />} 
                        gradient="linear-gradient(135deg, #ea580c, #f97316)" 
                    />
                </div>
            )}

            <div className="card mb-8 p-4 bg-white border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
                    <div className="search-container flex-grow max-w-2xl w-full">
                        <SearchInput 
                            placeholder="Search by name, contact, or ID..." 
                            value={searchTerm} 
                            onChange={setSearchTerm} 
                            className="w-full h-12"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black uppercase text-slate-800 mb-1">Guardian Registry</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Official contact directory for all enrolled families</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-primary/5 text-primary text-[10px] font-black uppercase px-4 py-2 rounded-xl border border-primary/10">
                            {parents.length} Active Records
                        </span>
                    </div>
                </div>

                <div className="table-container border-none shadow-none p-0">
                    <div className="table-wrapper">
                        <table className="table min-w-[1000px]">
                            <thead>
                                <tr>
                                    <th>Guardian Identity</th>
                                    <th>Relationship</th>
                                    <th>Contact Metrics</th>
                                    <th>Linked Students</th>
                                    <th>Location</th>
                                    <th className="no-print text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredParents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-16 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">
                                            No guardian records matching your search context.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredParents.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-black text-xs border border-primary/10 shadow-sm">
                                                        {p.full_name.split(' ').map((n: any) => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 text-sm">{p.full_name}</span>
                                                        <span className={`text-[10px] font-black uppercase tracking-wider ${p.is_primary ? 'text-amber-600' : 'text-slate-400'}`}>
                                                            {p.is_primary ? 'Primary Contact' : 'Secondary Contact'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                    {p.relationship}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-slate-700">
                                                        <Phone size={12} className="text-slate-400" />
                                                        <span className="text-xs font-medium font-mono">{p.phone}</span>
                                                    </div>
                                                    {p.email && (
                                                        <div className="flex items-center gap-2 text-slate-500">
                                                            <Mail size={12} className="text-slate-400" />
                                                            <span className="text-[10px] truncate max-w-[150px]">{p.email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {p.students && p.students.length > 0 ? (
                                                        p.students.map((student: any) => (
                                                            <div key={student.id} className="group relative flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm hover:border-primary/30 transition-all cursor-help">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary"></div>
                                                                <span className="text-[10px] font-bold text-slate-600">{student.full_name}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] font-black text-slate-300 uppercase italic">Unlinked</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-600 font-medium truncate max-w-[150px]">{p.address || 'Not specified'}</span>
                                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{p.occupation || 'Private'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right no-print">
                                                <div className="flex gap-2 justify-end">
                                                    <button 
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100 hover:bg-white hover:text-primary transition-all shadow-sm"
                                                        onClick={() => {
                                                            setEditingParent(p);
                                                            setFormData({
                                                                ...p,
                                                                country_code: (p.phone || '').startsWith('+') ? p.phone.slice(0, 4) : '+254'
                                                            });
                                                            setIsModalOpen(true);
                                                        }}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                        onClick={() => handleDelete(p.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Pagination Controls */}
                {totalItems > pageSize && (
                    <div className="flex justify-between items-center bg-slate-50 p-4 border-t no-print">
                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest">
                            Showing {Math.min((page - 1) * pageSize + 1, totalItems)} - {Math.min(page * pageSize, totalItems)} of {totalItems} Guardians
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="font-black text-[10px] uppercase">Previous</Button>
                            <Button variant="primary" size="sm" disabled={page * pageSize >= totalItems} onClick={() => setPage(page + 1)} className="font-black text-[10px] uppercase">Next Page</Button>
                        </div>
                    </div>
                )}
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingParent ? "Update Guardian Record" : "Guardian Enrollment"}
                footer={
                    <>
                        <button type="button" className="modern-btn modern-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" form="guardian-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? (editingParent ? 'UPDATING...' : 'ENROLLING...') : (editingParent ? 'SAVE RECORD' : 'ENROLL GUARDIAN')}
                        </button>
                    </>
                }
            >
                <form id="guardian-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="form-group">
                        <label>Legal Full Name</label>
                        <input type="text" placeholder="e.g. John Doe" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Family Relationship</label>
                            <SearchableSelect
                                options={[
                                    { id: 'FATHER', label: 'Father' },
                                    { id: 'MOTHER', label: 'Mother' },
                                    { id: 'GUARDIAN', label: 'Legal Guardian' }
                                ]}
                                value={formData.relationship}
                                onChange={(val) => setFormData({ ...formData, relationship: val.toString() })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Occupation / Profession</label>
                            <input type="text" placeholder="e.g. Civil Engineer" value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Primary Contact (Mobile)</label>
                            <div className="flex gap-2">
                                <CountryCodeSelect
                                    value={formData.country_code}
                                    onChange={(val) => setFormData({ ...formData, country_code: val })}
                                />
                                <input
                                    type="tel"
                                    className="flex-grow"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                    placeholder="712345678"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" placeholder="guardian@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Residential / Postal Address</label>
                        <textarea className="h-24" placeholder="Enter physical home address or PO Box..." value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Parents;

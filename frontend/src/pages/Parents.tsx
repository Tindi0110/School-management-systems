import React, { useEffect, useState } from 'react';
import {
    Plus, Search, Edit, Phone, Mail, User as UserIcon,
    MapPin, Briefcase, Download, Printer, Trash2
} from 'lucide-react';
import { studentsAPI } from '../api/api';
import { exportToCSV } from '../utils/export';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';

const Parents = () => {
    const [parents, setParents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingParent, setEditingParent] = useState<any>(null);
    const toast = useToast();
    const { confirm } = useConfirm();
    const [formData, setFormData] = useState({
        full_name: '',
        relationship: 'FATHER',
        phone: '',
        email: '',
        occupation: '',
        address: '',
        national_id: ''
    });

    useEffect(() => {
        loadParents();
    }, []);

    const loadParents = async () => {
        try {
            const res = await studentsAPI.parents.getAll();
            const data = res.data?.results ?? res.data ?? [];
            setParents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingParent) {
                await studentsAPI.parents.update(editingParent.id, formData);
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
        <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1>Guardianship Registry</h1>
                    <p className="text-secondary font-bold uppercase text-[10px] tracking-widest">Institutional Parent & Guardian Database</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer size={16} />}>
                        Reports
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(parents, 'guardians_registry')} icon={<Download size={16} />}>
                        Export CSV
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => { setEditingParent(null); setIsModalOpen(true); }} icon={<Plus size={16} />}>
                        New Guardian
                    </Button>
                </div>
            </div>

            <div className="card mb-6 p-4">
                <div className="search-container">
                    <Search className="search-icon" size={16} />
                    <input type="text" className="input search-input text-sm" placeholder="Search by name or contact..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border table-wrapper">
                <table className="table min-w-[1000px]">
                    <thead>
                        <tr className="bg-secondary-light text-left">
                            <th className="p-4 text-xs font-black uppercase text-secondary tracking-wider">Guardian Identity</th>
                            <th className="p-4 text-xs font-black uppercase text-secondary tracking-wider">Contact Info</th>
                            <th className="p-4 text-xs font-black uppercase text-secondary tracking-wider">Occupation & Address</th>
                            <th className="p-4 text-xs font-black uppercase text-secondary tracking-wider">Children / Wards</th>
                            <th className="p-4 text-xs font-black uppercase text-secondary tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredParents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-secondary text-xs font-bold uppercase italic">
                                    No records found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filteredParents.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                                {p.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{p.full_name}</p>
                                                <span className="badge badge-sm badge-info uppercase text-[10px] font-black">{p.relationship}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                                <Phone size={12} className="text-secondary" /> {p.phone}
                                            </div>
                                            {p.email && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Mail size={12} className="text-secondary" /> {p.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                                <Briefcase size={12} className="text-secondary" />
                                                {p.occupation || 'Not Specified'}
                                            </p>
                                            <p className="text-[10px] text-gray-500 flex items-center gap-2">
                                                <MapPin size={10} className="text-secondary" />
                                                {p.address || 'Address not listed'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            {p.students && p.students.length > 0 ? (
                                                p.students.map((s: any) => (
                                                    <span key={s.id} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold border border-blue-100 w-fit">
                                                        <UserIcon size={10} />
                                                        {s.full_name} ({s.class_name || 'N/A'})
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[10px] text-gray-400 italic">No wards linked</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => { setEditingParent(p); setFormData(p); setIsModalOpen(true); }}
                                                icon={<Edit size={16} />}
                                                title="Edit Details"
                                            />
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDelete(p.id)}
                                                icon={<Trash2 size={16} />}
                                                title="Delete Guardian"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Guardian Enrollment" size="md">
                <form onSubmit={handleSubmit} className="space-y-4 form-container-md">
                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase">Full Name *</label>
                        <input type="text" className="input" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group">
                            <label className="label text-[10px] font-black uppercase">Relationship</label>
                            <select className="select" value={formData.relationship} onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}>
                                <option value="FATHER">Father</option>
                                <option value="MOTHER">Mother</option>
                                <option value="GUARDIAN">Guardian</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label text-[10px] font-black uppercase">Occupation</label>
                            <input type="text" className="input" value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group">
                            <label className="label text-[10px] font-black uppercase">Mobile No *</label>
                            <input type="tel" className="input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="label text-[10px] font-black uppercase">Email</label>
                            <input type="email" className="input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase">Residential Address</label>
                        <textarea className="input" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2}></textarea>
                    </div>
                    <div className="modal-footer pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>CANCEL</Button>
                        <Button type="submit" variant="primary" className="px-8 font-black" loading={isSubmitting} loadingText={editingParent ? 'UPDATING...' : 'ENROLLING...'}>
                            {editingParent ? 'UPDATE GUARDIAN' : 'ENROLL GUARDIAN'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Parents;

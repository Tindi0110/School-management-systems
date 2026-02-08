import React, { useEffect, useState } from 'react';
import {
    Plus, Search, Edit, Phone, Mail, User as UserIcon,
    ArrowRight, MapPin, Briefcase, Users, Link as LinkIcon, Download
} from 'lucide-react';
import { studentsAPI } from '../api/api';
import { exportToCSV } from '../utils/export';
import Modal from '../components/Modal';

const Parents = () => {
    const [parents, setParents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingParent, setEditingParent] = useState<any>(null);
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
            setParents(Array.isArray(res.data) ? res.data : []); // Ensure array
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingParent) {
                // Update logic would go here
                alert('Update not implemented yet');
            } else {
                await studentsAPI.parents.create(formData);
            }
            loadParents();
            setIsModalOpen(false);
        } catch (err) {
            alert('Operation failed');
        }
    };

    const filteredParents = parents.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm)
    );

    if (loading) return <div className="spinner-container flex items-center justify-center p-20"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1>Guardianship Registry</h1>
                    <p className="text-secondary font-bold uppercase text-[10px] tracking-widest">Institutional Parent & Guardian Database</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-sm btn-outline" onClick={() => exportToCSV(parents, 'guardians_registry')}>
                        <Download size={16} /> Export CSV
                    </button>
                    <button className="btn btn-sm btn-primary font-black px-6" onClick={() => { setEditingParent(null); setIsModalOpen(true); }}>
                        <Plus size={16} /> NEW GUARDIAN
                    </button>
                </div>
            </div>

            <div className="card mb-6 p-4">
                <div className="search-container">
                    <Search className="search-icon" size={16} />
                    <input type="text" className="input search-input text-sm" placeholder="Search by name or contact..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="table w-full">
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
                                    <td className="p-4">
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
                                        <button
                                            className="btn btn-sm btn-ghost hover:bg-primary/10 text-primary"
                                            onClick={() => { setEditingParent(p); setFormData(p); setIsModalOpen(true); }}
                                            title="Edit Details"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Guardian Enrollment" size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setIsModalOpen(false)}>CANCEL</button>
                        <button type="submit" className="btn btn-sm btn-primary px-8 font-black">ENROLL GUARDIAN</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Parents;

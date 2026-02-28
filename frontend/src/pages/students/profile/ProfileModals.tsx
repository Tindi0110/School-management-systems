import React from 'react';
import { ShieldAlert, AlertTriangle, FileText, Printer } from 'lucide-react';
import Modal from '../../../components/Modal';
import Button from '../../../components/common/Button';
import SearchableSelect from '../../../components/SearchableSelect';
import PremiumDateInput from '../../../components/common/DatePicker';

interface ProfileModalsProps {
    modals: {
        discipline: boolean;
        health: boolean;
        edit: boolean;
        clearance: boolean;
        transfer: boolean;
        suspend: boolean;
        delete: boolean;
        guardian: boolean;
        activity: boolean;
        document: boolean;
    };
    onClose: (key: string) => void;
    forms: {
        discipline: any;
        health: any;
        edit: any;
        transfer: any;
        guardian: any;
        activity: any;
        document: any;
    };
    setForms: (key: string, val: any) => void;
    handlers: {
        discipline: (e: React.FormEvent) => void;
        health: (e: React.FormEvent) => void;
        edit: (e: React.FormEvent) => void;
        transfer: (e: React.FormEvent) => void;
        guardian: (e: React.FormEvent) => void;
        activity: (e: React.FormEvent) => void;
        document: (e: React.FormEvent) => void;
        suspend: () => void;
        delete: () => void;
        linkParent: (e: React.FormEvent) => void;
        printClearance: () => void;
    };
    status: {
        isSubmitting: boolean;
        isSearchingParent: boolean;
        healthId: number | null;
        isCreatingNewGuardian: boolean;
        setIsCreatingNewGuardian: (val: boolean) => void;
        searchPhone: string;
        setSearchPhone: (val: string) => void;
    };
    data: {
        classes: any[];
        student: any;
        resultsCount: number;
        unreturnedBooks: number;
    };
}

const ProfileModals: React.FC<ProfileModalsProps> = ({
    modals, onClose, forms, setForms, handlers, status, data
}) => {
    return (
        <>
            {/* Discipline Modal */}
            <Modal isOpen={modals.discipline} onClose={() => onClose('discipline')} title="New Discipline Intervention" size="md">
                <form onSubmit={handlers.discipline} className="space-y-4 form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group">
                            <PremiumDateInput
                                label="Incident Date"
                                value={forms.discipline.incident_date}
                                onChange={val => setForms('discipline', { ...forms.discipline, incident_date: val })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="label text-[10px] font-black uppercase">Offence Category</label>
                            <input type="text" className="input" placeholder="e.g. Lateness, Theft" value={forms.discipline.offence_category} onChange={e => setForms('discipline', { ...forms.discipline, offence_category: e.target.value })} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase">Detailed Description</label>
                        <textarea className="input" rows={3} value={forms.discipline.description} onChange={e => setForms('discipline', { ...forms.discipline, description: e.target.value })} required></textarea>
                    </div>
                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase">Action Taken</label>
                        <input type="text" className="input" placeholder="e.g. Suspension, Warning" value={forms.discipline.action_taken} onChange={e => setForms('discipline', { ...forms.discipline, action_taken: e.target.value })} required />
                    </div>
                    <div className="modal-footer pt-4">
                        <Button type="submit" variant="danger" className="w-full font-black uppercase shadow-lg" loading={status.isSubmitting} loadingText="Saving...">
                            Submit Institutional Record
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Transfer Modal */}
            <Modal isOpen={modals.transfer} onClose={() => onClose('transfer')} title="Transfer Student Unit" size="sm">
                <form onSubmit={handlers.transfer} className="space-y-4 form-container-sm mx-auto">
                    <p className="text-secondary text-xs">Select the new class/unit for this student.</p>
                    <SearchableSelect
                        placeholder="Select New Class"
                        options={data.classes.map(c => ({ id: c.id.toString(), label: `${c.name} ${c.stream}` }))}
                        value={forms.transfer.classId}
                        onChange={(val: string | number) => setForms('transfer', { classId: val.toString() })}
                        required
                    />
                    <div className="modal-footer pt-4">
                        <Button type="button" variant="outline" onClick={() => onClose('transfer')}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={status.isSubmitting} loadingText="Processing...">
                            Process Transfer
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Health Modal */}
            <Modal isOpen={modals.health} onClose={() => onClose('health')} title="Update Medical Integrity" size="md">
                <form onSubmit={handlers.health} className="space-y-4 form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Blood Group</label><input type="text" className="input" value={forms.health.blood_group} onChange={e => setForms('health', { ...forms.health, blood_group: e.target.value })} /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Known Allergies</label><input type="text" className="input" value={forms.health.allergies} onChange={e => setForms('health', { ...forms.health, allergies: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Chronic Conditions</label><textarea className="input" rows={2} value={forms.health.chronic_conditions} onChange={e => setForms('health', { ...forms.health, chronic_conditions: e.target.value })}></textarea></div>
                    <div className="grid grid-cols-2 gap-md border-top pt-4">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Emergency Contact</label><input type="text" className="input" value={forms.health.emergency_contact_name} onChange={e => setForms('health', { ...forms.health, emergency_contact_name: e.target.value })} required /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Emergency Phone</label><input type="tel" className="input" value={forms.health.emergency_contact_phone} onChange={e => setForms('health', { ...forms.health, emergency_contact_phone: e.target.value })} required /></div>
                    </div>
                    <div className="modal-footer pt-4 flex justify-between gap-4">
                        <Button type="submit" variant="secondary" className="font-black uppercase shadow-lg flex-grow" loading={status.isSubmitting} loadingText="Syncing...">
                            Sync Medical Database
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Activity Modal */}
            <Modal isOpen={modals.activity} onClose={() => onClose('activity')} title="Register Extra-Curricular Activity" size="md">
                <form onSubmit={handlers.activity} className="space-y-4 form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Activity Name</label><input type="text" className="input" placeholder="e.g. Debate Club" value={forms.activity.name} onChange={e => setForms('activity', { ...forms.activity, name: e.target.value })} required /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Type</label>
                            <SearchableSelect
                                options={[{ id: 'Club', label: 'Club' }, { id: 'Sport', label: 'Sport' }, { id: 'Arts', label: 'Arts' }]}
                                value={forms.activity.activity_type}
                                onChange={(val: string | number) => setForms('activity', { ...forms.activity, activity_type: val.toString() })}
                            />
                        </div>
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Role / Position</label><input type="text" className="input" placeholder="e.g. Member, Captain" value={forms.activity.role} onChange={e => setForms('activity', { ...forms.activity, role: e.target.value })} /></div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Year</label><input type="number" className="input" value={forms.activity.year} onChange={e => setForms('activity', { ...forms.activity, year: parseInt(e.target.value) })} /></div>
                    <div className="modal-footer pt-4">
                        <Button type="submit" variant="primary" className="w-full font-black uppercase" loading={status.isSubmitting} loadingText="Registering...">
                            Register Participation
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Document Modal */}
            <Modal isOpen={modals.document} onClose={() => onClose('document')} title="Upload Institutional Document" size="sm">
                <form onSubmit={handlers.document} className="space-y-4 form-container-sm mx-auto">
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Document Type</label>
                        <SearchableSelect
                            options={[{ id: 'BIRTH_CERT', label: 'Birth Certificate' }, { id: 'REPORT_CARD', label: 'Report Card' }, { id: 'TRANSFER_LETTER', label: 'Transfer Letter' }, { id: 'OTHER', label: 'Other' }]}
                            value={forms.document.doc_type}
                            onChange={(val: string | number) => setForms('document', { ...forms.document, doc_type: val.toString() })}
                        />
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Select File</label><input type="file" className="file-input w-full" onChange={e => setForms('document', { ...forms.document, file: e.target.files?.[0] || null })} required /></div>
                    <div className="modal-footer pt-4">
                        <Button type="submit" variant="primary" className="w-full font-black uppercase" loading={status.isSubmitting} loadingText="Uploading...">
                            Upload to Archive
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Profile Modal */}
            <Modal isOpen={modals.edit} onClose={() => onClose('edit')} title="Edit Student Profile" size="md">
                <form onSubmit={handlers.edit} className="space-y-4 form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Full Name</label><input type="text" className="input" value={data.student?.full_name || ''} onChange={e => setForms('edit', { full_name: e.target.value })} required /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Admission Number</label><input type="text" className="input" value={data.student?.admission_number || ''} onChange={e => setForms('edit', { admission_number: e.target.value })} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Class</label>
                            <SearchableSelect
                                placeholder="Select Class"
                                options={data.classes.map(c => ({ id: c.id.toString(), label: `${c.name} ${c.stream}` }))}
                                value={data.student?.current_class?.toString() || ''}
                                onChange={(val: string | number) => setForms('edit', { current_class: parseInt(val.toString()) })}
                            />
                        </div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Category</label>
                            <SearchableSelect
                                options={[{ id: 'DAY', label: 'Day Scholar' }, { id: 'BOARDING', label: 'Boarding' }]}
                                value={data.student?.category || ''}
                                onChange={(val: string | number) => setForms('edit', { category: val.toString() })}
                            />
                        </div>
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Status</label>
                        <SearchableSelect
                            options={[{ id: 'ACTIVE', label: 'Active' }, { id: 'SUSPENDED', label: 'Suspended' }, { id: 'WITHDRAWN', label: 'Withdrawn' }, { id: 'ALUMNI', label: 'Alumni' }, { id: 'TRANSFERRED', label: 'Transferred' }]}
                            value={data.student?.status || ''}
                            onChange={(val: string | number) => setForms('edit', { status: val.toString() })}
                        />
                    </div>
                    <div className="modal-footer pt-4">
                        <Button type="submit" variant="primary" className="w-full font-black uppercase" loading={status.isSubmitting} loadingText="Updating...">
                            Update Profile
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Clearance Modal */}
            <Modal isOpen={modals.clearance} onClose={() => onClose('clearance')} title="Print Student Clearance" size="md">
                <div className="space-y-6 text-center">
                    <p className="text-secondary text-sm px-6">Download or print the official institutional clearance document for <strong>{data.student?.full_name}</strong>. This document verifies the student's status across all departments.</p>
                    <div className="mx-auto max-w-xs p-6 bg-secondary-light/30 rounded-2xl border border-dashed border-primary/20 flex flex-col items-center gap-4 shadow-inner">
                        <FileText size={48} className="text-primary opacity-50" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Official Transcript & Clearance</span>
                    </div>
                    <div className="modal-footer pt-4 flex gap-4">
                        <Button variant="outline" className="flex-grow font-black uppercase" onClick={() => onClose('clearance')}>Close</Button>
                        <Button variant="primary" className="flex-grow font-black uppercase shadow-lg" onClick={handlers.printClearance} icon={<Printer size={18} />}>
                            GENERATE PDF / PRINT
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Suspend Modal */}
            <Modal isOpen={modals.suspend} onClose={() => onClose('suspend')} title="Restrict Student Access" size="sm">
                <div className="space-y-4 text-center">
                    <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-2">
                        <ShieldAlert size={32} />
                    </div>
                    <h3 className="text-lg font-black uppercase text-slate-800">Confirm Suspension</h3>
                    <p className="text-slate-600 text-sm px-4">
                        Are you sure you want to <strong>SUSPEND</strong> {data.student?.full_name}? This will restrict their access to institutional services.
                    </p>
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1 font-black uppercase" onClick={() => onClose('suspend')}>Cancel</Button>
                        <Button variant="primary" className="flex-1 font-black uppercase bg-amber-600 border-amber-600 hover:bg-amber-700" onClick={handlers.suspend} loading={status.isSubmitting}>
                            Restrict Access
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={modals.delete} onClose={() => onClose('delete')} title="Permanent Deletion" size="sm">
                <div className="space-y-4 text-center">
                    <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-2">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-lg font-black uppercase text-red-700">Irreversible Action</h3>
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mx-1">
                        <p className="text-red-600 text-xs font-bold leading-relaxed">
                            DANGER: This will permanently delete <strong>{data.student?.full_name}</strong> and ALL associated records.
                        </p>
                    </div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">This action cannot be undone.</p>
                    <div className="flex flex-col gap-2 pt-2">
                        <Button variant="danger" className="w-full font-black uppercase py-3 shadow-lg" onClick={handlers.delete} loading={status.isSubmitting}>
                            Confirm Permanent Delete
                        </Button>
                        <Button variant="ghost" className="w-full font-black uppercase text-slate-400" onClick={() => onClose('delete')}>
                            Abort & Go Back
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Guardian Modal */}
            <Modal isOpen={modals.guardian} onClose={() => onClose('guardian')} title="Guardian Network Management" size="sm">
                <div className="space-y-6">
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                        <button className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${!status.isCreatingNewGuardian ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`} onClick={() => status.setIsCreatingNewGuardian(false)}>Link Existing</button>
                        <button className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${status.isCreatingNewGuardian ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`} onClick={() => status.setIsCreatingNewGuardian(true)}>Create New</button>
                    </div>
                    {!status.isCreatingNewGuardian ? (
                        <form onSubmit={handlers.linkParent} className="space-y-4">
                            <p className="text-[11px] font-bold text-secondary uppercase tracking-widest px-1">Search via Phone Number</p>
                            <div className="flex gap-2">
                                <input type="tel" className="input h-12 bg-white flex-grow" placeholder="e.g. 0712345678" value={status.searchPhone} onChange={e => status.setSearchPhone(e.target.value)} required />
                                <Button type="submit" variant="primary" loading={status.isSearchingParent} className="h-12 px-6">LINK</Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handlers.guardian} className="space-y-3">
                            <div className="form-group"><label className="label text-[10px] font-black uppercase text-slate-500">Full Name *</label><input type="text" className="input h-10 bg-white" value={forms.guardian.full_name} onChange={e => setForms('guardian', { ...forms.guardian, full_name: e.target.value })} required /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="form-group"><label className="label text-[10px] font-black uppercase text-slate-500">Phone *</label><input type="tel" className="input h-10 bg-white" value={forms.guardian.phone} onChange={e => setForms('guardian', { ...forms.guardian, phone: e.target.value })} required /></div>
                                <div className="form-group"><label className="label text-[10px] font-black uppercase text-slate-500">Relation</label><SearchableSelect options={[{ id: 'PARENT', label: 'Parent' }, { id: 'GRANDPARENT', label: 'Grandparent' }, { id: 'SIBLING', label: 'Sibling' }, { id: 'OTHER', label: 'Other' }]} value={forms.guardian.relation} onChange={(val: string | number) => setForms('guardian', { ...forms.guardian, relation: val.toString() })} /></div>
                            </div>
                            <div className="modal-footer pt-4"><Button type="submit" variant="primary" className="w-full font-black uppercase" loading={status.isSubmitting} loadingText="Creating...">Create & Link</Button></div>
                        </form>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default ProfileModals;

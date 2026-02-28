import React from 'react';
import { ShieldAlert, AlertTriangle, FileText, Printer } from 'lucide-react';
import Modal from '../../../components/Modal';
import Button from '../../../components/common/Button';
import SearchableSelect from '../../../components/SearchableSelect';
import PremiumDateInput from '../../../components/common/DatePicker';

interface ProfileModalsProps {
    student: any;
    setStudent: (s: any) => void;
    isDisciplineModalOpen: boolean;
    setIsDisciplineModalOpen: (v: boolean) => void;
    disciplineForm: any;
    setDisciplineForm: (f: any) => void;
    isSubmitting: boolean;
    handleDisciplineSubmit: (e: React.FormEvent) => void;
    isTransferModalOpen: boolean;
    setIsTransferModalOpen: (v: boolean) => void;
    transferClassId: string;
    setTransferClassId: (v: string) => void;
    classes: any[];
    handleTransfer: (e: React.FormEvent) => void;
    isHealthModalOpen: boolean;
    setIsHealthModalOpen: (v: boolean) => void;
    healthForm: any;
    setHealthForm: (f: any) => void;
    healthId: number | null;
    handleHealthSubmit: (e: React.FormEvent) => void;
    handleDeleteHealth: () => void;
    isActivityModalOpen: boolean;
    setIsActivityModalOpen: (v: boolean) => void;
    activityForm: any;
    setActivityForm: (f: any) => void;
    handleActivitySubmit: (e: React.FormEvent) => void;
    isDocumentModalOpen: boolean;
    setIsDocumentModalOpen: (v: boolean) => void;
    documentForm: any;
    setDocumentForm: (f: any) => void;
    handleDocumentSubmit: (e: React.FormEvent) => void;
    isEditModalOpen: boolean;
    setIsEditModalOpen: (v: boolean) => void;
    handleEditSubmit: (e: React.FormEvent) => void;
    isClearanceModalOpen: boolean;
    setIsClearanceModalOpen: (v: boolean) => void;
    handlePrintClearance: () => void;
    unreturnedBooks: number;
    results: any[];
    isSuspendModalOpen: boolean;
    setIsSuspendModalOpen: (v: boolean) => void;
    handleSuspend: () => void;
    isDeleteModalOpen: boolean;
    setIsDeleteModalOpen: (v: boolean) => void;
    handleForceDelete: () => void;
    isGuardianModalOpen: boolean;
    setIsGuardianModalOpen: (v: boolean) => void;
    isCreatingNewGuardian: boolean;
    setIsCreatingNewGuardian: (v: boolean) => void;
    searchPhone: string;
    setSearchPhone: (v: string) => void;
    isSearchingParent: boolean;
    handleLinkParent: (e: React.FormEvent) => void;
    newGuardianForm: any;
    setNewGuardianForm: (f: any) => void;
    handleCreateGuardian: (e: React.FormEvent) => void;
    parents: any[];
    handleMarkPrimary: (id: number) => void;
    handleUnlinkParent: (id: number) => void;
}

const ProfileModals: React.FC<ProfileModalsProps> = ({
    student, isDisciplineModalOpen, setIsDisciplineModalOpen, disciplineForm, setDisciplineForm,
    isSubmitting, handleDisciplineSubmit, isTransferModalOpen, setIsTransferModalOpen,
    transferClassId, setTransferClassId, classes, handleTransfer, isHealthModalOpen,
    setIsHealthModalOpen, healthForm, setHealthForm, handleHealthSubmit,
    isActivityModalOpen, setIsActivityModalOpen, activityForm, setActivityForm,
    handleActivitySubmit, isDocumentModalOpen, setIsDocumentModalOpen, documentForm,
    setDocumentForm, handleDocumentSubmit, isEditModalOpen, setIsEditModalOpen,
    handleEditSubmit, isClearanceModalOpen, setIsClearanceModalOpen, handlePrintClearance,
    unreturnedBooks: _unreturnedBooks, results: _results, isSuspendModalOpen, setIsSuspendModalOpen,
    handleSuspend, isDeleteModalOpen, setIsDeleteModalOpen, handleForceDelete, isGuardianModalOpen,
    setIsGuardianModalOpen, isCreatingNewGuardian, setIsCreatingNewGuardian, searchPhone,
    setSearchPhone, isSearchingParent, handleLinkParent, newGuardianForm, setNewGuardianForm,
    handleCreateGuardian,
}) => {
    return (
        <>
            {/* Discipline Modal */}
            <Modal isOpen={isDisciplineModalOpen} onClose={() => setIsDisciplineModalOpen(false)} title="New Discipline Intervention" size="md">
                <form onSubmit={handleDisciplineSubmit} className="space-y-4 form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group">
                            <PremiumDateInput
                                label="Incident Date"
                                value={disciplineForm.incident_date}
                                onChange={val => setDisciplineForm({ ...disciplineForm, incident_date: val })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="label text-[10px] font-black uppercase">Offence Category</label>
                            <input type="text" className="input" placeholder="e.g. Lateness, Theft" value={disciplineForm.offence_category || ''} onChange={e => setDisciplineForm({ ...disciplineForm, offence_category: e.target.value })} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase">Detailed Description</label>
                        <textarea className="input" rows={3} value={disciplineForm.description || ''} onChange={e => setDisciplineForm({ ...disciplineForm, description: e.target.value })} required></textarea>
                    </div>
                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase">Action Taken</label>
                        <input type="text" className="input" placeholder="e.g. Suspension, Warning" value={disciplineForm.action_taken || ''} onChange={e => setDisciplineForm({ ...disciplineForm, action_taken: e.target.value })} required />
                    </div>
                    <div className="modal-footer pt-4">
                        <Button type="submit" variant="danger" className="w-full font-black uppercase shadow-lg" loading={isSubmitting} loadingText="Saving...">
                            Submit Institutional Record
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Transfer Modal */}
            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer Student Unit" size="sm">
                <form onSubmit={handleTransfer} className="space-y-4 form-container-sm mx-auto">
                    <p className="text-secondary text-xs">Select the new class/unit for this student.</p>
                    <SearchableSelect
                        placeholder="Select New Class"
                        options={classes.map(c => ({ id: c.id.toString(), label: `${c.name} ${c.stream}` }))}
                        value={transferClassId}
                        onChange={(val: string | number) => setTransferClassId(val.toString())}
                        required
                    />
                    <div className="modal-footer pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={isSubmitting} loadingText="Processing...">
                            Process Transfer
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Health Modal */}
            <Modal isOpen={isHealthModalOpen} onClose={() => setIsHealthModalOpen(false)} title="Update Medical Integrity" size="md">
                <form onSubmit={handleHealthSubmit} className="space-y-4 form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Blood Group</label><input type="text" className="input" value={healthForm.blood_group || ''} onChange={e => setHealthForm({ ...healthForm, blood_group: e.target.value })} /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Known Allergies</label><input type="text" className="input" value={healthForm.allergies || ''} onChange={e => setHealthForm({ ...healthForm, allergies: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Chronic Conditions</label><textarea className="input" rows={2} value={healthForm.chronic_conditions || ''} onChange={e => setHealthForm({ ...healthForm, chronic_conditions: e.target.value })}></textarea></div>
                    <div className="grid grid-cols-2 gap-md border-top pt-4">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Emergency Contact</label><input type="text" className="input" value={healthForm.emergency_contact_name || ''} onChange={e => setHealthForm({ ...healthForm, emergency_contact_name: e.target.value })} required /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Emergency Phone</label><input type="tel" className="input" value={healthForm.emergency_contact_phone || ''} onChange={e => setHealthForm({ ...healthForm, emergency_contact_phone: e.target.value })} required /></div>
                    </div>
                    <div className="modal-footer pt-4 flex justify-between gap-4">
                        <Button type="submit" variant="secondary" className="font-black uppercase shadow-lg flex-grow" loading={isSubmitting} loadingText="Syncing...">
                            Sync Medical Database
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Activity Modal */}
            <Modal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} title="Register Extra-Curricular Activity" size="md">
                <form onSubmit={handleActivitySubmit} className="space-y-4 form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Activity Name</label><input type="text" className="input" placeholder="e.g. Debate Club" value={activityForm.name || ''} onChange={e => setActivityForm({ ...activityForm, name: e.target.value })} required /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Type</label>
                            <SearchableSelect
                                options={[{ id: 'Club', label: 'Club' }, { id: 'Sport', label: 'Sport' }, { id: 'Arts', label: 'Arts' }]}
                                value={activityForm.activity_type || ''}
                                onChange={(val: string | number) => setActivityForm({ ...activityForm, activity_type: val.toString() })}
                            />
                        </div>
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Role / Position</label><input type="text" className="input" placeholder="e.g. Member, Captain" value={activityForm.role || ''} onChange={e => setActivityForm({ ...activityForm, role: e.target.value })} /></div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Year</label><input type="number" className="input" value={activityForm.year || new Date().getFullYear()} onChange={e => setActivityForm({ ...activityForm, year: parseInt(e.target.value) })} /></div>
                    <div className="modal-footer pt-4">
                        <Button type="submit" variant="primary" className="w-full font-black uppercase" loading={isSubmitting} loadingText="Registering...">
                            Register Participation
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Document Modal */}
            <Modal isOpen={isDocumentModalOpen} onClose={() => setIsDocumentModalOpen(false)} title="Upload Institutional Document" size="sm">
                <form onSubmit={handleDocumentSubmit} className="space-y-4 form-container-sm mx-auto">
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Document Type</label>
                        <SearchableSelect
                            options={[{ id: 'BIRTH_CERT', label: 'Birth Certificate' }, { id: 'REPORT_CARD', label: 'Report Card' }, { id: 'TRANSFER_LETTER', label: 'Transfer Letter' }, { id: 'OTHER', label: 'Other' }]}
                            value={documentForm.doc_type || ''}
                            onChange={(val: string | number) => setDocumentForm({ ...documentForm, doc_type: val.toString() })}
                        />
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Select File</label><input type="file" className="file-input w-full" onChange={e => setDocumentForm({ ...documentForm, file: e.target.files?.[0] || null })} required /></div>
                    <div className="modal-footer pt-4">
                        <Button type="submit" variant="primary" className="w-full font-black uppercase" loading={isSubmitting} loadingText="Uploading...">
                            Upload to Archive
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Profile Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Student Profile" size="md">
                <form onSubmit={handleEditSubmit} className="space-y-4 form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Full Name</label><input type="text" className="input" defaultValue={student?.full_name || ''} required /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Admission Number</label><input type="text" className="input" defaultValue={student?.admission_number || ''} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Class</label>
                            <SearchableSelect
                                placeholder="Select Class"
                                options={classes.map(c => ({ id: c.id.toString(), label: `${c.name} ${c.stream}` }))}
                                value={student?.current_class?.toString() || ''}
                                onChange={(_val: string | number) => { }}
                            />
                        </div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Category</label>
                            <SearchableSelect
                                options={[{ id: 'DAY', label: 'Day Scholar' }, { id: 'BOARDING', label: 'Boarding' }]}
                                value={student?.category || ''}
                                onChange={(_val: string | number) => { }}
                            />
                        </div>
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Status</label>
                        <SearchableSelect
                            options={[{ id: 'ACTIVE', label: 'Active' }, { id: 'SUSPENDED', label: 'Suspended' }, { id: 'WITHDRAWN', label: 'Withdrawn' }, { id: 'ALUMNI', label: 'Alumni' }, { id: 'TRANSFERRED', label: 'Transferred' }]}
                            value={student?.status || ''}
                            onChange={(_val: string | number) => { }}
                        />
                    </div>
                    <div className="modal-footer pt-4">
                        <Button type="submit" variant="primary" className="w-full font-black uppercase" loading={isSubmitting} loadingText="Updating...">
                            Update Profile
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Clearance Modal */}
            <Modal isOpen={isClearanceModalOpen} onClose={() => setIsClearanceModalOpen(false)} title="Print Student Clearance" size="md">
                <div className="space-y-6 text-center">
                    <p className="text-secondary text-sm px-6">Download or print the official institutional clearance document for <strong>{student?.full_name}</strong>. This document verifies the student's status across all departments.</p>
                    <div className="mx-auto max-w-xs p-6 bg-secondary-light/30 rounded-2xl border border-dashed border-primary/20 flex flex-col items-center gap-4 shadow-inner">
                        <FileText size={48} className="text-primary opacity-50" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Official Transcript & Clearance</span>
                    </div>
                    <div className="modal-footer pt-4 flex gap-4">
                        <Button variant="outline" className="flex-grow font-black uppercase" onClick={() => setIsClearanceModalOpen(false)}>Close</Button>
                        <Button variant="primary" className="flex-grow font-black uppercase shadow-lg" onClick={handlePrintClearance} icon={<Printer size={18} />}>
                            GENERATE PDF / PRINT
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Suspend Modal */}
            <Modal isOpen={isSuspendModalOpen} onClose={() => setIsSuspendModalOpen(false)} title="Restrict Student Access" size="sm">
                <div className="space-y-4 text-center">
                    <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-2">
                        <ShieldAlert size={32} />
                    </div>
                    <h3 className="text-lg font-black uppercase text-slate-800">Confirm Suspension</h3>
                    <p className="text-slate-600 text-sm px-4">
                        Are you sure you want to <strong>SUSPEND</strong> {student?.full_name}? This will restrict their access to institutional services.
                    </p>
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1 font-black uppercase" onClick={() => setIsSuspendModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" className="flex-1 font-black uppercase bg-amber-600 border-amber-600 hover:bg-amber-700" onClick={handleSuspend} loading={isSubmitting}>
                            Restrict Access
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Permanent Deletion" size="sm">
                <div className="space-y-4 text-center">
                    <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-2">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-lg font-black uppercase text-red-700">Irreversible Action</h3>
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mx-1">
                        <p className="text-red-600 text-xs font-bold leading-relaxed">
                            DANGER: This will permanently delete <strong>{student?.full_name}</strong> and ALL associated records.
                        </p>
                    </div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">This action cannot be undone.</p>
                    <div className="flex flex-col gap-2 pt-2">
                        <Button variant="danger" className="w-full font-black uppercase py-3 shadow-lg" onClick={handleForceDelete} loading={isSubmitting}>
                            Confirm Permanent Delete
                        </Button>
                        <Button variant="ghost" className="w-full font-black uppercase text-slate-400" onClick={() => setIsDeleteModalOpen(false)}>
                            Abort & Go Back
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Guardian Modal */}
            <Modal isOpen={isGuardianModalOpen} onClose={() => setIsGuardianModalOpen(false)} title="Guardian Network Management" size="sm">
                <div className="space-y-6">
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                        <button className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${!isCreatingNewGuardian ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`} onClick={() => setIsCreatingNewGuardian(false)}>Link Existing</button>
                        <button className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${isCreatingNewGuardian ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`} onClick={() => setIsCreatingNewGuardian(true)}>Create New</button>
                    </div>
                    {!isCreatingNewGuardian ? (
                        <form onSubmit={handleLinkParent} className="space-y-4">
                            <p className="text-[11px] font-bold text-secondary uppercase tracking-widest px-1">Search via Phone Number</p>
                            <div className="flex gap-2">
                                <input type="tel" className="input h-12 bg-white flex-grow" placeholder="e.g. 0712345678" value={searchPhone} onChange={e => setSearchPhone(e.target.value)} required />
                                <Button type="submit" variant="primary" loading={isSearchingParent} className="h-12 px-6">LINK</Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleCreateGuardian} className="space-y-3">
                            <div className="form-group"><label className="label text-[10px] font-black uppercase text-slate-500">Full Name *</label><input type="text" className="input h-10 bg-white" value={newGuardianForm.full_name || ''} onChange={e => setNewGuardianForm({ ...newGuardianForm, full_name: e.target.value })} required /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="form-group"><label className="label text-[10px] font-black uppercase text-slate-500">Phone *</label><input type="tel" className="input h-10 bg-white" value={newGuardianForm.phone || ''} onChange={e => setNewGuardianForm({ ...newGuardianForm, phone: e.target.value })} required /></div>
                                <div className="form-group"><label className="label text-[10px] font-black uppercase text-slate-500">Relation</label><SearchableSelect options={[{ id: 'PARENT', label: 'Parent' }, { id: 'GRANDPARENT', label: 'Grandparent' }, { id: 'SIBLING', label: 'Sibling' }, { id: 'OTHER', label: 'Other' }]} value={newGuardianForm.relation || ''} onChange={(val: string | number) => setNewGuardianForm({ ...newGuardianForm, relation: val.toString() })} /></div>
                            </div>
                            <div className="modal-footer pt-4"><Button type="submit" variant="primary" className="w-full font-black uppercase" loading={isSubmitting} loadingText="Creating...">Create & Link</Button></div>
                        </form>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default ProfileModals;

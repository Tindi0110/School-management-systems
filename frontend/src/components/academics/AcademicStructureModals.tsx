import React from 'react';
import Modal from '../Modal';
import SearchableSelect from '../SearchableSelect';

type Staff = { id: number; user?: number; full_name: string; employee_id: string; role: string };
type SubjectGroup = { id: number; name: string };

interface ClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    classForm: { name: string; stream: string; class_teacher: string; year: string | number; capacity: number };
    setClassForm: (form: any) => void;
    handleClassSubmit: (e: React.FormEvent) => void;
    staff: Staff[];
    isSubmitting: boolean;
    editingClassId: number | null;
}

export const ClassModal: React.FC<ClassModalProps> = ({
    isOpen, onClose, classForm, setClassForm, handleClassSubmit, staff, isSubmitting, editingClassId
}) => (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={editingClassId ? "Update Class Unit" : "Create New Class Unit"}
        footer={
            <>
                <button type="button" className="modern-btn modern-btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" form="class-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (editingClassId ? "UPDATING..." : "CREATING...") : (editingClassId ? "UPDATE UNIT" : "CONFIRM CREATION")}
                </button>
            </>
        }
    >
        <form id="class-form" onSubmit={handleClassSubmit} className="space-y-6">
            <div className="form-grid">
                <div className="form-group">
                    <label>Class Level *</label>
                    <input
                        type="text"
                        value={classForm.name}
                        onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                        placeholder="e.g. Form 4"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Stream *</label>
                    <input
                        type="text"
                        value={classForm.stream}
                        onChange={(e) => setClassForm({ ...classForm, stream: e.target.value })}
                        placeholder="e.g. North"
                        required
                    />
                </div>
                <div className="form-group col-span-2">
                    <label>Class Teacher</label>
                    <SearchableSelect
                        placeholder="Select Teacher..."
                        options={staff.filter(s => s.role === 'TEACHER').map(s => ({
                            id: (s.user || s.id).toString(),
                            label: `${s.full_name} (${s.employee_id})`
                        }))}
                        value={classForm.class_teacher}
                        onChange={(val) => setClassForm({ ...classForm, class_teacher: val.toString() })}
                    />
                </div>
                <div className="form-group">
                    <label>Active Year</label>
                    <input type="number" value={classForm.year} readOnly className="bg-slate-50 text-slate-500 font-mono" />
                </div>
                <div className="form-group">
                    <label>Max Capacity</label>
                    <input
                        type="number"
                        value={classForm.capacity || ''}
                        onChange={(e) => setClassForm({ ...classForm, capacity: parseInt(e.target.value) || 0 })}
                        placeholder="e.g. 45"
                    />
                </div>
            </div>
        </form>
    </Modal>
);

interface GroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupForm: { name: string };
    setGroupForm: (form: any) => void;
    handleGroupSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
    editingGroupId: number | null;
}

export const GroupModal: React.FC<GroupModalProps> = ({
    isOpen, onClose, groupForm, setGroupForm, handleGroupSubmit, isSubmitting, editingGroupId
}) => (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={editingGroupId ? "Update Department" : "Create Department Group"}
        footer={
            <>
                <button type="button" className="modern-btn modern-btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" form="group-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "SAVING..." : "SAVE DEPARTMENT"}
                </button>
            </>
        }
    >
        <form id="group-form" onSubmit={handleGroupSubmit} className="space-y-6">
            <div className="form-group">
                <label>Group Name *</label>
                <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    placeholder="e.g. Sciences"
                    required
                />
            </div>
        </form>
    </Modal>
);

interface SubjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjectForm: { name: string; code: string; short_name: string; group: string };
    setSubjectForm: (form: any) => void;
    handleSubjectSubmit: (e: React.FormEvent) => void;
    subjectGroups: SubjectGroup[];
    isSubmitting: boolean;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
    isOpen, onClose, subjectForm, setSubjectForm, handleSubjectSubmit, subjectGroups, isSubmitting
}) => (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Add Curriculum Subject"
        footer={
            <>
                <button type="button" className="modern-btn modern-btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" form="subject-form" className="modern-btn modern-btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "REGISTERING..." : "REGISTER SUBJECT"}
                </button>
            </>
        }
    >
        <form id="subject-form" onSubmit={handleSubjectSubmit} className="space-y-6">
            <div className="form-grid">
                <div className="form-group col-span-2 md:col-span-1">
                    <label>Subject Name *</label>
                    <input
                        type="text"
                        value={subjectForm.name}
                        onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group col-span-2 md:col-span-1">
                    <label>Subject Code *</label>
                    <input
                        type="text"
                        value={subjectForm.code}
                        onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group col-span-2">
                    <label>Abbreviated Name (Optional)</label>
                    <input
                        type="text"
                        placeholder="e.g. MATH"
                        value={subjectForm.short_name}
                        onChange={(e) => setSubjectForm({ ...subjectForm, short_name: e.target.value })}
                    />
                </div>
                <div className="form-group col-span-2">
                    <label>Department Group</label>
                    <SearchableSelect
                        placeholder="General"
                        options={subjectGroups.map(g => ({ id: g.id.toString(), label: g.name }))}
                        value={subjectForm.group}
                        onChange={(val) => setSubjectForm({ ...subjectForm, group: val.toString() })}
                    />
                </div>
            </div>
        </form>
    </Modal>
);

import React from 'react';
import Modal from '../Modal';
import Button from '../common/Button';
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
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Class Unit">
        <form onSubmit={handleClassSubmit} className="space-y-4 form-container-md mx-auto">
            <div className="grid grid-cols-2 gap-md">
                <div className="form-group">
                    <label className="label text-[10px] font-black uppercase">Class Level *</label>
                    <input
                        type="text"
                        className="input"
                        value={classForm.name}
                        onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                        placeholder="Form 4"
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="label text-[10px] font-black uppercase">Stream *</label>
                    <input
                        type="text"
                        className="input"
                        value={classForm.stream}
                        onChange={(e) => setClassForm({ ...classForm, stream: e.target.value })}
                        placeholder="North"
                        required
                    />
                </div>
            </div>
            <div className="form-group mb-2">
                <label className="label text-[10px] font-black uppercase">Class Teacher</label>
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
            <div className="grid grid-cols-2 gap-md">
                <div className="form-group">
                    <label className="label text-[10px] font-black uppercase">Active Year</label>
                    <input type="number" className="input" value={classForm.year} readOnly />
                </div>
                <div className="form-group">
                    <label className="label text-[10px] font-black uppercase">Max Capacity</label>
                    <input
                        type="number"
                        className="input"
                        value={classForm.capacity || ''}
                        onChange={(e) => setClassForm({ ...classForm, capacity: parseInt(e.target.value) || 0 })}
                    />
                </div>
            </div>
            <Button
                type="button"
                onClick={handleClassSubmit}
                variant="primary"
                size="sm"
                className="w-full mt-2 font-black uppercase"
                loading={isSubmitting}
                loadingText={editingClassId ? "Updating..." : "Creating..."}
            >
                Confirm Unit Creation
            </Button>
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
    <Modal isOpen={isOpen} onClose={onClose} title="Create Department Group">
        <form onSubmit={handleGroupSubmit} className="form-container-sm mx-auto space-y-4">
            <div className="form-group">
                <label className="label text-[10px] font-black uppercase">Group Name *</label>
                <input
                    type="text"
                    className="input"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    placeholder="e.g. Sciences"
                    required
                />
            </div>
            <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full mt-2 font-black uppercase"
                loading={isSubmitting}
                loadingText="Saving..."
            >
                {editingGroupId ? 'Update Group' : 'Save Group'}
            </Button>
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
    <Modal isOpen={isOpen} onClose={onClose} title="Add Curriculum Subject">
        <form onSubmit={handleSubjectSubmit} className="space-y-4 form-container-md mx-auto">
            <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="label text-[10px] font-black uppercase">Subject Name *</label>
                    <input
                        type="text"
                        className="input"
                        value={subjectForm.name}
                        onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="label text-[10px] font-black uppercase">Subject Code *</label>
                    <input
                        type="text"
                        className="input"
                        value={subjectForm.code}
                        onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                        required
                    />
                </div>
            </div>
            <div className="form-group">
                <label className="label text-[10px] font-black uppercase">Abbreviated Name (Optional)</label>
                <input
                    type="text"
                    className="input"
                    placeholder="e.g. MATH"
                    value={subjectForm.short_name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, short_name: e.target.value })}
                />
            </div>
            <div className="form-group">
                <label className="label text-[10px] font-black uppercase">Department Group</label>
                <SearchableSelect
                    placeholder="General"
                    options={subjectGroups.map(g => ({ id: g.id.toString(), label: g.name }))}
                    value={subjectForm.group}
                    onChange={(val) => setSubjectForm({ ...subjectForm, group: val.toString() })}
                />
            </div>
            <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full mt-2 font-black uppercase"
                loading={isSubmitting}
                loadingText="Registering..."
            >
                Register Subject
            </Button>
        </form>
    </Modal>
);

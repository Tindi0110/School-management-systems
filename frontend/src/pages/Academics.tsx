import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Plus, Edit, Trash2, Users, BookOpen, Award,
    School, Calendar, ClipboardCheck, BarChart3, FileText,
    Settings, CheckCircle2, Layers, Trophy, Printer, Square, CheckSquare, Download
} from 'lucide-react';
import { academicsAPI, staffAPI, studentsAPI } from '../api/api';
import { exportToCSV } from '../utils/export';

import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { StatCard } from '../components/Card';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';

const calculateGrade = (score: number, gradeSystems: any[], specificSystemId?: number | string | null) => {
    if (!score && score !== 0) return '-';

    // 1. Try specific system
    let system = gradeSystems.find(s => s.id === specificSystemId || s.id === parseInt(specificSystemId as string));

    // 2. Try default system
    if (!system) {
        system = gradeSystems.find(s => s.is_default);
    }

    // 3. Fallback to first system
    if (!system && gradeSystems.length > 0) {
        system = gradeSystems[0];
    }

    if (system && system.boundaries && system.boundaries.length > 0) {
        // Sort boundaries descending by min_score to find the right bracket
        const sortedBoundaries = [...system.boundaries].sort((a, b) => b.min_score - a.min_score);
        for (const b of sortedBoundaries) {
            if (score >= b.min_score && score <= b.max_score) {
                return b.grade;
            }
        }
    }

    return '-';
};

const StudentResultRow = React.memo(({ student, sClass, subjects, studentScores, onScoreChange, onDeleteResult, activeClassSubjects, resultContext, gradeSystems, examGradeSystemId }: any) => {
    return (
        <tr className="hover:bg-slate-50 transition-colors border-b">
            <td className="sticky left-0 z-10 bg-white font-medium py-2 px-3 border-r">
                <div className="text-slate-950 font-bold text-sm" title={student.full_name}>{student.full_name}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {student.admission_number} | {sClass?.stream}
                </div>
            </td>
            {subjects.filter((sub: any) => {
                if (resultContext === 'all') return true;
                return activeClassSubjects.some((cs: any) => cs.subject === sub.id);
            }).map((sub: any) => {
                const entry = (studentScores || {})[sub.id] || { score: '' };
                const scoreVal = parseFloat(entry.score);
                const grade = isNaN(scoreVal) ? '' : calculateGrade(scoreVal, gradeSystems, examGradeSystemId);
                const hasSavedResult = !!entry.id;
                return (
                    <td key={sub.id} className="p-0 relative border-r group min-w-[120px]">
                        <div className="flex flex-col items-center min-h-[85px] justify-center">
                            <input
                                type="text"
                                inputMode="decimal"
                                className={`w-full text-center text-xl font-black bg-transparent border-none outline-none px-6 py-4 m-0
                                    ${hasSavedResult ? 'text-blue-700' : 'text-slate-700'}
                                    focus:bg-blue-50 focus:ring-2 focus:ring-blue-400 transition-all rounded-lg`}
                                value={entry.score}
                                placeholder="—"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                        onScoreChange(student.id, sub.id, val);
                                    }
                                }}
                                title={`${sub.name}: ${entry.score || 'not entered'}`}
                            />
                            {/* Grade badge */}
                            <span className={`text-[10px] font-black pb-1.5 ${grade === 'A' || grade === 'A-' ? 'text-green-600' :
                                grade === 'E' || grade === 'D-' ? 'text-red-600' :
                                    grade ? 'text-slate-500' : 'text-slate-300'
                                }`}>{grade || '•'}</span>
                        </div>
                        {/* Delete button — only shown for saved results on hover */}
                        {hasSavedResult && (
                            <button
                                type="button"
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-100 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black leading-none"
                                title={`Delete ${sub.name} score for ${student.full_name}`}
                                onClick={() => onDeleteResult && onDeleteResult(student.id, sub.id, entry.id)}
                            >×</button>
                        )}
                        {/* Blue dot = saved, not yet in db */}
                        {entry.score && !hasSavedResult && (
                            <span className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved" />
                        )}
                    </td>
                );
            })}
        </tr>
    );
});

const Academics = () => {
    const [activeTab, setActiveTab] = useState<'SUMMARY' | 'CLASSES' | 'CURRICULUM' | 'EXAMS' | 'GRADING' | 'ATTENDANCE' | 'RESOURCES' | 'ALLOCATION'>('SUMMARY');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success, error: toastError, warning } = useToast();
    const { confirm } = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');


    // Data States
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [terms, setTerms] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [gradeSystems, setGradeSystems] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [syllabusData, setSyllabusData] = useState<any[]>([]);
    const [meanGrade, setMeanGrade] = useState<string>('...');

    // Allocation State
    const [classAllocations, setClassAllocations] = useState<any[]>([]);
    const [selectedAllocationClass, setSelectedAllocationClass] = useState<string>('');
    const [isSyncing, setIsSyncing] = useState(false);



    // Helper: Get unique class names (Forms)
    const uniqueClassNames = Array.from(new Set(classes.map(c => c.name))).sort();

    // Helper: Get streams for a selected class name




    // Modal States
    const [isYearModalOpen, setIsYearModalOpen] = useState(false);
    const [isTermModalOpen, setIsTermModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
    const [isBoundaryModalOpen, setIsBoundaryModalOpen] = useState(false);

    // Results & Views State (CONSOLIDATED)
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isViewResultsModalOpen, setIsViewResultsModalOpen] = useState(false);
    const [isBroadsheetModalOpen, setIsBroadsheetModalOpen] = useState(false);
    const [viewResultsGroupBy, setViewResultsGroupBy] = useState<'STREAM' | 'ENTIRE_CLASS'>('STREAM');
    const [resultContext, setResultContext] = useState({ level: '', classId: '', subjectId: '' });
    const [selectedExam, setSelectedExam] = useState<any>(null);
    const [examResults, setExamResults] = useState<any[]>([]);
    const [studentScores, setStudentScores] = useState<any>({});
    const [activeClassSubjects, setActiveClassSubjects] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [viewClassStudents, setViewClassStudents] = useState<any[]>([]);

    // Form States
    const [yearForm, setYearForm] = useState({ name: '', is_active: false });
    const [termForm, setTermForm] = useState({ year: '', name: '', start_date: '', end_date: '', is_active: false });
    const [groupForm, setGroupForm] = useState({ name: '' });
    const [subjectForm, setSubjectForm] = useState({ name: '', code: '', group: '', is_optional: false });
    const [gradeForm, setGradeForm] = useState({ name: '', is_default: false });
    const [attendanceForm, setAttendanceForm] = useState({ student: '', status: 'PRESENT', remark: '', date: new Date().toISOString().split('T')[0] });
    const [attendanceFilter, setAttendanceFilter] = useState({ level: '', classId: '', isBulk: false });
    const [classForm, setClassForm] = useState({ name: '', stream: '', year: new Date().getFullYear().toString(), class_teacher: '', capacity: 40 });
    const [examForm, setExamForm] = useState({ name: '', exam_type: 'END_TERM', term: '', grade_system: '', weighting: 100, date_started: '', is_active: true });
    const [syllabusForm, setSyllabusForm] = useState({ subject: '', class_grade: '', coverage_percentage: 0 });
    const [boundaryForm, setBoundaryForm] = useState({ system: '', grade: '', min_score: 0, max_score: 100, points: 0, remarks: '' });

    // Editing & Selection States (CONSOLIDATED)
    const [editingSyllabusId, setEditingSyllabusId] = useState<number | null>(null);
    const [editingYearId, setEditingYearId] = useState<number | null>(null);
    const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
    const [editingAttendanceId, setEditingAttendanceId] = useState<number | null>(null);
    const [editingClassId, setEditingClassId] = useState<number | null>(null);
    const [editingExamId, setEditingExamId] = useState<number | null>(null);
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [editingBoundaryId, setEditingBoundaryId] = useState<number | null>(null);
    const [editingSystemId, setEditingSystemId] = useState<number | null>(null);
    const [selectedSystem, setSelectedSystem] = useState<any>(null);

    // Other UI States
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: string | null; id: number | null }>({ isOpen: false, type: null, id: null });
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isViewClassModalOpen, setIsViewClassModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [attendanceSort, setAttendanceSort] = useState({ field: 'date', direction: 'desc' });
    const [bulkAttendanceList, setBulkAttendanceList] = useState<any[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

    // RBAC Helpers
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const isTeacher = user?.role === 'TEACHER';
    const isAdmin = ['ADMIN', 'PRINCIPAL', 'DOS', 'REGISTRAR'].includes(user?.role);
    const isReadOnly = isTeacher && !isAdmin;


    const handleScoreChange = useCallback((studentId: any, subjectId: any, val: string) => {
        setStudentScores((prev: any) => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [subjectId]: { ...(prev[studentId]?.[subjectId] || {}), score: val }
            }
        }));
    }, []);

    const filteredResultStudents = useMemo(() => {
        if (!resultContext.classId) return [];
        return students.filter(s => {
            if (resultContext.classId === 'all') {
                const sClass = classes.find(c => c.id === s.current_class);
                return sClass && sClass.name === resultContext.level;
            }
            return s.current_class === parseInt(resultContext.classId);
        }).sort((a, b) => a.full_name.localeCompare(b.full_name));
    }, [students, resultContext.classId, resultContext.level, classes]);



    const openEditGroup = (group: any) => {
        setGroupForm({ name: group.name });
        setEditingGroupId(group.id);
        setIsGroupModalOpen(true);
    };

    const handleDeleteGroup = async (id: number) => {
        if (await confirm('Delete this group? Subjects in this group may become unassigned.', { type: 'danger' })) {
            try {
                await academicsAPI.subjectGroups.delete(id);
                success('Group deleted');
                loadMetadata();
            }
            catch (e: any) { toastError(e.message || 'Failed to delete group'); }
        }
    };
    const calculateMeanGrade = (results: any[], gradeSystems: any[], specificSystemId?: number | string | null) => {
        if (!results || results.length === 0) return 'N/A';
        const totalScore = results.reduce((sum, r) => sum + parseFloat(r.score), 0);
        const avg = totalScore / results.length;

        return calculateGrade(avg, gradeSystems, specificSystemId);
    };

    const loadAllAcademicData = async () => {
        setLoading(true);
        try {
            const dS = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? (r.value.data?.results ?? r.value.data ?? []) : [];

            // Fetch ALL data in one mega-parallel call to avoid sequential waterfalls
            const [
                yearsRes, termsRes, classesRes, subjectsRes, groupsRes,
                gradesRes, staffRes, studentRes, resultsRes, examsRes, syllabusRes
            ] = await Promise.allSettled([
                academicsAPI.years.getAll(),
                academicsAPI.terms.getAll(),
                academicsAPI.classes.getAll(),
                academicsAPI.subjects.getAll(),
                academicsAPI.subjectGroups.getAll(),
                academicsAPI.gradeSystems.getAll(),
                staffAPI.getAll(),
                studentsAPI.getAll({ page_size: 200 }),
                academicsAPI.results.getAll({ page_size: 500 }),
                academicsAPI.exams.getAll(),
                academicsAPI.syllabus.getAll(),
            ]);

            const freshGradeSystems = dS(gradesRes);
            const academicResults = dS(resultsRes);

            setAcademicYears(dS(yearsRes));
            setTerms(dS(termsRes));
            setClasses(dS(classesRes));
            setSubjects(dS(subjectsRes));
            setSubjectGroups(dS(groupsRes));
            setGradeSystems(freshGradeSystems);
            setStaff(dS(staffRes));
            setStudents(dS(studentRes));
            setExams(dS(examsRes));
            setSyllabusData(dS(syllabusRes));

            // Debug logs to trace why Summary cards show "No Data"
            console.log("Academics Data Load Complete:");
            console.log("- Classes:", dS(classesRes));
            console.log("- Subject Groups:", dS(groupsRes));
            console.log("- Exams:", dS(examsRes));

            // Use freshly fetched grade systems (not stale state) for accurate mean grade
            setMeanGrade(calculateMeanGrade(academicResults, freshGradeSystems));
        } catch (err) {
            console.error('Error loading academic data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMetadata = async () => {
        setLoading(true);
        try {
            const d = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? (r.value.data?.results ?? r.value.data ?? []) : [];
            const [yearsRes, termsRes, classesRes, subjectsRes, groupsRes, gradesRes, staffRes] = await Promise.allSettled([
                academicsAPI.years.getAll(),
                academicsAPI.terms.getAll(),
                academicsAPI.classes.getAll(),
                academicsAPI.subjects.getAll(),
                academicsAPI.subjectGroups.getAll(),
                academicsAPI.gradeSystems.getAll(),
                staffAPI.getAll(),
            ]);

            setAcademicYears(d(yearsRes));
            setTerms(d(termsRes));
            setClasses(d(classesRes));
            setSubjects(d(subjectsRes));
            setSubjectGroups(d(groupsRes));
            setGradeSystems(d(gradesRes));
            setStaff(d(staffRes));
        } catch (err) {
            console.error('Error loading academic metadata:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadTabSpecificData = async () => {
        const d = (res: any) => res.data?.results ?? res.data ?? [];
        try {
            if (activeTab === 'SUMMARY') {
                // Fetch grade systems fresh to avoid stale state race condition
                const [studentRes, resultsRes, examsRes, syllabusRes, gradesRes] = await Promise.all([
                    studentsAPI.getAll({ page_size: 200 }),
                    academicsAPI.results.getAll({ page_size: 500 }),
                    academicsAPI.exams.getAll(),
                    academicsAPI.syllabus.getAll(),
                    academicsAPI.gradeSystems.getAll(),
                ]);
                const freshGradeSystems = d(gradesRes);
                const results = d(resultsRes);
                setStudents(d(studentRes));
                setExams(d(examsRes));
                setSyllabusData(d(syllabusRes));
                setGradeSystems(freshGradeSystems);
                setMeanGrade(calculateMeanGrade(results, freshGradeSystems));
            } else if (activeTab === 'EXAMS') {
                const res = await academicsAPI.exams.getAll();
                setExams(d(res));
            } else if (activeTab === 'ATTENDANCE') {
                const [attRes, studentRes] = await Promise.all([
                    academicsAPI.attendance.getAll(),
                    studentsAPI.getAll({ page_size: 200 })
                ]);
                setAttendanceRecords(d(attRes));
                setStudents(d(studentRes));
            } else if (activeTab === 'CURRICULUM') {
                const [syllabusRes, studentRes] = await Promise.all([
                    academicsAPI.syllabus.getAll(),
                    studentsAPI.getAll({ page_size: 200 })
                ]);
                setSyllabusData(d(syllabusRes));
                setStudents(d(studentRes));
            }
        } catch (err) {
            console.error(`Error loading data for tab ${activeTab}:`, err);
        }
    };

    // Single mount effect - loads everything at once to avoid race conditions
    useEffect(() => {
        loadAllAcademicData();
    }, []);

    // Tab-switch effect - only fires when tab changes AFTER initial load
    const isFirstRender = React.useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return; // Skip on initial mount - loadAllAcademicData() handles this
        }
        loadTabSpecificData();
    }, [activeTab]);


    // Allocation Handlers
    const fetchClassAllocations = async (classId: string) => {
        if (!classId) return;
        try {
            const res = await academicsAPI.classSubjects.list({ class_id: classId });
            setClassAllocations(res.data?.results ?? res.data ?? []);
        } catch (err) { console.error("Error fetching allocations:", err); }
    };

    const toggleClassSubject = async (subjectId: number, currentAllocationId?: number) => {
        if (!selectedAllocationClass) return;
        try {
            if (currentAllocationId) {
                await academicsAPI.classSubjects.delete(currentAllocationId);
                success('Subject removed');
            } else {
                await academicsAPI.classSubjects.create({ class_id: selectedAllocationClass, subject: subjectId });
                success('Subject added');
            }
            fetchClassAllocations(selectedAllocationClass);
        } catch (err: any) { toastError(err.message || 'Failed to update allocation'); }
    };

    const syncClassSubjects = async () => {
        if (!classAllocations.length || !selectedAllocationClass) return;
        if (!await confirm('This will update subject lists for ALL students in this class. Continue?')) return;

        setIsSyncing(true);
        try {
            let syncedCount = 0;
            for (const alloc of classAllocations) {
                await academicsAPI.classSubjects.sync(alloc.id);
                syncedCount++;
            }
            success(`Synced ${syncedCount} subjects to students successfully!`);
        } catch (err: any) {
            toastError(err.message || 'Error syncing subjects.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleYearSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingYearId) {
                await academicsAPI.years.update(editingYearId, yearForm);
                success('Year updated');
            } else {
                await academicsAPI.years.create(yearForm);
                success('Year added');
            }
            loadAllAcademicData();
            setIsYearModalOpen(false);
            setEditingYearId(null);
            setYearForm({ name: '', is_active: false });
        } catch (err: any) { toastError(err.message || 'Failed to save year'); }
        finally { setIsSubmitting(false); }
    };

    const openEditYear = (y: any) => {
        setYearForm({ name: y.name, is_active: y.is_active });
        setEditingYearId(y.id);
        setIsYearModalOpen(true);
    };
    const handleTermSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await academicsAPI.terms.create(termForm);
            success('Term added');
            loadAllAcademicData();
            setIsTermModalOpen(false);
        } catch (err: any) { toastError(err.message || 'Failed to save term'); }
        finally { setIsSubmitting(false); }
    };

    const handleSubjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingSubjectId) {
                await academicsAPI.subjects.update(editingSubjectId, subjectForm);
                success('Subject updated');
            } else {
                await academicsAPI.subjects.create(subjectForm);
                success('Subject created');
            }
            loadAllAcademicData();
            setIsSubjectModalOpen(false);
            setEditingSubjectId(null);
            setSubjectForm({ name: '', code: '', group: '', is_optional: false });
        } catch (err: any) { toastError(err.message || 'Failed to save subject'); }
        finally { setIsSubmitting(false); }
    };

    const openEditSubject = (s: any) => {
        setSubjectForm({
            name: s.name,
            code: s.code,
            group: s.group?.toString() || '',
            is_optional: !s.is_core
        });
        setEditingSubjectId(s.id);
        setIsSubjectModalOpen(true);
    };

    const handleDeleteSubject = async (id: number) => {
        if (await confirm('Permanently delete this subject? Record recovery is impossible.', { type: 'danger' })) {
            try {
                await academicsAPI.subjects.delete(id);
                success('Subject removed globally');
                loadAllAcademicData();
            } catch (err: any) { toastError(err.message || 'Failed to remove subject due to active attachments'); }
        }
    };

    const openEditAttendance = (att: any) => {
        setAttendanceForm({
            student: att.student.toString(),
            status: att.status,
            remark: att.remark || '',
            date: att.date || new Date().toISOString().split('T')[0]
        });
        setEditingAttendanceId(att.id);
        setAttendanceFilter({ ...attendanceFilter, isBulk: false });
        setIsAttendanceModalOpen(true);
    };

    const handleAttendanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (attendanceFilter.isBulk) {
                const promises = bulkAttendanceList.map(record =>
                    academicsAPI.attendance.create({
                        student: record.student_id,
                        status: record.status,
                        remark: record.remark,
                        date: attendanceForm.date
                    })
                );
                await Promise.all(promises);
                success(`Attendance recorded for ${bulkAttendanceList.length} students.`);
            } else if (editingAttendanceId) {
                await academicsAPI.attendance.update(editingAttendanceId, attendanceForm);
                success('Attendance record updated.');
            } else {
                await academicsAPI.attendance.create(attendanceForm);
                success('Attendance logged.');
            }

            // Only refresh attendance data to prevent full page reload (which hides the tab)
            try {
                const attRes = await academicsAPI.attendance.getAll();
                const newRecords = attRes.data?.results ?? attRes.data ?? [];
                setAttendanceRecords(newRecords);
            } catch (e) { console.error("Error refreshing attendance:", e); }

            setIsAttendanceModalOpen(false);
            setEditingAttendanceId(null);
            setAttendanceForm({ student: '', status: 'PRESENT', remark: '', date: new Date().toISOString().split('T')[0] });
        } catch (err: any) { toastError(err.message || 'Failed to log attendance'); }
        finally { setIsSubmitting(false); }
    };

    const handleSyllabusSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingSyllabusId) {
                await academicsAPI.syllabus.update(editingSyllabusId, syllabusForm);
                success('Syllabus updated');
            } else {
                await academicsAPI.syllabus.create(syllabusForm);
                success('Syllabus recorded');
            }
            loadAllAcademicData();
            setIsSyllabusModalOpen(false);
            setEditingSyllabusId(null);
            setSyllabusForm({ subject: '', class_grade: '', coverage_percentage: 0 });
        } catch (err: any) { toastError(err.message || 'Failed to save syllabus data'); }
        finally { setIsSubmitting(false); }
    };

    const handleClassSubmit = async (e: React.FormEvent | React.MouseEvent) => {
        e.preventDefault();
        if (!classForm.name) { toastError("Class Level (e.g. Form 4) is required."); return; }
        if (!classForm.stream) { toastError("Stream (e.g. North) is required."); return; }

        setIsSubmitting(true);
        try {
            const payload = {
                ...classForm,
                year: parseInt(classForm.year.toString()) || new Date().getFullYear(),
                capacity: parseInt(classForm.capacity.toString()) || 40,
                class_teacher: classForm.class_teacher ? parseInt(classForm.class_teacher) : null
            };

            if (editingClassId) {
                await academicsAPI.classes.update(editingClassId, payload);
                success('Class unit updated successfully!');
            } else {
                await academicsAPI.classes.create(payload);
                success('Class unit created successfully!');
            }
            loadAllAcademicData();
            setIsClassModalOpen(false);
            setEditingClassId(null);
            setClassForm({ name: '', stream: '', year: activeYear, class_teacher: '', capacity: 40 });
        } catch (err: any) {
            toastError(err.message || 'Failed to save class.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditClass = (c: any) => {
        setClassForm({
            name: c.name,
            stream: c.stream,
            year: c.year,
            class_teacher: c.class_teacher ? c.class_teacher.toString() : '',
            capacity: c.capacity
        });
        setEditingClassId(c.id);
        setIsClassModalOpen(true);
    };


    const handleExamSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingExamId) {
                await academicsAPI.exams.update(editingExamId, examForm);
                success('Exam details updated.');
            } else {
                await academicsAPI.exams.create(examForm);
                success('Exam scheduled.');
            }
            loadAllAcademicData();
            setIsExamModalOpen(false);
            setEditingExamId(null);
            setExamForm({ name: '', exam_type: 'END_TERM', term: '', grade_system: '', weighting: 100, date_started: '', is_active: true });
        } catch (err: any) { toastError(err.message || 'Failed to save exam'); }
        finally { setIsSubmitting(false); }
    };

    const openCreateExam = () => {
        const defaultSystem = gradeSystems.find(s => s.is_default);
        setExamForm({
            name: '',
            exam_type: 'END_TERM',
            term: terms.find(t => t.is_active)?.id?.toString() || '',
            grade_system: defaultSystem ? defaultSystem.id.toString() : '',
            weighting: 100,
            date_started: new Date().toISOString().split('T')[0],
            is_active: true
        });
        setEditingExamId(null);
        setIsExamModalOpen(true);
    };

    const openEditExam = (e: any) => {
        setExamForm({
            name: e.name,
            exam_type: e.exam_type,
            term: e.term?.toString() || e.term_id?.toString() || '',
            grade_system: e.grade_system?.toString() || '',
            weighting: e.weighting,
            date_started: e.date_started,
            is_active: e.is_active
        });
        setEditingExamId(e.id);
        setIsExamModalOpen(true);
    };

    // --- New Features: Class View & Results Entry ---

    const openViewClass = (cls: any) => {
        setSelectedClass(cls);
        // Filter students belonging to this class (assuming student.current_class is the ID)
        setViewClassStudents(students.filter(s => s.current_class === cls.id));
        setIsViewClassModalOpen(true);
    };



    const openEnterResults = (exam: any) => {
        // Only clear if opening a DIFFERENT exam
        if (selectedExam?.id !== exam.id) {
            setResultContext({ classId: '', subjectId: '', level: '' });
            setStudentScores({});
        }
        setSelectedExam(exam);
        setIsResultModalOpen(true);
    };

    const handleDeleteSingleResult = async (studentId: number, subjectId: number, resultId: number) => {
        if (!window.confirm('Delete this result? This cannot be undone.')) return;
        try {
            await academicsAPI.results.delete(resultId);
            // Remove from local state
            setStudentScores((prev: any) => {
                const next = { ...prev };
                if (next[studentId]?.[subjectId]) {
                    delete next[studentId][subjectId];
                }
                return next;
            });
            success('Result deleted');
        } catch (err: any) {
            toastError(err.message || 'Failed to delete result');
        }
    };


    const openViewResults = async (exam: any) => {
        setSelectedExam(exam);
        setIsViewResultsModalOpen(true);
        setLoading(true);
        try {
            const res = await academicsAPI.results.getAll({ exam_id: exam.id });
            const rawResults = res.data?.results ?? res.data ?? [];
            const enriched = rawResults.map((r: any) => {
                const s = students.find((st: any) => st.id === r.student);
                const cls = classes.find((c: any) => c.id === s?.current_class);
                return {
                    ...r,
                    student_name: s?.full_name || 'Unknown',
                    admission_number: s?.admission_number || 'N/A',
                    class_name: cls?.name || 'Unassigned',
                    class_stream: cls?.stream || 'General',
                    form_level: cls?.name || 'Unknown'
                };
            });
            setExamResults(enriched);
        } catch (err: any) {
            toastError(err.message || "Failed to load results");
        } finally {
            setLoading(false);
        }
    };

    const getGroupedAndRankedResults = () => {
        // 1. Sort by Score Descending
        const sorted = [...examResults].sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

        // 2. Group
        const groups: { [key: string]: any[] } = {};

        sorted.forEach(res => {
            let key = '';
            if (viewResultsGroupBy === 'STREAM') {
                key = `${res.class_name} ${res.class_stream}`;
            } else {
                key = `${res.class_name} (Combined)`;
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(res);
        });

        return groups;
    };

    const groupedResults = getGroupedAndRankedResults();

    const handleDeleteExam = (id: number) => setDeleteConfirm({ isOpen: true, type: 'EXAM', id });
    const handleDeleteTerm = (id: number) => setDeleteConfirm({ isOpen: true, type: 'TERM', id });
    const handleDeleteGradeSystem = (id: number) => setDeleteConfirm({ isOpen: true, type: 'POLICY', id });

    const handleSetActiveTerm = async (term: any) => {
        const newStatus = !term.is_active;
        if (!await confirm(`Are you sure you want to ${newStatus ? 'ACTIVATE' : 'DEACTIVATE'} ${term.name}?`)) return;

        const yearId = typeof term.year === 'object' && term.year ? term.year.id : term.year;
        const payload = { ...term, year: yearId, is_active: newStatus };

        try {
            await academicsAPI.terms.update(term.id, payload);
            success(`Term ${term.name} is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}`);
            setTerms(prev => prev.map(t => t.id === term.id ? { ...t, is_active: newStatus } : t));
            setTimeout(() => loadAllAcademicData(), 500);
        } catch (err: any) {
            toastError(err.message || 'Failed to update term status');
        }
    };

    const handleGradeSystemSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingSystemId) {
                await academicsAPI.gradeSystems.update(editingSystemId, gradeForm);
                success('Grading system updated');
            } else {
                await academicsAPI.gradeSystems.create(gradeForm);
                success('Grading system created');
            }
            loadAllAcademicData();
            setIsGradeModalOpen(false);
            setEditingSystemId(null);
            setGradeForm({ name: '', is_default: false });
        } catch (err: any) { toastError(err.message || 'Failed to save grading system'); }
        finally { setIsSubmitting(false); }
    };

    const handleBoundarySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingBoundaryId) {
                await academicsAPI.gradeBoundaries.update(editingBoundaryId, boundaryForm);
                success('Boundary updated');
            } else {
                await academicsAPI.gradeBoundaries.create(boundaryForm);
                success('Boundary added');
            }
            loadAllAcademicData();
            setIsBoundaryModalOpen(false);
            setEditingBoundaryId(null);
            setBoundaryForm({ system: selectedSystem?.id || '', grade: '', min_score: 0, max_score: 100, points: 0, remarks: '' });
        } catch (err: any) { toastError(err.message || 'Failed to save boundary'); }
        finally { setIsSubmitting(false); }
    };

    const handleDeleteBoundary = async (id: number) => {
        if (await confirm('Delete this grade boundary?', { type: 'danger' })) {
            try {
                await academicsAPI.gradeBoundaries.delete(id);
                success('Boundary removed');
                loadAllAcademicData();
            } catch (err: any) { toastError(err.message || 'Failed to remove boundary'); }
        }
    };

    const executeDelete = async () => {
        if (!deleteConfirm.id) return;
        setIsSubmitting(true);
        try {
            if (deleteConfirm.type === 'EXAM') {
                await academicsAPI.exams.delete(deleteConfirm.id);
                success('Exam deleted');
            } else if (deleteConfirm.type === 'TERM') {
                await academicsAPI.terms.delete(deleteConfirm.id);
                success('Term deleted');
            } else if (deleteConfirm.type === 'POLICY') {
                await academicsAPI.gradeSystems.delete(deleteConfirm.id);
                success('Grading policy removed');
            }
            loadAllAcademicData();
            setDeleteConfirm({ isOpen: false, type: null, id: null });
        } catch (err: any) {
            toastError(err.message || 'Delete failed');
            setDeleteConfirm({ isOpen: false, type: null, id: null });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkResultSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const promises: any[] = [];
            Object.entries(studentScores).forEach(([studentId, subs]: any) => {
                Object.entries(subs).forEach(([subjectId, data]: any) => {
                    const score = data.score;
                    const resultId = data.id;

                    if (!score || score.trim() === '') {
                        if (resultId) {
                            promises.push((async () => {
                                await academicsAPI.results.delete(resultId);
                                return { studentId, subjectId, deleted: true };
                            })());
                        }
                        return;
                    }

                    const payload = {
                        student: parseInt(studentId),
                        exam: selectedExam.id,
                        subject: parseInt(subjectId),
                        score: parseFloat(score),
                        grade: calculateGrade(parseFloat(score), gradeSystems, selectedExam.grade_system), // Use the helper
                        recorded_by: user?.id || 1
                    };

                    promises.push((async () => {
                        let res;
                        if (resultId) res = await academicsAPI.results.update(resultId, payload);
                        else res = await academicsAPI.results.create(payload);
                        return { studentId, subjectId, id: res.data?.id || res.data?.results?.id };
                    })());
                });
            });

            const saved = await Promise.all(promises);
            // Update IDs in local state so next save is an update
            setStudentScores((prev: any) => {
                const next = { ...prev };
                saved.forEach((item: any) => {
                    if (item && item.studentId && item.subjectId) {
                        if (item.deleted && next[item.studentId]?.[item.subjectId]) {
                            // Clear the ID so a future edit does a POST instead of a PUT
                            delete next[item.studentId][item.subjectId].id;
                        } else if (item.id && next[item.studentId]?.[item.subjectId]) {
                            next[item.studentId][item.subjectId].id = item.id;
                        }
                    }
                });
                return next;
            });

            success('Results saved successfully. You can continue editing.');
            // Do NOT close modal
            // setIsResultModalOpen(false); 
            // Do NOT reload all data blindly
            // loadAllAcademicData(); 
        } catch (err: any) {
            toastError(err.message || 'Failed to save some results');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExportAcademics = () => {
        setIsExporting(true);
        try {
            let dataToExport: any[] = [];
            let fileName = 'Academics_Report';

            if (activeTab === 'ATTENDANCE') {
                dataToExport = attendanceRecords.map(att => {
                    const student = students.find(s => s.id === att.student);
                    const cls = classes.find(c => c.id === student?.current_class);
                    return {
                        date: att.date,
                        student_name: student?.full_name,
                        admission: student?.admission_number,
                        class: cls ? `${cls.name} ${cls.stream}` : 'N/A',
                        status: att.status,
                        remark: att.remark
                    };
                });
                fileName = `Attendance_Report`;
            } else if (activeTab === 'CLASSES') {
                dataToExport = classes.map(c => ({
                    name: c.name,
                    stream: c.stream,
                    teacher: c.class_teacher_name,
                    students: c.student_count,
                    capacity: c.capacity
                }));
                fileName = `Classes_Report`;
            }

            if (dataToExport.length === 0) {
                warning("No data available to export for this view.");
                return;
            }

            exportToCSV(dataToExport, fileName);
        } catch (err: any) {
            toastError(err.message || "Failed to export report.");
        } finally {
            setIsExporting(false);
        }
    };


    if (loading) return <div className="flex items-center justify-center p-12 spinner-container"><div className="spinner"></div></div>;

    const activeYear = academicYears.find((y: any) => y.is_active)?.name || 'NO ACTIVE YEAR';
    const activeTerm = terms.find((t: any) => t.is_active)?.name || 'NO ACTIVE TERM';

    staff.map(s => ({ id: s.user || s.id, label: s.full_name || s.username, subLabel: `ID: ${s.employee_id}` }));
    const studentOptions = students.map(s => ({ id: s.id, label: s.full_name, subLabel: `ADM: ${s.admission_number}` }));

    return (
        <div className="fade-in max-w-full">
            {/* Elegant Header - Pushed from Dashboard Style */}
            <div className="relative overflow-hidden rounded-3xl bg-primary text-white p-6 lg:p-8 mb-8 shadow-2xl no-print">
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen size={16} className="text-info-light" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Institutional Academics Module</span>
                        </div>
                        <h1 className="text-3xl font-black mb-1 capitalize text-white">Academic Records</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                                <Calendar size={12} className="text-info-light" />
                                <span className="text-[10px] font-bold uppercase">{activeYear} • {activeTerm}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        {isReadOnly && (
                            <Button variant="primary" size="sm" className="bg-white text-primary hover:bg-slate-100 border-none font-black px-6" onClick={() => { setIsAttendanceModalOpen(true); }} icon={<CheckCircle2 size={14} />}>
                                Log Attendance
                            </Button>
                        )}
                    </div>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Award size={160} />
                </div>
            </div>

            {/* Navigation Tabs - Consolidated */}
            <div className="tabs flex-nowrap overflow-x-auto no-scrollbar pb-1 mb-10 grid grid-cols-4 md:flex md:flex-row gap-2 md:overflow-x-auto p-1.5 bg-bg-tertiary rounded-2xl no-print">
                {(['SUMMARY', 'CLASSES', 'CURRICULUM', 'ALLOCATION', 'EXAMS', 'ATTENDANCE', 'RESOURCES', 'GRADING'] as const)
                    .filter(tab => !isReadOnly || ['SUMMARY', 'CURRICULUM', 'EXAMS', 'ATTENDANCE'].includes(tab))
                    .map(tab => (
                        <button
                            key={tab}
                            className={`px-2 md:px-8 py-3 rounded-xl text-[10px] md:text-sm font-bold transition-all whitespace-nowrap overflow-hidden text-ellipsis ${activeTab === tab
                                ? 'bg-bg-primary text-primary shadow-md'
                                : 'text-text-secondary hover:text-primary hover:bg-bg-primary/60'
                                }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0) + tab.slice(1).toLowerCase()}
                        </button>
                    ))}
            </div>

            {/* Content per Tab */}
            {activeTab !== 'SUMMARY' && activeTab !== 'ALLOCATION' && (
                <div className="mb-4 no-print flex justify-end">
                    <input
                        type="text"
                        placeholder={`Search ${activeTab.toLowerCase()}...`}
                        className="input input-sm w-64 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {activeTab === 'SUMMARY' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div className="transform hover:-translate-y-1 transition-all">
                            <StatCard
                                title="Total Capacity"
                                value={classes.length > 0 ? `${classes.reduce((sum, c) => sum + (c.student_count || 0), 0)}/${classes.reduce((sum, c) => sum + (c.capacity || 40), 0)}` : "No Data"}
                                icon={<Users size={18} />}
                                gradient="linear-gradient(135deg, #0f172a, #334155)"
                            />
                        </div>
                        <div className="transform hover:-translate-y-1 transition-all">
                            <StatCard title="Departments" value={subjectGroups.length > 0 ? subjectGroups.length.toString() : "No Data"} icon={<Layers size={18} />} gradient="linear-gradient(135deg, #1e3c72, #2a5298)" />
                        </div>
                        <div className="transform hover:-translate-y-1 transition-all">
                            <StatCard title="Upcoming Exams" value={exams.length > 0 ? exams.filter(e => e.is_active || (e.date_started && new Date(e.date_started) > new Date())).length.toString() : "No Data"} icon={<Calendar size={18} />} gradient="linear-gradient(135deg, #f093fb, #f5576c)" />
                        </div>
                        <div className="transform hover:-translate-y-1 transition-all">
                            <StatCard title="Overall Mean" value={meanGrade === '...' ? 'Calculating' : (meanGrade || "N/A")} icon={<BarChart3 size={18} />} gradient="linear-gradient(135deg, #5ee7df, #b490ca)" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                        <div className="card">
                            <div className="card-header flex justify-between items-center py-2">
                                <h3 className="mb-0 text-xs font-black uppercase">Exams Overview</h3>
                                <Button variant="ghost" size="sm" onClick={() => setActiveTab('EXAMS')}>View All</Button>
                            </div>
                            <div className="p-4 space-y-3">
                                {exams.slice(0, 3).map(e => (
                                    <div key={e.id} className="flex items-center justify-between border-bottom pb-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors" onClick={() => { setActiveTab('EXAMS'); setTimeout(() => openViewResults(e), 100); }}>
                                        <div className="flex items-center gap-md">
                                            <div className="p-2 rounded bg-warning-light text-warning"><Calendar size={12} /></div>
                                            <div>
                                                <p className="font-bold text-[11px] mb-0 text-slate-900">{e.name}</p>
                                                <p className="text-[9px] text-secondary mb-0">{e.term_name || 'Active Term'}</p>
                                                <p className="text-[8px] text-secondary font-mono bg-slate-100 inline-block px-1 rounded mt-0.5">{e.date_started ? new Date(e.date_started + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'}{e.date_ended ? ` – ${new Date(e.date_ended + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}</p>
                                            </div>
                                        </div>
                                        <span className={`badge ${e.is_active ? 'badge-success' : 'badge-error'} badge-xxs`}>{e.is_active ? 'OPEN' : 'CLOSED'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header flex justify-between items-center py-2">
                                <h3 className="mb-0 text-xs font-black uppercase">Syllabus Completion</h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsSyllabusModalOpen(true)} icon={<Edit size={12} />} />
                                    <BarChart3 size={14} className="text-secondary" />
                                </div>
                            </div>
                            <div className="p-6 space-y-4 max-h-60 overflow-y-auto">
                                {syllabusData.length === 0 && <p className="text-xs text-secondary text-center italic">No syllabus data tracked yet.</p>}
                                {syllabusData.map(s => (
                                    <div key={s.id} className="cursor-pointer" onClick={() => { setSyllabusForm({ subject: s.subject.toString(), class_grade: s.class_grade.toString(), coverage_percentage: s.coverage_percentage }); setEditingSyllabusId(s.id); setIsSyllabusModalOpen(true); }}>
                                        <div className="flex justify-between text-[10px] font-black mb-1 uppercase">
                                            <span>{s.subject_name} ({s.class_name})</span>
                                            <span>{s.coverage_percentage}%</span>
                                        </div>
                                        <div className="w-full bg-secondary-light h-1 rounded-full">
                                            <div className={`progress-fill ${s.coverage_percentage > 80 ? 'bg-success' : s.coverage_percentage > 50 ? 'bg-primary' : 'bg-error'}`} style={{ width: `${s.coverage_percentage}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {activeTab === 'CLASSES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                    {classes.filter(cls =>
                        !searchTerm ||
                        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        cls.stream.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(cls => (
                        <div key={cls.id} className="card hover-bg-secondary transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 rounded-lg bg-primary-light text-white"><School size={16} /></div>
                                <span className="badge badge-info badge-xs">CAP: {cls.capacity}</span>
                            </div>
                            <h3 className="mb-1 text-sm font-black">{cls.name} <span className="text-secondary">{cls.stream}</span></h3>
                            <p className="text-[10px] font-bold text-secondary mb-4 flex items-center gap-1 uppercase"><Users size={10} /> {cls.student_count} Students</p>
                            <div className="flex justify-between items-center pt-2 border-top">
                                <span className="text-[10px] font-black text-secondary uppercase">{cls.class_teacher_name || 'Unassigned TR'}</span>
                                <div className="flex gap-1">
                                    <Button variant="outline" size="sm" onClick={() => openEditClass(cls)} title="Edit Class Details" icon={<Edit size={10} />} />
                                    <Button variant="ghost" size="sm" className="text-primary" onClick={() => openViewClass(cls)} title="View Students in Class" icon={<Users size={10} />} />
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="card border-dashed flex flex-col items-center justify-center p-8 cursor-pointer hover:border-primary group" onClick={() => setIsClassModalOpen(true)}>
                        <Plus size={32} className="text-secondary group-hover:text-primary transition-all mb-2" />
                        <span className="text-xs font-black uppercase text-secondary">Add Class Unit</span>
                    </div>
                </div>
            )}

            {activeTab === 'CURRICULUM' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-lg overflow-hidden">
                    <div className="md:col-span-1 space-y-4 min-w-0">
                        <div className="card">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-[10px] font-black uppercase text-secondary mb-0">Subject Groups</h4>
                                <Button variant="outline" size="sm" onClick={() => { setEditingGroupId(null); setGroupForm({ name: '' }); setIsGroupModalOpen(true); }} icon={<Plus size={10} />} />
                            </div>
                            <div className="space-y-1.5">
                                {subjectGroups.map(g => (
                                    <div key={g.id} className="flex justify-between items-center p-2 rounded hover:bg-secondary-light text-[11px] font-bold border border-transparent hover:border-secondary transition-all group">
                                        <span>{g.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-primary hover:bg-white rounded p-0.5" onClick={() => openEditGroup(g)} title="Edit"><Edit size={10} /></button>
                                            <button className="text-error hover:bg-white rounded p-0.5" onClick={() => handleDeleteGroup(g.id)} title="Delete"><Trash2 size={10} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-3 overflow-hidden shadow-lg border rounded-2xl min-w-0">
                        <div className="p-3 bg-secondary-light flex justify-between items-center border-bottom">
                            <h3 className="mb-0 text-xs font-black uppercase">Institutional Curriculum</h3>
                            {/* ... buttons ... */}
                            <button className="btn btn-primary btn-xs ml-auto-mobile" onClick={() => setIsSubjectModalOpen(true)}><Plus size={12} /> New Subject</button>
                        </div>
                        <div className="overflow-x-auto w-full">
                            <table className="table min-w-[800px] relative">

                                <thead className="sticky top-0 bg-white z-10 shadow-sm text-[10px] uppercase">
                                    <tr>
                                        <th className="min-w-[150px]">Subject Name</th>
                                        <th className="min-w-[100px]">Code</th>
                                        <th className="min-w-[150px]">Subject Group</th>
                                        <th className="min-w-[100px]">Type</th>
                                        <th className="min-w-[100px] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {subjects.map((s: any) => (
                                        <tr key={s.id} className="hover:bg-blue-50/50 text-xs border-b transition-colors group">
                                            <td className="font-bold">{s.name}</td>
                                            <td className="font-mono text-[10px]">{s.code}</td>
                                            <td>{s.group_name || '-'}</td>
                                            <td><span className={`badge badge-sm font-bold ${s.is_core ? 'badge-primary text-white' : 'badge-ghost text-secondary'}`}>{s.is_core ? 'CORE' : 'ELECTIVE'}</span></td>
                                            <td className="text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="text-primary hover:bg-white p-1 shadow-sm border border-transparent hover:border-primary/20" onClick={() => openEditSubject(s)} title="Edit Subject"><Edit size={12} /></Button>
                                                    <Button variant="ghost" size="sm" className="text-error hover:bg-white p-1 shadow-sm border border-transparent hover:border-error/20" onClick={() => handleDeleteSubject(s.id)} title="Delete Subject"><Trash2 size={12} /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {subjects.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center p-8 text-secondary italic">No subjects added. Select "New Subject" to manage the curriculum.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Merged Syllabus Tracking */}
                    <div className="md:col-span-4 space-y-6 md:space-y-8 fade-in mt-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-black text-primary uppercase">Syllabus Tracking</h2>
                            {!isReadOnly && (
                                <button className="btn btn-sm btn-primary font-black shadow-md w-full md:w-auto" onClick={() => { setEditingSyllabusId(null); setIsSyllabusModalOpen(true); }}><Plus size={16} /> Record Coverage</button>
                            )}
                        </div>

                        <div className="overflow-hidden shadow-lg border rounded-2xl">
                            <div className="p-4 bg-secondary-light border-bottom flex justify-between items-center">
                                <h3 className="mb-0 text-xs font-black uppercase tracking-wider">Curriculum Progress</h3>
                            </div>
                            <div className="table-wrapper">
                                <table className="table table-sm min-w-[800px] relative">
                                    <thead className="bg-secondary-light/30 text-secondary">
                                        <tr>
                                            <th className="min-w-[150px]">Subject</th>
                                            <th className="min-w-[120px]">Class / Stream</th>
                                            <th className="min-w-[80px]">Coverage</th>
                                            <th className="min-w-[200px]">Progress</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {syllabusData.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center p-8 text-secondary text-xs uppercase font-bold italic">No syllabus records found</td>
                                            </tr>
                                        ) : (
                                            syllabusData.map((s: any) => {
                                                const cls = classes.find((c: any) => c.id === s.class_grade);
                                                const sub = subjects.find((sub: any) => sub.id === s.subject);
                                                return (
                                                    <tr key={s.id} className="hover:bg-blue-50/50 transition-colors">
                                                        <td className="font-bold text-xs">{sub?.name || 'Unknown'}</td>
                                                        <td className="text-xs text-secondary-dark font-medium">{cls ? `${cls.name} ${cls.stream}` : 'Unknown'}</td>
                                                        <td className="font-mono text-xs text-primary font-black">{s.coverage_percentage}%</td>
                                                        <td>
                                                            <progress className={`progress w-full h-2 ${s.coverage_percentage > 80 ? 'progress-success' : s.coverage_percentage > 40 ? 'progress-warning' : 'progress-error'}`} value={s.coverage_percentage} max="100"></progress>
                                                        </td>
                                                        <td className="text-right">
                                                            {!isReadOnly && (
                                                                <div className="flex justify-end gap-1">
                                                                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10" onClick={() => {
                                                                        setSyllabusForm({
                                                                            subject: s.subject.toString(),
                                                                            class_grade: s.class_grade.toString(),
                                                                            coverage_percentage: s.coverage_percentage
                                                                        });
                                                                        setEditingSyllabusId(s.id);
                                                                        setIsSyllabusModalOpen(true);
                                                                    }} icon={<Edit size={12} />} />
                                                                    <Button variant="ghost" size="sm" className="text-error hover:bg-error/10" onClick={async () => {
                                                                        if (await confirm('Delete this syllabus record?', { type: 'danger' })) {
                                                                            try {
                                                                                await academicsAPI.syllabus.delete(s.id);
                                                                                loadAllAcademicData();
                                                                                success('Syllabus record deleted');
                                                                            } catch (err: any) { toastError(err.message || 'Failed to delete record'); }
                                                                        }
                                                                    }} icon={<Trash2 size={12} />} />
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div >
            )}


            {
                activeTab === 'ALLOCATION' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-lg h-[calc(100vh-200px)]">
                        <div className="md:col-span-1 border-right pr-4">
                            <h3 className="text-xs font-black uppercase mb-4">Select Class</h3>
                            <div className="space-y-2">
                                {classes.map(c => (
                                    <div
                                        key={c.id}
                                        className={`p-3 rounded-lg cursor-pointer border hover:border-primary transition-all ${selectedAllocationClass === c.id.toString() ? 'bg-primary-light border-primary' : 'bg-white'}`}
                                        onClick={() => { setSelectedAllocationClass(c.id.toString()); fetchClassAllocations(c.id.toString()); }}
                                    >
                                        <div className="font-bold text-xs">{c.name} {c.stream}</div>
                                        <div className="text-[10px] text-secondary">{c.student_count} Students</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-3 min-w-0">
                            {selectedAllocationClass ? (
                                <div className="card h-full flex flex-col min-w-0">
                                    <div className="card-header flex justify-between items-center py-3 border-bottom">
                                        <div>
                                            <h3 className="mb-0 text-sm font-black uppercase">Class Subjects</h3>
                                            <p className="text-[10px] text-secondary">Manage subjects taught in this class</p>
                                        </div>
                                        <Button variant="primary" size="sm" onClick={syncClassSubjects} loading={isSyncing} loadingText="Syncing...">
                                            Sync to Students
                                        </Button>
                                    </div>
                                    <div className="p-0 table-wrapper overflow-y-auto flex-1">
                                        <table className="table table-striped min-w-[600px]">
                                            <thead>
                                                <tr>
                                                    <th className="w-10">Active</th>
                                                    <th>Subject Name</th>
                                                    <th>Code</th>
                                                    <th>Group</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {subjects.map(subject => {
                                                    const allocation = classAllocations.find(a => a.subject === subject.id);
                                                    const isAllocated = !!allocation;
                                                    return (
                                                        <tr key={subject.id} className={isAllocated ? 'bg-green-50' : ''}>
                                                            <td>
                                                                <input
                                                                    type="checkbox"
                                                                    className="checkbox checkbox-sm checkbox-primary"
                                                                    checked={isAllocated}
                                                                    onChange={() => toggleClassSubject(subject.id, allocation?.id)}
                                                                />
                                                            </td>
                                                            <td className="font-bold text-xs">{subject.name}</td>
                                                            <td><code>{subject.code}</code></td>
                                                            <td className="text-[10px] uppercase text-secondary">{subject.group_name || '-'}</td>
                                                            <td>
                                                                {isAllocated ?
                                                                    <span className="badge badge-success text-[9px]">Allocated</span> :
                                                                    <span className="badge badge-ghost text-[9px]">Available</span>
                                                                }
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-secondary opacity-50">
                                    <Layers size={48} className="mb-4" />
                                    <p className="font-bold">Select a class to manage allocations</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {
                activeTab === 'GRADING' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-lg h-[calc(100vh-200px)]">
                        {/* Left: Systems List */}
                        <div className="card md:col-span-1 flex flex-col">
                            <div className="card-header flex justify-between items-center py-3 border-bottom">
                                <h3 className="mb-0 text-sm font-black uppercase">Grading Systems</h3>
                                <Button variant="primary" size="sm" onClick={() => setIsGradeModalOpen(true)} icon={<Plus size={12} />}>New System</Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {gradeSystems.map(sys => (
                                    <div
                                        key={sys.id}
                                        onClick={() => { setSelectedSystem(sys); setBoundaryForm({ ...boundaryForm, system: sys.id }); }}
                                        className={`p-3 rounded border cursor-pointer transition-all hover:shadow-md ${selectedSystem?.id === sys.id ? 'bg-primary-light border-primary' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-xs">{sys.name}</span>
                                            {sys.is_default && <span className="badge badge-success text-[8px]">DEFAULT</span>}
                                        </div>
                                        <div className="text-[10px] text-secondary mt-1">{sys.boundaries?.length || 0} Grade Boundaries</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Boundaries Table */}
                        <div className="card md:col-span-2 flex flex-col">
                            {selectedSystem ? (
                                <>
                                    <div className="card-header flex justify-between items-center py-3 border-bottom bg-gray-50">
                                        <div>
                                            <h3 className="mb-0 text-sm font-black uppercase">{selectedSystem.name}</h3>
                                            <p className="text-[10px] text-secondary mb-0">Define grade ranges (High to Low)</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => { setBoundaryForm({ system: selectedSystem.id, grade: '', min_score: 0, max_score: 100, points: 0, remarks: '' }); setEditingBoundaryId(null); setIsBoundaryModalOpen(true); }} icon={<Plus size={12} />}>
                                            Add Boundary
                                        </Button>
                                    </div>
                                    <div className="flex-1 table-wrapper p-0 w-full min-w-0">
                                        <table className="table table-sm min-w-[600px]">
                                            <thead className="sticky top-0 bg-white z-10 shadow-sm text-[10px] uppercase">
                                                <tr>
                                                    <th>Grade</th>
                                                    <th>Range (Min-Max)</th>
                                                    <th>Points</th>
                                                    <th>Remarks</th>
                                                    <th className="text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedSystem.boundaries?.sort((a: any, b: any) => b.min_score - a.min_score).map((b: any) => (
                                                    <tr key={b.id} className="hover:bg-gray-50 text-xs">
                                                        <td className="font-black">{b.grade}</td>
                                                        <td>{b.min_score} - {b.max_score}</td>
                                                        <td>{b.points}</td>
                                                        <td className="text-secondary">{b.remarks}</td>
                                                        <td className="text-right flex justify-end gap-1">
                                                            <Button variant="ghost" size="sm" className="p-1" onClick={() => { setBoundaryForm({ ...b, system: selectedSystem.id }); setEditingBoundaryId(b.id); setIsBoundaryModalOpen(true); }} icon={<Edit size={12} />} />
                                                            <Button variant="ghost" size="sm" className="p-1 text-error" onClick={() => handleDeleteBoundary(b.id)} icon={<Trash2 size={12} />} />
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!selectedSystem.boundaries || selectedSystem.boundaries.length === 0) && (
                                                    <tr><td colSpan={5} className="text-center p-8 text-secondary italic">No boundaries defined yet.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-secondary opacity-50">
                                    <Layers size={48} className="mb-2" />
                                    <p className="text-sm font-bold">Select a Grading System to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {
                activeTab === 'EXAMS' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                            {exams.filter(exam =>
                                !searchTerm ||
                                exam.name.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map(exam => (
                                <div key={exam.id} className="card">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 rounded-lg bg-warning-light text-warning"><ClipboardCheck size={16} /></div>
                                        <span className={`badge ${exam.is_active ? 'badge-success' : 'badge-error'} badge-xs`}>{exam.is_active ? 'ACTIVE' : 'LOCKED'}</span>
                                    </div>
                                    <h3 className="mb-1 text-sm font-black">{exam.name}</h3>
                                    <p className="text-[10px] font-bold text-secondary mb-3 uppercase">Wt: {exam.weighting}% | {exam.term_name || 'Term 1'}</p>
                                    <div className="flex gap-1.5">
                                        <Button variant="primary" size="sm" className="w-full shadow-sm" onClick={() => openEnterResults(exam)} title="Enter student marks">ENTER RESULTS</Button>
                                        <Button variant="outline" size="sm" onClick={() => openViewResults(exam)} title="View Ranking" icon={<Trophy size={12} />} />
                                        <Button variant="outline" size="sm" onClick={() => openEditExam(exam)} title="Exam Settings" icon={<Settings size={12} />} />
                                        <Button variant="outline" size="sm" className="text-error" onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id); }} title="Delete Exam" icon={<Trash2 size={14} />} />
                                    </div>
                                </div>
                            ))}
                            {/* Schedule Exam card */}
                            {!isReadOnly && (
                                <div className="card border-dashed flex flex-col items-center justify-center p-8 cursor-pointer hover:border-warning group" onClick={openCreateExam}>
                                    <Calendar size={28} className="text-secondary group-hover:text-warning transition-all mb-2" />
                                    <span className="text-xs font-black uppercase text-secondary">Schedule Exam</span>
                                </div>
                            )}
                            {/* Sync Grades card */}
                            {!isReadOnly && (
                                <div className="card border-dashed flex flex-col items-center justify-center p-8 cursor-pointer hover:border-success group" onClick={async () => {
                                    if (!window.confirm('Re-calculate ALL exam grades using the default KNEC grading boundaries?\n\nThis will update grades for all results.')) return;
                                    try {
                                        const res = await academicsAPI.results.syncGrades();
                                        success(`✓ ${res.data.message || 'Grades synced successfully!'}`);
                                        loadAllAcademicData();
                                    } catch (err: any) { toastError(err.message || 'Sync failed'); }
                                }}>
                                    <CheckCircle2 size={28} className="text-secondary group-hover:text-success transition-all mb-2" />
                                    <span className="text-xs font-black uppercase text-secondary text-center">Sync Grades<br />(KNEC)</span>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* View Results Modal */}
            <Modal isOpen={isViewResultsModalOpen} onClose={() => setIsViewResultsModalOpen(false)} title="Examination Results &amp; Ranking" size="lg">
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-secondary-light p-3 rounded">
                        <div>
                            <h3 className="font-black text-sm uppercase text-primary">{selectedExam?.name}</h3>
                            <p className="text-xs text-secondary mb-0">Performance Overview</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="no-print mr-4 text-primary border-primary hover:bg-primary-light" onClick={() => window.print()} title="Print Term Reports" icon={<Printer size={14} />}>
                                Print
                            </Button>
                            <span className="text-[10px] font-bold uppercase text-secondary">Group By:</span>
                            <div className="join">
                                <button className={`btn btn-xs join-item ${viewResultsGroupBy === 'STREAM' ? 'btn-active btn-primary' : ''}`} onClick={() => setViewResultsGroupBy('STREAM')}>Stream</button>
                                <button className={`btn btn-xs join-item ${viewResultsGroupBy === 'ENTIRE_CLASS' ? 'btn-active btn-primary' : ''}`} onClick={() => setViewResultsGroupBy('ENTIRE_CLASS')}>Entire Class</button>
                            </div>
                        </div>
                    </div>

                    <div className="max-h-[60vh] table-wrapper overflow-x-auto min-w-0">
                        {Object.keys(groupedResults).sort().map(groupKey => (
                            <div key={groupKey} className="mb-6">
                                <div className="flex items-center gap-2 mb-2 pb-1 border-bottom">
                                    <h4 className="text-xs font-black uppercase text-secondary">{groupKey}</h4>
                                    <span className="badge badge-sm badge-ghost">{groupedResults[groupKey].length} Candidates</span>
                                </div>
                                <table className="table table-xs min-w-[800px]">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th className="min-w-[150px]">Student Name</th>
                                            <th>Admission</th>
                                            {subjects.filter((sub: any) => groupedResults[groupKey].some((r: any) => r.scores && r.scores[sub.id])).map((sub: any) => (
                                                <th key={sub.id} className="text-center">{sub.code || sub.name}</th>
                                            ))}
                                            <th className="text-right">Total Score</th>
                                            <th className="text-right">Mean</th>
                                            <th className="text-center">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedResults[groupKey].sort((a: any, b: any) => b.totalScore - a.totalScore).map((res: any, index: number) => (
                                            <tr key={res.student} className={index < 3 ? 'bg-warning-light/20' : ''}>
                                                <td className="font-bold">{index + 1}</td>
                                                <td className="whitespace-nowrap font-bold text-xs">{res.student_name}</td>
                                                <td className="font-mono text-[10px]">{res.admission_number}</td>
                                                {subjects.filter((sub: any) => groupedResults[groupKey].some((r: any) => r.scores && r.scores[sub.id])).map((sub: any) => (
                                                    <td key={sub.id} className="text-center text-xs font-mono">
                                                        {res.scores[sub.id] !== undefined ? `${res.scores[sub.id]}%` : '-'}
                                                    </td>
                                                ))}
                                                <td className="text-right font-black">{res.totalScore}</td>
                                                <td className="text-right font-bold text-primary">{res.meanScore}%</td>
                                                <td className="text-center">
                                                    <span className={`badge badge-sm ${['A', 'A-'].includes(res.meanGrade) ? 'badge-success' : ['D', 'E'].includes(res.meanGrade) ? 'badge-error' : 'badge-ghost'}`}>{res.meanGrade || '-'}</span>
                                                </td>
                                            </tr>

                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                        {Object.keys(groupedResults).length === 0 && <p className="text-center text-sm text-secondary italic py-8">No results recorded for this exam yet.</p>}
                    </div>
                </div>
            </Modal >

            {
                activeTab === 'RESOURCES' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-lg overflow-hidden">
                        <div className="overflow-hidden shadow-lg border rounded-2xl min-w-0">
                            <div className="p-3 bg-secondary-light flex justify-between items-center border-bottom">
                                <h3 className="mb-0 text-xs font-black uppercase">Grading Policies</h3>
                                <Button variant="primary" size="sm" className="ml-auto-mobile" onClick={() => setIsGradeModalOpen(true)} icon={<Plus size={12} />}>New System</Button>
                            </div>
                            <div className="p-4 space-y-4">
                                {gradeSystems.map(gs => (
                                    <div key={gs.id} className="border rounded p-3 bg-secondary-light">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-black text-[10px] uppercase">{gs.name}</span>
                                            <div className="flex gap-2 items-center justify-end-mobile">
                                                {gs.is_default && <span className="badge badge-success badge-xxs">DEFAULT</span>}
                                                <button className="text-secondary hover:text-primary transition-colors p-1" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSystem(gs);
                                                    setBoundaryForm(prev => ({ ...prev, system: gs.id }));
                                                    setIsBoundaryModalOpen(true);
                                                }} title="Add Boundary"><Plus size={14} /></button>
                                                <Button variant="ghost" size="sm" className="text-secondary hover:text-error p-1" onClick={(e) => { e.stopPropagation(); handleDeleteGradeSystem(gs.id); }} title="Delete Policy" icon={<Trash2 size={14} />} />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {gs.boundaries?.map((b: any) => (
                                                <span key={b.id} className="text-[9px] font-black bg-white px-2 py-0.5 rounded border text-secondary">
                                                    {b.grade}: {b.min_score}%
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header py-2 flex justify-between items-center">
                                <h3 className="mb-0 text-xs font-black uppercase">Academic timeline</h3>
                                <Button variant="primary" size="sm" className="ml-auto-mobile" onClick={() => setIsYearModalOpen(true)} icon={<Plus size={12} />} />
                            </div>
                            <div className="p-2 space-y-2">
                                {academicYears.map(y => (
                                    <div key={y.id} className="border rounded p-2 bg-secondary-light hover:bg-white transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${y.is_active ? 'bg-success' : 'bg-secondary'}`}></div>
                                                <span className="font-black text-[11px] uppercase">Cycle {y.name}</span>
                                            </div>
                                            {!isReadOnly && (
                                                <div className="flex gap-1 items-center justify-end-mobile">
                                                    <Button variant="ghost" size="sm" className="text-info" onClick={() => setIsTermModalOpen(true)} title="Add Term" icon={<Plus size={10} />} />
                                                    <Button variant="ghost" size="sm" onClick={() => openEditYear(y)} title="Edit Year" icon={<Edit size={10} />} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="pl-4 space-y-1">
                                            {terms.filter(t => t.year === y.id).map(t => (
                                                <div key={t.id} className="flex justify-between items-center text-[10px] bg-white p-1.5 rounded border">
                                                    <span className="font-bold flex items-center gap-1">
                                                        {t.name}
                                                        <button
                                                            className={`flex items-center gap-2 text-[9px] font-bold transition-all ${t.is_active ? 'text-success hover:text-error' : 'text-secondary hover:text-primary'}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSetActiveTerm(t);
                                                            }}
                                                            title={t.is_active ? "Click to Deactivate" : "Click to Activate"}
                                                        >
                                                            {t.is_active ? <CheckSquare size={14} /> : <Square size={14} />}
                                                            {t.is_active ? 'Active' : 'Inactive'}
                                                        </button>
                                                    </span>
                                                    {!isReadOnly && (
                                                        <Button variant="ghost" size="sm" className="text-secondary hover:text-error p-1 ml-auto-mobile" onClick={(e) => { e.stopPropagation(); handleDeleteTerm(t.id); }} title="Delete Term" icon={<Trash2 size={12} />} />
                                                    )}
                                                </div>
                                            ))}
                                            {terms.filter(t => t.year === y.id).length === 0 && <p className="text-[9px] text-secondary italic">No terms configured.</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }


            {
                activeTab === 'ATTENDANCE' && (
                    <div className="overflow-hidden shadow-lg mb-8 border rounded-2xl">
                        <div className="p-4 bg-secondary-light flex flex-col sm:flex-row justify-between items-start sm:items-center border-bottom gap-4">
                            <div className="flex items-center gap-4">
                                <h3 className="mb-0 text-xs font-black uppercase tracking-wider">Attendance Register</h3>
                                <div className="flex gap-2">
                                    <select
                                        className="select select-sm bg-white"
                                        value={attendanceSort.field}
                                        onChange={(e) => setAttendanceSort({ ...attendanceSort, field: e.target.value })}
                                    >
                                        <option value="date">Sort by Date</option>
                                        <option value="student">Sort by Student</option>
                                        <option value="class">Sort by Class</option>
                                    </select>
                                    <select
                                        className="select select-sm bg-white min-w-[140px]"
                                        value={attendanceSort.direction}
                                        onChange={(e) => setAttendanceSort({ ...attendanceSort, direction: e.target.value as 'asc' | 'desc' })}
                                    >
                                        <option value="desc">Descending (Newest/Z-A)</option>
                                        <option value="asc">Ascending (Oldest/A-Z)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-white shadow-sm" onClick={handleExportAcademics} loading={isExporting} loadingText="Exporting...">Export CSV</Button>
                                <Button variant="primary" size="sm" className="flex-1 sm:flex-none shadow-sm" onClick={() => { setEditingAttendanceId(null); setAttendanceForm({ student: '', status: 'PRESENT', remark: '', date: new Date().toISOString().split('T')[0] }); setIsAttendanceModalOpen(true); }} icon={<Plus size={14} />}>Log Status</Button>
                            </div>
                        </div>
                        <div className="overflow-x-auto w-full">
                            <table className="table table-sm min-w-full">
                                <thead className="bg-secondary-light/30 text-secondary">
                                    <tr>
                                        <th className="min-w-[100px]">Date</th>
                                        <th className="min-w-[180px]">Student</th>
                                        <th className="min-w-[120px]">Class / Section</th>
                                        <th className="min-w-[100px]">Status</th>
                                        <th className="min-w-[150px]">Remarks</th>
                                        <th className="min-w-[100px] text-right sticky right-0 bg-white/90">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceRecords.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center p-8 text-secondary italic">No attendance records found. Use "Log Status" to add entries.</td></tr>
                                    ) : (
                                        [...attendanceRecords].sort((a, b) => {
                                            let valA, valB;
                                            if (attendanceSort.field === 'date') {
                                                valA = a.date; valB = b.date;
                                            } else if (attendanceSort.field === 'student') {
                                                const sA = students.find(s => s.id === a.student);
                                                const sB = students.find(s => s.id === b.student);
                                                valA = sA?.full_name || ''; valB = sB?.full_name || '';
                                            } else {
                                                const sA = students.find(s => s.id === a.student);
                                                const sB = students.find(s => s.id === b.student);
                                                const cA = classes.find(c => c.id === sA?.current_class);
                                                const cB = classes.find(c => c.id === sB?.current_class);
                                                valA = `${cA?.name} ${cA?.stream}`; valB = `${cB?.name} ${cB?.stream}`;
                                            }
                                            return attendanceSort.direction === 'asc'
                                                ? (valA > valB ? 1 : -1)
                                                : (valA < valB ? 1 : -1);
                                        }).map((att: any) => {
                                            const student = students.find(s => s.id === att.student);
                                            const cls = classes.find(c => c.id === student?.current_class);
                                            return (
                                                <tr key={att.id} className="hover:bg-blue-50/50">
                                                    <td className="font-mono text-xs">{att.date}</td>
                                                    <td>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-xs">{student?.full_name || 'Unknown'}</span>
                                                            <span className="text-[9px] text-secondary">{student?.admission_number}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-xs">{cls?.name || 'N/A'}</span>
                                                            <span className="text-[9px] text-secondary font-black uppercase tracking-wider">{cls?.stream || 'General'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge badge-sm font-bold ${att.status === 'PRESENT' ? 'badge-success text-white' : att.status === 'ABSENT' ? 'badge-error text-white' : 'badge-warning'}`}>
                                                            {att.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-xs italic text-secondary">{att.remark || '-'}</td>
                                                    <td className="text-right flex justify-end gap-1">
                                                        {!isReadOnly && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-primary"
                                                                    onClick={() => openEditAttendance(att)}
                                                                    icon={<Edit size={12} />}
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-error"
                                                                    onClick={async () => {
                                                                        if (await confirm('Delete this attendance record?', { type: 'danger' })) {
                                                                            try {
                                                                                await academicsAPI.attendance.delete(att.id);
                                                                                loadAllAcademicData();
                                                                                success('Attendance record deleted');
                                                                            } catch (err: any) { toastError(err.message || 'Failed to delete record'); }
                                                                        }
                                                                    }}
                                                                    icon={<Trash2 size={12} />}
                                                                />
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        }))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* Modals */}
            <Modal isOpen={isYearModalOpen} onClose={() => setIsYearModalOpen(false)} title="Add Academic Cycle">
                <form onSubmit={handleYearSubmit} className="space-y-4 form-container-sm mx-auto">
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Year Name (e.g. 2026) *</label><input type="text" className="input" value={yearForm.name} onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })} required /></div>
                    <div className="form-group checkbox-group"><input type="checkbox" checked={yearForm.is_active} onChange={(e) => setYearForm({ ...yearForm, is_active: e.target.checked })} /><label className="text-xs font-bold">Set as Active Year</label></div>
                    <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-black uppercase" loading={isSubmitting} loadingText="Initializing...">Initialize Year Cycle</Button>
                </form>
            </Modal>

            <Modal isOpen={isTermModalOpen} onClose={() => setIsTermModalOpen(false)} title="Configure Academic Term">
                <form onSubmit={handleTermSubmit} className="space-y-4 form-container-md mx-auto">
                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase">Academic Year</label>
                        <select className="select" value={termForm.year} onChange={(e) => setTermForm({ ...termForm, year: e.target.value })} required>
                            <option value="">Select Year</option>{academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Term Name (e.g. Term 1)</label><input type="text" className="input" value={termForm.name} onChange={(e) => setTermForm({ ...termForm, name: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Start Date</label><input type="date" className="input" value={termForm.start_date} onChange={(e) => setTermForm({ ...termForm, start_date: e.target.value })} required /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">End Date</label><input type="date" className="input" value={termForm.end_date} onChange={(e) => setTermForm({ ...termForm, end_date: e.target.value })} required /></div>
                    </div>
                    <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-black uppercase" loading={isSubmitting} loadingText="Saving...">Save Term Configuration</Button>
                </form>
            </Modal>

            <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title="Create New Class Unit">
                <div className="space-y-4 form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Class Level *</label><input type="text" className="input" value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="Form 4" required /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Stream *</label><input type="text" className="input" value={classForm.stream} onChange={(e) => setClassForm({ ...classForm, stream: e.target.value })} placeholder="North" required /></div>
                    </div>
                    <div className="form-group mb-2">
                        <label className="label text-[10px] font-black uppercase">Class Teacher</label>
                        <select className="select" value={classForm.class_teacher} onChange={(e) => setClassForm({ ...classForm, class_teacher: e.target.value })}>
                            <option value="">Select Teacher...</option>
                            {staff.filter(s => s.role === 'TEACHER').map(s => (
                                <option key={s.id} value={s.id}>{s.full_name} ({s.employee_id})</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Active Year</label><input type="number" className="input" value={classForm.year} readOnly /></div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Max Capacity</label><input type="number" className="input" value={classForm.capacity || ''} onChange={(e) => setClassForm({ ...classForm, capacity: parseInt(e.target.value) || 0 })} /></div>
                    </div>
                    <Button type="button" onClick={(e) => { e.preventDefault(); handleClassSubmit(e); }} variant="primary" size="sm" className="w-full mt-2 font-black uppercase" loading={isSubmitting} loadingText={editingClassId ? "Updating..." : "Creating..."}>Confirm Unit Creation</Button>
                </div>
            </Modal>

            <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title="Create Department Group">
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                        if (editingGroupId) {
                            await academicsAPI.subjectGroups.update(editingGroupId, groupForm);
                        } else {
                            await academicsAPI.subjectGroups.create(groupForm);
                        }
                        loadAllAcademicData();
                        setIsGroupModalOpen(false);
                        setEditingGroupId(null);
                        setGroupForm({ name: '' });
                    } catch (err: any) { toastError(err.message || 'Failed to save group'); }
                }}>
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Group Name *</label><input type="text" className="input" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="e.g. Sciences" required /></div>
                    <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-black uppercase" loading={isSubmitting} loadingText="Saving...">Save Group</Button>
                </form>
            </Modal>

            <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="Add Curriculum Subject">
                <form onSubmit={handleSubjectSubmit} className="space-y-4 form-container-md mx-auto">
                    <div className="form-group"><label className="label text-[10px] font-black uppercase">Subject Name *</label><input type="text" className="input" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Unique Code *</label><input type="text" className="input" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} required /></div>
                        <div className="form-group">
                            <label className="label text-[10px] font-black uppercase">Department Group</label>
                            <select className="select" value={subjectForm.group} onChange={(e) => setSubjectForm({ ...subjectForm, group: e.target.value })}>
                                <option value="">General</option>{subjectGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-black uppercase" loading={isSubmitting} loadingText="Registering...">Register Subject</Button>
                </form>
            </Modal>

            <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title="Log Student Attendance" size="lg">
                <form onSubmit={handleAttendanceSubmit}>
                    <div className="flex justify-between items-center mb-4 border-bottom pb-2">
                        <span className="text-xs font-bold uppercase text-secondary">Recording Mode:</span>
                        <div className="flex bg-secondary-light p-1 rounded-lg">
                            <button type="button" className={`px-3 py-1 text-[10px] font-black rounded ${!attendanceFilter.isBulk ? 'bg-primary text-white' : 'text-secondary'}`} onClick={() => setAttendanceFilter({ ...attendanceFilter, isBulk: false })}>SINGLE STUDENT</button>
                            <button type="button" className={`px-3 py-1 text-[10px] font-black rounded ${attendanceFilter.isBulk ? 'bg-primary text-white' : 'text-secondary'}`} onClick={() => setAttendanceFilter({ ...attendanceFilter, isBulk: true })}>CLASS REGISTER (BULK)</button>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-[9px] font-bold uppercase text-secondary">Date:</label>
                            <input type="date" className="input input-xs w-32" value={attendanceForm.date} onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-md mb-4 bg-secondary-light/20 p-2 rounded border">
                        <div>
                            <label className="text-[9px] font-bold uppercase text-secondary">Filter Class</label>
                            <select className="select text-xs" value={attendanceFilter.level} onChange={(e) => setAttendanceFilter({ ...attendanceFilter, level: e.target.value, classId: '' })}>
                                <option value="">Level...</option>
                                {uniqueClassNames.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase text-secondary">Stream</label>
                            <select className="select text-xs" value={attendanceFilter.classId} onChange={(e) => {
                                const newClassId = e.target.value;
                                setAttendanceFilter({ ...attendanceFilter, classId: newClassId });
                                if (attendanceFilter.isBulk && newClassId) {
                                    // Auto-populate bulk list
                                    const cid = parseInt(newClassId);
                                    const classStudents = students.filter(s => {
                                        // Handle both direct ID match and nested object if serializer changes
                                        const sClassId = typeof s.current_class === 'object' ? s.current_class?.id : s.current_class;
                                        return Number(sClassId) === cid;
                                    });
                                    setBulkAttendanceList(classStudents.map(s => ({ student_id: s.id, status: 'PRESENT', remark: '' })));
                                }
                            }} disabled={!attendanceFilter.level}>
                                <option value="">Stream...</option>
                                {classes.filter(c => c.name === attendanceFilter.level).map(c => <option key={c.id} value={c.id}>{c.stream}</option>)}
                            </select>
                        </div>
                    </div>

                    {!attendanceFilter.isBulk ? (
                        <>
                            <SearchableSelect
                                label="Student Name *"
                                options={attendanceFilter.classId
                                    ? studentOptions.filter((opt: any) => {
                                        const s = students.find(st => st.id.toString() === opt.value);
                                        return s && s.current_class === parseInt(attendanceFilter.classId);
                                    })
                                    : studentOptions
                                }
                                value={attendanceForm.student}
                                onChange={(v) => setAttendanceForm({ ...attendanceForm, student: v.toString() })}
                                required
                            />
                            <div className="form-group mt-4">
                                <label className="label text-[10px] font-black uppercase">Status</label>
                                <select className="select" value={attendanceForm.status} onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}>
                                    <option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late / Tardy</option>
                                </select>
                            </div>
                            <div className="form-group"><label className="label text-[10px] font-black uppercase">Remarks</label><input type="text" className="input" value={attendanceForm.remark} onChange={(e) => setAttendanceForm({ ...attendanceForm, remark: e.target.value })} placeholder="Reason if absent..." /></div>
                        </>
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto border rounded">
                            <table className="table table-xs w-full">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr>
                                        <th>Student</th>
                                        <th>Status</th>
                                        <th>Remark</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bulkAttendanceList.length === 0 && <tr><td colSpan={3} className="text-center p-4 text-xs italic text-secondary">Select a class to load students</td></tr>}
                                    {bulkAttendanceList.map((item, idx) => {
                                        const student = students.find(s => s.id === item.student_id);
                                        return (
                                            <tr key={item.student_id}>
                                                <td className="text-xs font-bold">{student?.full_name}</td>
                                                <td>
                                                    <select className={`select select-xs w-full ${item.status === 'ABSENT' ? 'text-error font-bold' : ''}`}
                                                        value={item.status}
                                                        onChange={(e) => {
                                                            const newList = [...bulkAttendanceList];
                                                            newList[idx].status = e.target.value;
                                                            setBulkAttendanceList(newList);
                                                        }}
                                                    >
                                                        <option value="PRESENT">Present</option>
                                                        <option value="ABSENT">Absent</option>
                                                        <option value="LATE">Late</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <input type="text" className="input input-xs w-full" placeholder="..."
                                                        value={item.remark}
                                                        onChange={(e) => {
                                                            const newList = [...bulkAttendanceList];
                                                            newList[idx].remark = e.target.value;
                                                            setBulkAttendanceList(newList);
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Button type="submit" variant="primary" size="sm" className="bg-success border-success w-full mt-4 font-black uppercase text-white shadow-md" loading={isSubmitting} loadingText="Posting...">
                        {attendanceFilter.isBulk ? `Submit Register (${bulkAttendanceList.length})` : 'Post Attendance Record'}
                    </Button>
                </form>
            </Modal>

            <Modal isOpen={isExamModalOpen} onClose={() => setIsExamModalOpen(false)} title="Schedule Assessment/Exam">
                <form onSubmit={handleExamSubmit} className="form-container-md mx-auto">
                    <div className="grid grid-cols-2 gap-md mb-4">
                        <div className="form-group col-span-2"><label className="label text-[10px] font-black uppercase">Exam Title *</label><input type="text" className="input" value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} placeholder="End of Term 1" required /></div>

                        <div className="form-group">
                            <label className="label text-[10px] font-black uppercase">Assessment Type</label>
                            <select className="select" value={examForm.exam_type} onChange={(e) => setExamForm({ ...examForm, exam_type: e.target.value })}>
                                <option value="CAT">Continuous Assessment (CAT)</option><option value="MID_TERM">Mid-Term Exam</option><option value="END_TERM">End-Term Exam</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label text-[10px] font-black uppercase">Active Term *</label>
                            <select className="select" value={examForm.term} onChange={(e) => setExamForm({ ...examForm, term: e.target.value })} required>
                                <option value="">Select Term</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.year_name})</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="label text-[10px] font-black uppercase">Grading System</label>
                            <select className="select" value={examForm.grade_system} onChange={(e) => setExamForm({ ...examForm, grade_system: e.target.value })}>
                                <option value="">Default Grading System</option>
                                {gradeSystems.map(gs => <option key={gs.id} value={gs.id}>{gs.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label className="label text-[10px] font-black uppercase">Start Date</label><input type="date" className="input" value={examForm.date_started} onChange={(e) => setExamForm({ ...examForm, date_started: e.target.value })} required /></div>

                        <div className="form-group col-span-2"><label className="label text-[10px] font-black uppercase">Weighting (%)</label><input type="number" className="input" value={examForm.weighting} onChange={(e) => setExamForm({ ...examForm, weighting: parseInt(e.target.value) })} required /></div>
                    </div>
                    <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-black uppercase" loading={isSubmitting} loadingText="Confirming...">Confirm Exam Schedule</Button>
                </form>
            </Modal>


            {/* Broadsheet Modal */}
            <Modal isOpen={isBroadsheetModalOpen} onClose={() => setIsBroadsheetModalOpen(false)} title={`Broadsheet: ${selectedExam?.name || ''}`} size="full">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                        <select className="select select-sm border-primary" value={viewResultsGroupBy} onChange={(e) => setViewResultsGroupBy(e.target.value as any)}>
                            <option value="STREAM">Group by Stream</option>
                            <option value="ENTIRE_CLASS">Entire Class Ranking</option>
                        </select>
                        <select className="select select-sm" value={resultContext.level} onChange={(e) => {
                            setResultContext({ ...resultContext, level: e.target.value });
                        }}>
                            <option value="">Select Level (All)</option>
                            {uniqueClassNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer size={14} />}>Print Broadsheet</Button>
                </div>

                <div className="table-wrapper max-h-[70vh] overflow-auto border rounded bg-white relative min-w-0">
                    {/* If Group By Stream, we might need multiple tables or just one big sorted table. 
                         For simplicity and "Matrix view", let's do one big table but filter/sort accordingly. 
                     */}
                    <table className="table table-xs w-full border-collapse">
                        <thead className="sticky top-0 bg-primary text-white z-20">
                            <tr>
                                <th className="bg-primary border-r w-12 text-center">#</th>
                                <th className="bg-primary border-r min-w-[150px] sticky left-0 z-30">Student</th>
                                {viewResultsGroupBy === 'ENTIRE_CLASS' && <th className="bg-primary border-r">Stream</th>}
                                {subjects.map(sub => (
                                    <th key={sub.id} className="text-center w-12 border-r text-[9px] vertical-text" title={sub.name}>{sub.code}</th>
                                ))}
                                <th className="text-center font-bold bg-primary border-r w-12">Total</th>
                                <th className="text-center font-bold bg-primary border-r w-12">Mean</th>
                                <th className="text-center font-bold bg-primary w-12">Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                // 1. Filter students based on level selection
                                let filteredStudents = students;
                                if (resultContext.level) {
                                    filteredStudents = students.filter(s => {
                                        const c = classes.find(cl => cl.id === s.current_class);
                                        return c?.name === resultContext.level;
                                    });
                                }

                                // 2. Calculate scores for each student
                                const studentRows = filteredStudents.map(student => {
                                    // Find all results for this student in this exam
                                    // We need to fetch ALL results first.
                                    // Ideally `examResults` state should be populated when opening modal. 
                                    // Let's assume we fetch them when opening.

                                    const sResults = examResults.filter(r => r.student === student.id);
                                    const total = sResults.reduce((sum, r) => sum + parseFloat(r.score), 0);
                                    const avg = sResults.length > 0 ? total / sResults.length : 0;
                                    const meanGrade = calculateMeanGrade(sResults, gradeSystems, selectedExam?.grade_system); // Use existing helper

                                    return {
                                        student,
                                        results: sResults,
                                        total,
                                        avg,
                                        meanGrade
                                    };
                                });

                                // 3. Sort by Total (Highest to Lowest)
                                studentRows.sort((a, b) => b.total - a.total);

                                // 4. Render
                                return studentRows.map((row, idx) => {
                                    const cls = classes.find(c => c.id === row.student.current_class);
                                    return (
                                        <tr key={row.student.id} className="hover:bg-blue-50">
                                            <td className="text-center font-bold bg-gray-50">{idx + 1}</td>
                                            <td className="sticky left-0 bg-white z-10 font-bold text-xs py-1 px-2">
                                                {row.student.full_name}
                                                <div className="text-[9px] text-secondary font-mono">{row.student.admission_number}</div>
                                            </td>
                                            {viewResultsGroupBy === 'ENTIRE_CLASS' && <td className="text-center text-[10px]">{cls?.stream}</td>}

                                            {subjects.map(sub => {
                                                const res = row.results.find(r => r.subject === sub.id);
                                                return (
                                                    <td key={sub.id} className="text-center text-xs">
                                                        {res ? <span className={res.score < 40 ? 'text-error font-bold' : ''}>{res.score}</span> : '-'}
                                                    </td>
                                                );
                                            })}

                                            <td className="text-center font-bold bg-gray-50">{row.total.toFixed(0)}</td>
                                            <td className="text-center font-bold bg-gray-50">{row.avg.toFixed(1)}</td>
                                            <td className="text-center font-black bg-gray-50">{row.meanGrade}</td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                    {examResults.length === 0 && <div className="text-center p-8 text-secondary">Loading results or no results found...</div>}
                </div>
            </Modal>

            {/* View Class Modal */}
            <Modal isOpen={isViewClassModalOpen} onClose={() => setIsViewClassModalOpen(false)} title={`Class Details: ${selectedClass?.name || ''} ${selectedClass?.stream || ''}`}>
                <div className="flex justify-end gap-2 mb-4 no-print">
                    <Button variant="outline" size="sm" onClick={() => {
                        const exportData = viewClassStudents.map(s => ({
                            'Student Name': s.full_name,
                            'Admission Number': s.admission_number,
                            'Gender': s.gender || 'N/A'
                        }));
                        exportToCSV(exportData, `Class_List_${selectedClass?.name}_${selectedClass?.stream}`);
                    }} icon={<Download size={16} />}>
                        Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        // Temporarily add print-modal class to the modal content wrapper before triggering print
                        const modalContent = document.querySelector('.modal-content');
                        if (modalContent) modalContent.classList.add('print-modal');
                        window.print();
                        if (modalContent) setTimeout(() => modalContent.classList.remove('print-modal'), 1000);
                    }} className="border-primary text-primary hover:bg-primary hover:text-white" icon={<Printer size={16} />}>
                        Print List
                    </Button>
                </div>
                <div className="table-wrapper">
                    <table className="table">
                        <thead><tr><th>Student Name</th><th>ADM No</th></tr></thead>
                        <tbody>
                            {viewClassStudents.length > 0 ? viewClassStudents.map(s => (
                                <tr key={s.id}>
                                    <td className="font-bold text-xs">{s.full_name}</td>
                                    <td className="text-xs text-secondary">{s.admission_number}</td>
                                </tr>
                            )) : <tr><td colSpan={2} className="text-center p-4 text-xs">No students found in this class.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Modal>

            {/* Enter Results Modal */}
            <Modal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} title={`Enter Results: ${selectedExam?.name || ''}`} size="full">
                <form onSubmit={handleBulkResultSubmit}>
                    {/* Cascading Class Selector */}
                    <div className="form-group p-3 mb-4 bg-gray-50">
                        <label className="label text-[10px] font-black uppercase mb-2">Select Class to Enter Marks</label>
                        <div className="grid grid-cols-2 gap-md">
                            <div>
                                <label className="text-[9px] font-bold uppercase text-secondary">Class Level</label>
                                <select className="select text-xs" value={resultContext.level} onChange={(e) => {
                                    setResultContext({ ...resultContext, level: e.target.value, classId: '' });
                                }}>
                                    <option value="">Select Level...</option>
                                    {uniqueClassNames.map(name => <option key={name} value={name}>{name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold uppercase text-secondary">Stream</label>
                                <select className="select text-xs" value={resultContext.classId} onChange={async (e) => {
                                    const cid = e.target.value;
                                    setResultContext({ ...resultContext, classId: cid });

                                    // Load existing results for this exam + class/level
                                    if (cid) {
                                        setLoading(true);
                                        try {
                                            const res = await academicsAPI.results.getAll({ exam_id: selectedExam.id });
                                            const rawResults = res.data?.results ?? res.data ?? [];
                                            // Filter results based on selection (Specific Stream or ALL in Level)
                                            const relevantResults = rawResults.filter((r: any) => {
                                                const s = students.find(st => st.id === r.student);
                                                if (!s) return false;
                                                // If 'all', match by Level name. If specific ID, match by current_class ID.
                                                if (cid === 'all') {
                                                    // Find class object for student
                                                    const sClass = classes.find(c => c.id === s.current_class);
                                                    return sClass && sClass.name === resultContext.level;
                                                }
                                                return s.current_class === parseInt(cid);
                                            });

                                            // Map to nested matrix state
                                            const matrix: any = {};
                                            relevantResults.forEach((r: any) => {
                                                if (!matrix[r.student]) matrix[r.student] = {};
                                                matrix[r.student][r.subject] = { score: r.score.toString(), id: r.id };
                                            });
                                            setStudentScores(matrix);

                                            // Also load the specific subjects allocated to this class
                                            if (cid !== 'all') {
                                                const classSubRes = await academicsAPI.classSubjects.list({ class_id: cid });
                                                const classSubData = classSubRes.data?.results ?? classSubRes.data ?? [];
                                                setActiveClassSubjects(Array.isArray(classSubData) ? classSubData : []);
                                            } else {
                                                setActiveClassSubjects([]);
                                            }

                                        } catch (err) { console.error(err); }
                                        setLoading(false);
                                    } else {
                                        setActiveClassSubjects([]);
                                    }
                                }} disabled={!resultContext.level}>
                                    <option value="">Select Stream...</option>
                                    <option value="all" className="font-bold">ALL STREAMS (Combined)</option>
                                    {classes.filter(c => c.name === resultContext.level).map(c => <option key={c.id} value={c.id}>{c.stream}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {resultContext.classId && (
                        <div className="max-h-[80vh] overflow-auto bg-white relative">
                            <table className="results-entry-table table w-full border-collapse text-xs">
                                <thead className="sticky top-0 z-20 bg-white">
                                    <tr className="border-none">
                                        <th className="sticky left-0 z-30 bg-white min-w-[160px] p-3 text-left">
                                            <span className="text-[10px] font-black uppercase text-slate-800">Student Name</span>
                                        </th>
                                        {subjects.filter(sub => {
                                            // 1. If 'All Streams' selected, show all subjects
                                            if (resultContext.classId === 'all') return true;
                                            // 2. Otherwise, only show if it's allocated to the selected class
                                            return activeClassSubjects.some(cs => cs.subject === sub.id);
                                        }).map(sub => (
                                            <th key={sub.id} className="text-center min-w-[110px] p-2 bg-white" title={`${sub.name} (${sub.code})`}>
                                                <div className="text-[11px] font-black uppercase text-slate-800">{sub.name.substring(0, 3)}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResultStudents.map((student) => {
                                        const sClass = classes.find(c => c.id === student.current_class);
                                        return (
                                            <StudentResultRow
                                                key={student.id}
                                                student={student}
                                                sClass={sClass}
                                                subjects={subjects}
                                                studentScores={studentScores[student.id]}
                                                onScoreChange={handleScoreChange}
                                                onDeleteResult={handleDeleteSingleResult}
                                                activeClassSubjects={activeClassSubjects}
                                                resultContext={resultContext.classId}
                                                gradeSystems={gradeSystems}
                                                examGradeSystemId={selectedExam?.grade_system}
                                            />
                                        );
                                    })}
                                </tbody>
                            </table>
                            {students.filter(s => {
                                if (resultContext.classId === 'all') {
                                    const sClass = classes.find(c => c.id === s.current_class);
                                    return sClass && sClass.name === resultContext.level;
                                }
                                return s.current_class === parseInt(resultContext.classId);
                            }).length === 0 && (
                                    <div className="p-12 text-center text-gray-400 italic">No students found for {resultContext.level} {resultContext.classId === 'all' ? '(All Streams)' : ''}</div>
                                )}
                        </div>
                    )}

                    <div className="mt-4 pt-4 border-top flex justify-between items-center">
                        <p className="text-[10px] text-secondary">
                            <span className="font-bold text-primary">Tip:</span> Existing marks are shown in <span className="font-bold text-primary">blue</span>. Enter new marks and click Save.
                        </p>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsResultModalOpen(false)}>Cancel</Button>
                            <Button type="submit" variant="primary" size="sm" className="font-black uppercase shadow-md px-6" loading={isSubmitting} loadingText="Saving Matrix...">Save Matrix Payload</Button>
                        </div>
                    </div>
                </form>
            </Modal >

            {/* Confirmation Modal */}
            <Modal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })} title="Confirm Deletion" >
                <div className="p-4">
                    <p className="mb-4 text-secondary">
                        Are you sure you want to delete this item? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}>Cancel</Button>
                        <Button variant="primary" className="bg-error border-error text-white" onClick={executeDelete} loading={isSubmitting} loadingText="Deleting...">Confirm Delete</Button>
                    </div>
                </div>
            </Modal >

            {/* Reports Modal */}
            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Generate Reports" >
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-secondary-light hover:border-primary transition-all gap-2" onClick={() => { window.print(); setIsReportModalOpen(false); }}>
                            <div className="p-3 rounded-full bg-primary-light text-primary mb-2"><FileText size={24} /></div>
                            <span className="font-bold text-sm">Print Current View</span>
                            <span className="text-[10px] text-center text-secondary">Print the current dashboard/list</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-secondary-light hover:border-primary transition-all gap-2" onClick={() => alert('Feature coming soon: Export to CSV')}>
                            <div className="p-3 rounded-full bg-success-light text-success mb-2"><BarChart3 size={24} /></div>
                            <span className="font-bold text-sm">Export Data (CSV)</span>
                            <span className="text-[10px] text-center text-secondary">Download raw data</span>
                        </button>
                    </div>
                </div>
            </Modal >

            {/* Syllabus Modal */}
            <Modal isOpen={isSyllabusModalOpen} onClose={() => setIsSyllabusModalOpen(false)} title="Track Syllabus Coverage" >
                <form onSubmit={handleSyllabusSubmit}>
                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase">Class Grade</label>
                        <select className="select" value={syllabusForm.class_grade} onChange={(e) => setSyllabusForm({ ...syllabusForm, class_grade: e.target.value })} required>
                            <option value="">Select Class...</option>
                            {uniqueClassNames.map(name => {
                                const cls = classes.find(c => c.name === name);
                                return cls ? <option key={cls.id} value={cls.id}>{name}</option> : null;
                            })}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase">Subject</label>
                        <select className="select" value={syllabusForm.subject} onChange={(e) => setSyllabusForm({ ...syllabusForm, subject: e.target.value })} required>
                            <option value="">Select Subject...</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="label text-[10px] font-black uppercase">Start Pct</label>
                        <div className="flex items-center gap-2">
                            <input type="range" min="0" max="100" className="range range-xs range-primary" value={syllabusForm.coverage_percentage} onChange={(e) => setSyllabusForm({ ...syllabusForm, coverage_percentage: parseInt(e.target.value) })} />
                            <span className="font-bold text-xs w-12 text-right">{syllabusForm.coverage_percentage}%</span>
                        </div>
                    </div>
                    <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-black uppercase" loading={isSubmitting} loadingText="Saving...">Save Coverage</Button>
                </form>
            </Modal>

            {/* Grade System Modal */}
            <Modal isOpen={isGradeModalOpen} onClose={() => setIsGradeModalOpen(false)} title={editingSystemId ? "Edit Grading System" : "New Grading System"}>
                <form onSubmit={handleGradeSystemSubmit}>
                    <div className="form-group mb-4">
                        <label className="label text-[10px] font-black uppercase">System Name</label>
                        <input type="text" className="input" placeholder="e.g. KNEC Standard" value={gradeForm.name} onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })} required />
                    </div>
                    <div className="form-group mb-4 flex items-center gap-2">
                        <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={gradeForm.is_default} onChange={(e) => setGradeForm({ ...gradeForm, is_default: e.target.checked })} />
                        <label className="label text-[10px] font-black uppercase mb-0">Set as Default System</label>
                    </div>
                    <Button type="submit" variant="primary" className="w-full font-black uppercase" loading={isSubmitting} loadingText="Saving...">Save System</Button>
                </form>
            </Modal>

            {/* Grade Boundary Modal */}
            <Modal isOpen={isBoundaryModalOpen} onClose={() => setIsBoundaryModalOpen(false)} title={editingBoundaryId ? "Edit Grade Boundary" : "Add Grade Boundary"}>
                <form onSubmit={handleBoundarySubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group mb-4">
                            <label className="label text-[10px] font-black uppercase">Grade Symbol</label>
                            <input type="text" className="input" placeholder="e.g. A" value={boundaryForm.grade} onChange={(e) => setBoundaryForm({ ...boundaryForm, grade: e.target.value })} required />
                        </div>
                        <div className="form-group mb-4">
                            <label className="label text-[10px] font-black uppercase">Points</label>
                            <input type="number" className="input" placeholder="12" value={boundaryForm.points} onChange={(e) => setBoundaryForm({ ...boundaryForm, points: parseInt(e.target.value) })} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group mb-4">
                            <label className="label text-[10px] font-black uppercase">Min Score</label>
                            <input type="number" className="input" value={boundaryForm.min_score} onChange={(e) => setBoundaryForm({ ...boundaryForm, min_score: parseInt(e.target.value) })} required />
                        </div>
                        <div className="form-group mb-4">
                            <label className="label text-[10px] font-black uppercase">Max Score</label>
                            <input type="number" className="input" value={boundaryForm.max_score} onChange={(e) => setBoundaryForm({ ...boundaryForm, max_score: parseInt(e.target.value) })} required />
                        </div>
                    </div>
                    <div className="form-group mb-4">
                        <label className="label text-[10px] font-black uppercase">Remarks</label>
                        <input type="text" className="input" placeholder="Excellent" value={boundaryForm.remarks} onChange={(e) => setBoundaryForm({ ...boundaryForm, remarks: e.target.value })} />
                    </div>
                    <Button type="submit" variant="primary" className="w-full font-black uppercase" loading={isSubmitting} loadingText="Saving...">Save Boundary</Button>
                </form>
            </Modal>

        </div >
    );
};

export default Academics;
// Force update: UI refinements applied (Teacher Filter, Curriculum Table, Attendance Refresh)

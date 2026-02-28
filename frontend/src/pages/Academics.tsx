import {
    Edit, Trash2, Calendar, ClipboardCheck, BarChart3,
    Trophy, Printer, ShieldAlert
} from 'lucide-react';
import { academicsAPI, staffAPI, studentsAPI } from '../api/api';


import SearchableSelect from '../components/SearchableSelect';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';
import ExamBroadsheet from '../components/academics/ExamBroadsheet';
import StudentResultRow from '../components/academics/StudentResultRow';
import { YearModal, TermModal } from '../components/academics/AcademicPeriodModals';
import { ClassModal, GroupModal, SubjectModal } from '../components/academics/AcademicStructureModals';
import { AttendanceModal } from '../components/academics/AcademicAttendanceModals';
import { ExamModal, SyllabusModal, RankingModal } from '../components/academics/AcademicAssessmentModals';
import { ResultEntryModal } from '../components/academics/ResultEntryModal';
import { ViewClassModal, ReportModal, ConfirmDeleteModal } from '../components/academics/AcademicReviewModals';
import { GradeSystemModal, BoundaryModal } from '../components/academics/AcademicGradingModals';
import type {
    AcademicYear, Term, ClassUnit, Subject,
    Exam, GradeSystem
} from '../types/academic.types';
import type { Student } from '../types/student.types';
import { calculateGrade, calculateMeanGrade } from '../utils/academicHelpers';


const Academics = () => {

    const [activeTab, setActiveTab] = useState<'SUMMARY' | 'CLASSES' | 'CURRICULUM' | 'EXAMS' | 'GRADING' | 'ATTENDANCE' | 'RESOURCES' | 'ALLOCATION'>('SUMMARY');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success, error: toastError, warning } = useToast();
    const { confirm } = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');


    // Data States
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [terms, setTerms] = useState<Term[]>([]);
    const [classes, setClasses] = useState<ClassUnit[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<any[]>([]); // Subject groups type can be added later
    const [exams, setExams] = useState<Exam[]>([]);
    const [gradeSystems, setGradeSystems] = useState<GradeSystem[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
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
    const [resultContext, setResultContext] = useState({ level: '', classId: '', subjectId: '' });
    const [selectedExam, setSelectedExam] = useState<any>(null);
    const [examResults, setExamResults] = useState<any[]>([]);
    const [studentScores, setStudentScores] = useState<any>({});
    const [activeClassSubjects, setActiveClassSubjects] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [viewClassStudents, setViewClassStudents] = useState<any[]>([]);
    const [rankingFilter, setRankingFilter] = useState({ level: '', classId: '' });


    // Form States
    const [yearForm, setYearForm] = useState({ name: '', is_active: false });
    const [termForm, setTermForm] = useState({ year: '', name: '', start_date: '', end_date: '', is_active: false });
    const [groupForm, setGroupForm] = useState({ name: '' });
    const [subjectForm, setSubjectForm] = useState({ name: '', code: '', short_name: '', group: '', is_optional: false });
    const [gradeForm, setGradeForm] = useState({ name: '', is_default: false });
    const [attendanceForm, setAttendanceForm] = useState({ student: '', status: 'PRESENT', remark: '', date: new Date().toISOString().split('T')[0] });
    const [attendanceFilter, setAttendanceFilter] = useState({ level: '', classId: '', isBulk: false });
    const [classForm, setClassForm] = useState({ name: '', stream: '', year: new Date().getFullYear().toString(), class_teacher: '', capacity: 40 });
    const [examForm, setExamForm] = useState({ name: '', exam_type: 'END_TERM', term: '', grade_system: '', weighting: 100, date_started: '', is_active: true });
    const [syllabusForm, setSyllabusForm] = useState({ subject: '', level: '', class_grade: '', coverage_percentage: 0 });
    const [boundaryForm, setBoundaryForm] = useState<{ system: string | number; grade: string; min_score: number; max_score: number; points: number; remarks: string; }>({ system: '', grade: '', min_score: 0, max_score: 100, points: 0, remarks: '' });

    // Editing & Selection States (CONSOLIDATED)
    const [editingSyllabusId, setEditingSyllabusId] = useState<number | null>(null);
    const [editingYearId, setEditingYearId] = useState<number | null>(null);
    const [editingTermId, setEditingTermId] = useState<number | null>(null);
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


    const handleDeleteSingleResult = async (studentId: number, subjectId: number) => {
        const resId = studentScores[studentId]?.[subjectId]?.id;
        if (resId && await confirm('Clear this mark?')) {
            try {
                await academicsAPI.results.delete(resId);
                success('Mark cleared');
                setStudentScores((prev: any) => {
                    const next = { ...prev };
                    if (next[studentId]?.[subjectId]) {
                        delete next[studentId][subjectId];
                    }
                    return next;
                });
            } catch (e: any) {
                toastError(e.message || 'Failed to clear mark');
            }
        }
    };

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
            const sClassId = typeof s.current_class === 'object' ? (s.current_class as any)?.id : s.current_class;
            return sClassId === parseInt(resultContext.classId);
        }).filter((student, index, self) =>
            index === self.findIndex((t) => t.id === student.id)
        ).sort((a, b) => a.full_name.localeCompare(b.full_name));
    }, [students, resultContext.classId, resultContext.level, classes]);

    const handleLoadMatrixResults = async (cid: string) => {
        if (!cid || !selectedExam) return;
        setLoading(true);
        try {
            const res = await academicsAPI.results.getAll({ exam_id: selectedExam.id });
            const rData = res.data?.results ?? res.data ?? [];

            const relevantResults = rData.filter((r: any) => {
                const s = students.find(st => st.id === r.student);
                if (!s) return false;
                if (cid === 'all') {
                    const sClass = classes.find(c => c.id === s.current_class);
                    return sClass && sClass.name === resultContext.level;
                }
                const sClassId = typeof s.current_class === 'object' ? (s.current_class as any)?.id : s.current_class;
                return sClassId === parseInt(cid);
            });

            const matrix: any = {};
            relevantResults.forEach((r: any) => {
                if (!matrix[r.student]) matrix[r.student] = {};
                matrix[r.student][r.subject] = { score: r.score.toString(), id: r.id };
            });
            setStudentScores(matrix);

            if (cid !== 'all') {
                const classSubRes = await academicsAPI.classSubjects.list({ class_id: cid });
                const classSubData = classSubRes.data?.results ?? classSubRes.data ?? [];
                setActiveClassSubjects(Array.isArray(classSubData) ? classSubData : []);
            } else {
                setActiveClassSubjects([]);
            }
        } catch (err: any) {
            console.error(err);
            toastError(err.message || "Failed to load results matrix");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isResultModalOpen && resultContext.classId) {
            handleLoadMatrixResults(resultContext.classId);
        }
    }, [isResultModalOpen, resultContext.classId, selectedExam]);



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

    const loadAllAcademicData = async () => {
        setLoading(true);
        try {
            const dS = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? (r.value.data?.results ?? r.value.data ?? []) : [];

            // Fetch ALL data in one mega-parallel call to avoid sequential waterfalls
            const [
                yearsRes, termsRes, classesRes, subjectsRes, groupsRes,
                gradesRes, staffRes, studentRes, resultsRes, examsRes, syllabusRes
            ] = await Promise.allSettled([
                academicsAPI.years.getAll({ page_size: 50 }),
                academicsAPI.terms.getAll({ page_size: 50 }),
                academicsAPI.classes.getAll({ page_size: 100 }),
                academicsAPI.subjects.getAll({ page_size: 200 }),
                academicsAPI.subjectGroups.getAll({ page_size: 100 }),
                academicsAPI.gradeSystems.getAll({ page_size: 20 }),
                staffAPI.getAll({ page_size: 200 }),
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
                academicsAPI.years.getAll({ page_size: 50 }),
                academicsAPI.terms.getAll({ page_size: 50 }),
                academicsAPI.classes.getAll({ page_size: 100 }),
                academicsAPI.subjects.getAll({ page_size: 200 }),
                academicsAPI.subjectGroups.getAll({ page_size: 100 }),
                academicsAPI.gradeSystems.getAll({ page_size: 20 }),
                staffAPI.getAll({ page_size: 200 }),
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
                    academicsAPI.attendance.getAll({ page_size: 500, ordering: '-date' }),
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

    const updateAllocationTeacher = async (allocationId: number, teacherId: string) => {
        try {
            await academicsAPI.classSubjects.update(allocationId, { teacher: parseInt(teacherId) || null });
            success('Teacher assigned');
            fetchClassAllocations(selectedAllocationClass);
        } catch (err: any) {
            toastError(err.message || 'Failed to assign teacher');
        }
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
            if (editingTermId) {
                await academicsAPI.terms.update(editingTermId, termForm);
                success('Term updated');
            } else {
                await academicsAPI.terms.create(termForm);
                success('Term added');
            }
            loadAllAcademicData();
            setIsTermModalOpen(false);
            setEditingTermId(null);
            setTermForm({ year: '', name: '', start_date: '', end_date: '', is_active: false });
        } catch (err: any) { toastError(err.message || 'Failed to save term'); }
        finally { setIsSubmitting(false); }
    };

    const openEditTerm = (t: any) => {
        const yearId = typeof t.year === 'object' && t.year ? t.year.id : t.year;
        setTermForm({
            year: yearId.toString(),
            name: t.name,
            start_date: t.start_date || '',
            end_date: t.end_date || '',
            is_active: t.is_active
        });
        setEditingTermId(t.id);
        setIsTermModalOpen(true);
    };

    const openEditGradeSystem = (gs: any) => {
        setGradeForm({ name: gs.name, is_default: gs.is_default });
        setEditingSystemId(gs.id);
        setIsGradeModalOpen(true);
    };

    const handleDeleteAttendance = async (id: number) => {
        if (await confirm('Delete this attendance record?', { type: 'danger' })) {
            try {
                await academicsAPI.attendance.delete(id);
                success('Attendance record removed');
                // Refresh attendance data
                try {
                    const attRes = await academicsAPI.attendance.getAll();
                    setAttendanceRecords(attRes.data?.results ?? attRes.data ?? []);
                } catch (e) { console.error("Error refreshing attendance:", e); }
            } catch (err: any) { toastError(err.message || 'Failed to remove attendance'); }
        }
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
            setSubjectForm({ name: '', code: '', short_name: '', group: '', is_optional: false });
        } catch (err: any) { toastError(err.message || 'Failed to save subject'); }
        finally { setIsSubmitting(false); }
    };

    const openEditSubject = (s: any) => {
        setSubjectForm({
            name: s.name,
            code: s.code,
            short_name: s.short_name || '',
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
            setSyllabusForm({ subject: '', level: '', class_grade: '', coverage_percentage: 0 });
        } catch (err: any) { toastError(err.message || 'Failed to save syllabus data'); }
        finally { setIsSubmitting(false); }
    };

    const handleGroupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingGroupId) {
                await academicsAPI.subjectGroups.update(editingGroupId, groupForm);
                success('Group updated');
            } else {
                await academicsAPI.subjectGroups.create(groupForm);
                success('Group created');
            }
            loadAllAcademicData();
            setIsGroupModalOpen(false);
            setEditingGroupId(null);
            setGroupForm({ name: '' });
        } catch (err: any) { toastError(err.message || 'Failed to save group'); }
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
        setViewClassStudents(students.filter(s => {
            const studentClassId = typeof s.current_class === 'object' ? (s.current_class as any)?.id : s.current_class;
            return studentClassId === cls.id;
        }));
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
        if (!await confirm('Delete this result? This cannot be undone.', { type: 'danger' })) return;
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
        setRankingFilter({ level: '', classId: '' }); // Reset filters on open
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

    const handleDeleteStudentResults = async (studentId: number) => {
        if (!selectedExam) return;
        if (!await confirm(`Delete ALL saved results for this student in ${selectedExam.name}?`, { type: 'danger' })) return;

        setIsSubmitting(true);
        try {
            const studentResults = examResults.filter(r => r.student === studentId);
            if (studentResults.length === 0) {
                warning("No results found to delete.");
                return;
            }
            await Promise.all(studentResults.map(r => academicsAPI.results.delete(r.id)));
            success('Student results removed');
            openViewResults(selectedExam); // Refresh
        } catch (err: any) {
            toastError(err.message || 'Failed to clear results');
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleDeleteExam = (id: number) => setDeleteConfirm({ isOpen: true, type: 'EXAM', id });
    const handleDeleteTerm = (id: number) => setDeleteConfirm({ isOpen: true, type: 'TERM', id });
    const handleDeleteYear = (id: number) => setDeleteConfirm({ isOpen: true, type: 'YEAR', id });
    const handleDeleteGradeSystem = (id: number) => setDeleteConfirm({ isOpen: true, type: 'POLICY', id });

    const handleSetActiveTerm = async (term: any) => {
        const newStatus = !term.is_active;
        if (!await confirm(`${newStatus ? 'Activate' : 'Deactivate'} ${term.name}? This will update the system-wide active context.`, { type: 'info', confirmLabel: 'Proceed', cancelLabel: 'Cancel' })) return;

        const yearId = typeof term.year === 'object' && term.year ? term.year.id : term.year;
        const payload = { ...term, year: yearId, is_active: newStatus };

        try {
            await academicsAPI.terms.update(term.id, payload);
            success(`Term ${term.name} is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}`);
            loadAllAcademicData();
        } catch (err: any) {
            toastError(err.message || 'Failed to update term status');
        }
    };

    const handleSetActiveYear = async (year: any) => {
        const newStatus = !year.is_active;
        if (!await confirm(`${newStatus ? 'Activate' : 'Deactivate'} Academic Cycle ${year.name}?`, { type: 'info' })) return;

        try {
            await academicsAPI.years.update(year.id, { ...year, is_active: newStatus });
            success(`Academic Cycle ${year.name} is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}`);
            loadAllAcademicData();
        } catch (err: any) {
            toastError(err.message || 'Failed to update cycle status');
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
            } else if (deleteConfirm.type === 'YEAR') {
                await academicsAPI.years.delete(deleteConfirm.id);
                success('Academic Cycle deleted');
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
                    teacher: c.teacher_name,
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

    const activeYearObj = academicYears.find((y: any) => y.is_active);
    const activeTermObj = terms.find((t: any) => t.is_active);
    const activeYear = activeYearObj?.name || 'NO ACTIVE YEAR';
    const activeTerm = activeTermObj?.name || 'NO ACTIVE TERM';
    const noActivePeriod = !activeYearObj || !activeTermObj;

    staff.map(s => ({ id: s.user || s.id, label: s.full_name || s.username, subLabel: `ID: ${s.employee_id}` }));
    const studentOptions = students.map(s => ({ id: s.id, label: s.full_name, subLabel: `ADM: ${s.admission_number}` }));

    return (
        <div className="fade-in w-full max-w-full overflow-x-hidden min-w-0">
            {/* Elegant Header with Multi-layer Background */}
            <div className="relative overflow-hidden rounded-3xl bg-primary text-white p-8 mb-8 shadow-2xl">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <GraduationCap size={16} className="text-info-light" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Academic Operations</span>
                        </div>
                        <h1 className="text-3xl font-black mb-1 capitalize text-white">Institution Academics</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                                <Calendar size={12} className="text-info-light" />
                                <span className="text-[10px] font-bold uppercase">{activeYear} • {activeTerm}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <Award size={200} />
                </div>
            </div>

            {/* Active Status Header */}
            {noActivePeriod && (
                <div className="mb-6 animate-pulse px-6 py-4 bg-error-light/30 border-2 border-error/20 rounded-2xl flex items-center gap-4 no-print mx-4">
                    <div className="bg-error text-white p-2 rounded-xl">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-error uppercase mb-0">Missing Active Academic Period</h4>
                        <p className="text-[10px] font-bold text-error/70 uppercase tracking-widest">
                            Official records require an active Year and Term. Please activate them in the "Resources" tab.
                        </p>
                    </div>
                </div>
            )}

            {/* Navigation Tabs - Consolidated */}
            <div className="nav-tab-container no-print">
                {(['SUMMARY', 'CLASSES', 'CURRICULUM', 'ALLOCATION', 'EXAMS', 'ATTENDANCE', 'RESOURCES', 'GRADING'] as const)
                    .filter(tab => !isReadOnly || ['SUMMARY', 'CURRICULUM', 'EXAMS', 'ATTENDANCE'].includes(tab))
                    .map(tab => (
                        <button
                            key={tab}
                            className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
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
                <div className="space-y-8 fade-in">
                    <div className="grid grid-cols-2 gap-6 lg:gap-8">
                        <div className="min-w-0">
                            <StatCard
                                title="Enrolled Capacity"
                                value={classes.length > 0 ? `${classes.reduce((sum, c) => sum + (c.student_count || 0), 0)}/${classes.reduce((sum, c) => sum + (c.capacity || 40), 0)}` : "0/0"}
                                icon={<Users size={18} />}
                                gradient="linear-gradient(135deg, #0f172a, #1e293b)"
                            />
                        </div>
                        <div className="min-w-0">
                            <StatCard
                                title="Departments"
                                value={subjectGroups.length}
                                icon={<Layers size={18} />}
                                gradient="linear-gradient(135deg, #0f172a, #1e293b)"
                            />
                        </div>
                        <div className="min-w-0">
                            <StatCard
                                title="Active Exams"
                                value={exams.filter(e => e.is_active).length}
                                icon={<Calendar size={18} />}
                                gradient="linear-gradient(135deg, #4facfe, #00f2fe)"
                            />
                        </div>
                        <div className="min-w-0">
                            <StatCard
                                title="Overall Mean"
                                value={meanGrade === '...' ? '—' : (meanGrade || "N/A")}
                                icon={<Trophy size={18} />}
                                gradient="linear-gradient(135deg, #667eea, #764ba2)"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6 lg:gap-8 min-h-[60vh]">
                        <div className="col-span-12 lg:col-span-4 min-w-0">
                            <div className="card h-full flex flex-col p-0 overflow-hidden border-top-4 border-primary">
                                <div className="card-header">
                                    <h3 className="mb-0 text-xs font-black uppercase">Exams Overview</h3>
                                    <Button variant="ghost" size="sm" className="text-primary font-black uppercase text-[10px]" onClick={() => setActiveTab('EXAMS')}>View All</Button>
                                </div>
                                <div className="card-body p-4 space-y-3 flex-1">
                                    {exams.slice(0, 4).map(e => (
                                        <div key={e.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:border-primary/20 hover:bg-slate-50 transition-all cursor-pointer group" onClick={() => { setActiveTab('EXAMS'); setTimeout(() => openViewResults(e), 100); }}>
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-primary-light group-hover:text-white transition-colors"><Calendar size={14} /></div>
                                                <div>
                                                    <p className="font-black text-xs mb-0 text-slate-800">{e.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{e.term_name || 'Active Term'}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                        <span className="text-[9px] font-mono text-slate-500">{e.date_start ? new Date(e.date_start + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${e.is_active ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-400'}`}>{e.is_active ? 'OPEN' : 'CLOSED'}</span>
                                        </div>
                                    ))}
                                    {exams.length === 0 && <div className="py-12 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest">No recent exams</div>}
                                </div>
                            </div>
                        </div>

                        <div className="col-span-12 lg:col-span-6 min-w-0">
                            <div className="card h-full flex flex-col p-0 overflow-hidden">
                                <div className="card-header">
                                    <h3 className="mb-0 text-xs font-black uppercase">Syllabus Completion</h3>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" className="p-2" onClick={() => setIsSyllabusModalOpen(true)} icon={<Edit size={12} />} />
                                    </div>
                                </div>
                                <div className="card-body p-6 space-y-6 min-h-[300px]">
                                    {syllabusData.length === 0 && (
                                        <div className="py-12 text-center text-slate-300">
                                            <BarChart3 size={32} className="mx-auto mb-2 opacity-20" />
                                            <p className="font-black text-[10px] uppercase tracking-widest">No tracking data</p>
                                        </div>
                                    )}
                                    {syllabusData.map(s => (
                                        <div key={s.id} className="cursor-pointer group" onClick={() => {
                                            const cls = classes.find(c => c.id === s.class_grade);
                                            setSyllabusForm({
                                                subject: s.subject.toString(),
                                                level: cls?.name || '',
                                                class_grade: s.class_grade.toString(),
                                                coverage_percentage: s.coverage_percentage
                                            });
                                            setEditingSyllabusId(s.id);
                                            setIsSyllabusModalOpen(true);
                                        }}>
                                            <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-tight">
                                                <span className="text-slate-700">{s.subject_name} <span className="text-slate-400 ml-1">({s.class_name})</span></span>
                                                <span className="text-primary">{s.coverage_percentage}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                                                <div className={`h-full transition-all duration-1000 ${s.coverage_percentage > 80 ? 'bg-success' : s.coverage_percentage > 50 ? 'bg-primary' : 'bg-error'}`} style={{ width: `${s.coverage_percentage}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {activeTab === 'CLASSES' && (
                <div className="grid grid-cols-12 gap-6 lg:gap-8 min-w-0">
                    {classes.filter(cls =>
                        !searchTerm ||
                        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        cls.stream.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(cls => (
                        <div key={cls.id} className="col-span-12 md:col-span-6 lg:col-span-4 min-w-0">
                            <div className="card hover:shadow-2xl transition-all h-full flex flex-col p-6 overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2.5 rounded-lg bg-primary-light text-white"><School size={16} /></div>
                                    <span className="badge badge-info badge-xs">CAP: {cls.capacity}</span>
                                </div>
                                <h3 className="mb-1 text-sm font-black">{cls.name} <span className="text-secondary">{cls.stream}</span></h3>
                                <p className="text-[10px] font-bold text-secondary mb-4 flex items-center gap-1 uppercase"><Users size={10} /> {cls.student_count} Students</p>
                                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-secondary uppercase">{cls.class_teacher_name || 'Unassigned TR'}</span>
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="sm" onClick={() => openEditClass(cls)} title="Edit Class Details" icon={<Edit size={10} />} />
                                        <Button variant="ghost" size="sm" className="text-primary" onClick={() => openViewClass(cls)} title="View Students in Class" icon={<Users size={10} />} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="col-span-12 md:col-span-6 lg:col-span-4 min-w-0">
                        <div className="card border-dashed flex flex-col items-center justify-center p-8 cursor-pointer hover:border-primary group h-full" onClick={() => setIsClassModalOpen(true)}>
                            <Plus size={32} className="text-secondary group-hover:text-primary transition-all mb-2" />
                            <span className="text-xs font-black uppercase text-secondary">Add Class Unit</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'CURRICULUM' && (
                <div className="grid grid-cols-12 gap-6 lg:gap-8 min-w-0">
                    <div className="col-span-12 lg:col-span-3 space-y-4 min-w-0">
                        <div className="card card-mobile-flat p-0 overflow-hidden">
                            <div className="card-header">
                                <h3 className="mb-0 text-sm font-black uppercase">Subject Groups</h3>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingGroupId(null); setGroupForm({ name: '' }); setIsGroupModalOpen(true); }} icon={<Plus size={14} />} />
                            </div>
                            <div className="card-body p-4">
                                {subjectGroups.map(g => (
                                    <div key={g.id} className="flex justify-between items-center p-2 rounded hover:bg-secondary-light text-[11px] font-bold border border-transparent hover:border-secondary transition-all group">
                                        <span>{g.name}</span>
                                        <div className="flex gap-1 opacity-30 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" className="text-primary p-1 h-6 w-6" onClick={() => openEditGroup(g)} title="Edit Subject Group" icon={<Edit size={12} />} />
                                            <Button variant="ghost" size="sm" className="text-error p-1 h-6 w-6" onClick={() => handleDeleteGroup(g.id)} title="Delete Subject Group" icon={<Trash2 size={12} />} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="col-span-12 lg:col-span-9 min-w-0 fade-in card card-mobile-flat p-0 overflow-hidden">
                        <div className="card-header">
                            <h3 className="mb-0 text-sm font-black uppercase">Institutional Curriculum</h3>
                            {/* ... buttons ... */}
                            <Button variant="primary" size="sm" className="ml-auto-mobile" onClick={() => setIsSubjectModalOpen(true)} icon={<Plus size={14} />}>New Subject</Button>
                        </div>
                        <div className="p-0">
                            <div className="table-wrapper overflow-x-auto w-full block m-0">
                                <table className="table min-w-[800px] relative">
                                    <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm text-[10px] uppercase">
                                        <tr>
                                            <th className="py-4 px-6 min-w-[150px]">Subject Name</th>
                                            <th className="py-4 px-6 min-w-[100px]">Code</th>
                                            <th className="py-4 px-6 min-w-[150px]">Subject Group</th>
                                            <th className="py-4 px-6 min-w-[100px]">Type</th>
                                            <th className="py-4 px-6 min-w-[100px] text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {subjects.map((s: any) => (
                                            <tr key={s.id} className="hover:bg-slate-50 transition-colors group border-b border-slate-100">
                                                <td className="py-4 px-6 font-bold">{s.name}</td>
                                                <td className="py-4 px-6 font-mono text-[10px]">{s.code}</td>
                                                <td className="py-4 px-6">{s.group_name || '-'}</td>
                                                <td className="py-4 px-6"><span className={`badge badge-sm font-bold ${s.is_core ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>{s.is_core ? 'CORE' : 'ELECTIVE'}</span></td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="sm" className="text-primary hover:bg-white p-1" onClick={() => openEditSubject(s)} title="Edit Subject"><Edit size={12} /></Button>
                                                        <Button variant="ghost" size="sm" className="text-error hover:bg-white p-1" onClick={() => handleDeleteSubject(s.id)} title="Delete Subject"><Trash2 size={12} /></Button>
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
                    </div>

                    {/* Merged Syllabus Tracking */}
                    <div className="col-span-12 space-y-6 lg:space-y-8 fade-in mt-8 min-w-0">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 px-2">
                            <h3 className="text-lg font-black text-slate-800 uppercase mb-0 tracking-wider">Syllabus Tracking</h3>
                            {!isReadOnly && (
                                <Button variant="primary" size="sm" className="w-full md:w-auto font-black shadow-lg" onClick={() => { setEditingSyllabusId(null); setIsSyllabusModalOpen(true); }} icon={<Plus size={14} />}>RECORD COVERAGE</Button>
                            )}
                        </div>

                        <div className="fade-in card card-mobile-flat p-0 overflow-hidden min-w-0">
                            <div className="card-header">
                                <h3 className="mb-0 text-sm font-black uppercase">Curriculum Progress</h3>
                            </div>
                            <div className="p-0">
                                <div className="table-wrapper overflow-x-auto w-full block">
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
                                                            <td className="py-4 px-6 font-mono text-xs text-primary font-black">{s.coverage_percentage}%</td>
                                                            <td className="py-4 px-6">
                                                                <progress className={`progress w-full h-2 ${s.coverage_percentage > 80 ? 'progress-success' : s.coverage_percentage > 40 ? 'progress-warning' : 'progress-error'}`} value={s.coverage_percentage} max="100"></progress>
                                                            </td>
                                                            <td className="text-right">
                                                                {!isReadOnly && (
                                                                    <div className="flex justify-end gap-1">
                                                                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10" onClick={() => {
                                                                            const cls = classes.find(c => c.id === s.class_grade);
                                                                            setSyllabusForm({
                                                                                subject: s.subject.toString(),
                                                                                level: cls?.name || '',
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
                    </div>
                </div>
            )}

            {activeTab === 'ALLOCATION' && (
                <div className="grid grid-cols-12 gap-6 lg:gap-8 min-h-[60vh]">
                    <div className="col-span-12 lg:col-span-3 min-w-0 flex flex-col gap-4 overflow-y-auto pr-2">
                        <h3 className="text-xs font-black uppercase mb-0 tracking-widest text-slate-400">Select Class</h3>
                        <div className="space-y-2">
                            {classes.map(c => (
                                <div
                                    key={c.id}
                                    className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedAllocationClass === c.id.toString() ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 hover:border-primary/30 text-slate-600'}`}
                                    onClick={() => { setSelectedAllocationClass(c.id.toString()); fetchClassAllocations(c.id.toString()); }}
                                >
                                    <div className="font-black text-[11px] uppercase tracking-wider">{c.name} {c.stream}</div>
                                    <div className={`text-[10px] font-bold mt-1 ${selectedAllocationClass === c.id.toString() ? 'text-white/60' : 'text-slate-400'}`}>{c.student_count} Students</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-12 lg:col-span-9 min-w-0 flex flex-col">
                        {selectedAllocationClass ? (
                            <div className="card h-full flex flex-col min-w-0 overflow-hidden">
                                <div className="card-header">
                                    <div>
                                        <h3 className="mb-0 text-sm font-black uppercase">Class Subjects</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Manage subjects taught in this class</p>
                                    </div>
                                    <Button variant="primary" size="sm" className="font-black" onClick={syncClassSubjects} loading={isSyncing} loadingText="Syncing...">
                                        Sync to Students
                                    </Button>
                                </div>
                                <div className="p-0 table-wrapper overflow-x-auto overflow-y-auto w-full block flex-1 m-0">
                                    <table className="table min-w-[600px] border-collapse">
                                        <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm text-[10px] uppercase">
                                            <tr>
                                                <th className="py-4 px-6 w-20">Active</th>
                                                <th className="py-4 px-6 text-left">Subject Name</th>
                                                <th className="py-4 px-6">Code</th>
                                                <th className="py-4 px-6">Group</th>
                                                <th className="py-4 px-6 text-left">Assigned Teacher</th>
                                                <th className="py-4 px-6">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {subjects.map(subject => {
                                                const allocation = classAllocations.find(a => a.subject === subject.id);
                                                const isAllocated = !!allocation;
                                                return (
                                                    <tr key={subject.id} className={`hover:bg-slate-50 transition-colors ${isAllocated ? 'bg-success/5' : ''}`}>
                                                        <td className="py-4 px-6 text-center">
                                                            <input
                                                                type="checkbox"
                                                                className="checkbox checkbox-sm"
                                                                checked={isAllocated}
                                                                onChange={() => toggleClassSubject(subject.id, allocation?.id)}
                                                            />
                                                        </td>
                                                        <td className="py-4 px-6 font-bold text-xs">{subject.name}</td>
                                                        <td className="py-4 px-6"><code className="bg-slate-100 px-2 py-1 rounded text-[10px]">{subject.code}</code></td>
                                                        <td className="py-4 px-6 text-[10px] uppercase font-bold text-slate-400">{(subject as any).category || (subject as any).group_name || '-'}</td>
                                                        <td className="py-4 px-6 min-w-[200px]">
                                                            {isAllocated ? (
                                                                <SearchableSelect
                                                                    placeholder="Assign Teacher..."
                                                                    options={staff.filter(s => s.role === 'TEACHER').map(s => ({ id: (s.user || s.id).toString(), label: s.full_name }))}
                                                                    value={allocation?.teacher?.toString() || ''}
                                                                    onChange={(val) => updateAllocationTeacher(allocation.id, val.toString())}
                                                                />
                                                            ) : (
                                                                <span className="text-[10px] text-slate-300 italic">Select subject first</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            {isAllocated ?
                                                                <span className="badge badge-success text-[9px] font-black">ALLOCATED</span> :
                                                                <span className="badge badge-ghost text-[9px] font-black opacity-40">AVAILABLE</span>
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
                            <div className="card h-full flex flex-col items-center justify-center text-slate-300">
                                <Layers size={48} className="mb-4 opacity-20" />
                                <p className="font-black uppercase tracking-widest text-[11px]">Select a class to manage allocations</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'GRADING' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-lg min-h-[60vh]">
                    {/* Left: Systems List */}
                    <div className="card md:col-span-1 min-w-0 flex flex-col">
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
                                    <div className="flex justify-between items-center group/grad">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-xs">{sys.name}</span>
                                            <div className="text-[10px] text-secondary mt-1">{(sys as any).boundaries?.length || 0} Grade Boundaries</div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/grad:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); openEditGradeSystem(sys); }} className="p-1.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-primary transition-all"><Edit size={10} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteGradeSystem(sys.id); }} className="p-1.5 rounded bg-slate-100 text-slate-500 hover:bg-error-light hover:text-error transition-all"><Trash2 size={10} /></button>
                                        </div>
                                    </div>
                                    {sys.is_default && <span className="badge badge-success text-[8px] mt-2">DEFAULT</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Boundaries Table */}
                    <div className="card md:col-span-2 min-w-0 flex flex-col">
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
                                <div className="flex-1 table-wrapper overflow-x-auto w-full block p-0 min-w-0">
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
            )}

            {activeTab === 'EXAMS' && (
                <div className="grid grid-cols-12 gap-6 lg:gap-8">
                    {exams.filter(exam =>
                        !searchTerm ||
                        exam.name.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(exam => (
                        <div key={exam.id} className="col-span-12 md:col-span-6 lg:col-span-4 min-w-0">
                            <div className="card h-full flex flex-col p-6 overflow-hidden hover:shadow-2xl transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600"><ClipboardCheck size={16} /></div>
                                    <span className={`badge ${exam.is_active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'} text-[9px] font-black uppercase px-2 py-0.5 rounded`}>{exam.is_active ? 'ACTIVE' : 'LOCKED'}</span>
                                </div>
                                <h3 className="mb-1 text-sm font-black text-slate-900">{exam.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-wider">Wt: {exam.weighting}% | {exam.term_name || 'Active Term'}</p>
                                <div className="mt-auto grid grid-cols-2 gap-2">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className={`col-span-2 font-black shadow-lg ${!exam.is_active ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                        onClick={() => exam.is_active && openEnterResults(exam)}
                                        title={exam.is_active ? "Enter student marks" : "Results Entry is Locked"}
                                        disabled={!exam.is_active}
                                    >
                                        {exam.is_active ? 'ENTER RESULTS' : 'LOCKED'}
                                    </Button>
                                    <Button variant="outline" size="sm" className="font-black" onClick={() => openViewResults(exam)} title="View Ranking" icon={<Trophy size={12} />}>RANKING</Button>
                                    <Button variant="outline" size="sm" className="font-black" onClick={() => openEditExam(exam)} title="Exam Settings" icon={<Settings size={12} />}>SETTING</Button>
                                    <Button variant="ghost" size="sm" className="col-span-2 text-error font-black hover:bg-error/10 uppercase text-[9px]" onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id); }} title="Delete Exam" icon={<Trash2 size={12} />}>Remove Schedule</Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* Schedule Exam card */}
                    {!isReadOnly && (
                        <div className="col-span-12 md:col-span-6 lg:col-span-4 min-w-0">
                            <div className="card border-dashed flex flex-col items-center justify-center p-8 cursor-pointer hover:border-amber-500 group h-full transition-colors" onClick={openCreateExam}>
                                <Calendar size={28} className="text-slate-300 group-hover:text-amber-500 transition-all mb-2" />
                                <span className="text-xs font-black uppercase text-slate-400 group-hover:text-slate-600">Schedule Exam</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* View Results Modal */}
            <Modal isOpen={isViewResultsModalOpen} onClose={() => setIsViewResultsModalOpen(false)} title="Examination Results & Ranking" size="lg">
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-xl gap-4">
                        <div>
                            <h3 className="font-black text-sm uppercase text-slate-800 tracking-wider mb-0">{selectedExam?.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Performance Summary & Rankings</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase text-slate-400 mb-1">Level</span>
                                <SearchableSelect
                                    placeholder="All Levels"
                                    options={uniqueClassNames.map(name => ({ id: name, label: name }))}
                                    value={rankingFilter.level}
                                    onChange={(val) => setRankingFilter({ ...rankingFilter, level: val.toString(), classId: '' })}
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase text-slate-400 mb-1">Stream</span>
                                <SearchableSelect
                                    placeholder="All Streams"
                                    options={classes.filter(c => c.name === rankingFilter.level).map(c => ({ id: c.id.toString(), label: c.stream }))}
                                    value={rankingFilter.classId}
                                    onChange={(val) => setRankingFilter({ ...rankingFilter, classId: val.toString() })}
                                />
                            </div>
                            <Button variant="outline" size="sm" className="no-print font-black uppercase text-[10px] h-8 mt-4 bg-white" onClick={() => window.print()} title="Print Ranking Report" icon={<Printer size={14} />}>
                                PRINT
                            </Button>
                        </div>
                    </div>

                    <div className="max-h-60vh overflow-y-auto">
                        {Object.keys(groupedResults).sort().map(groupKey => (
                            <div key={groupKey} className="mb-8 card p-0 overflow-hidden border-slate-100 shadow-sm">
                                <div className="card-header bg-slate-50/50">
                                    <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-widest mb-0">{groupKey}</h4>
                                    <span className="badge bg-slate-200 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full">{groupedResults[groupKey].length} CANDIDATES</span>
                                </div>
                                <div className="table-wrapper overflow-x-auto w-full block m-0">
                                    <table className="table min-w-[800px]">
                                        <thead className="bg-white text-[10px] uppercase font-black text-slate-400">
                                            <tr>
                                                <th className="py-4 px-6 w-16">Rank</th>
                                                <th className="py-4 px-6 min-w-[200px] text-left">Student Name</th>
                                                <th className="py-4 px-6">ADM</th>
                                                {subjects.filter((sub: any) => groupedResults[groupKey].some((r: any) => r.scores && r.scores[sub.id])).map((sub: any) => (
                                                    <th key={sub.id} className="py-4 px-6 text-center" title={sub.name}>{getSubjectAbbr(sub)}</th>
                                                ))}
                                                <th className="py-4 px-6 text-right">Total</th>
                                                <th className="py-4 px-6 text-right">Mean</th>
                                                <th className="py-4 px-6 text-center">Grade</th>
                                                <th className="py-4 px-6 text-right no-print">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {groupedResults[groupKey].sort((a: any, b: any) => b.totalScore - a.totalScore).map((res: any, index: number) => (
                                                <tr key={res.student} className={`hover:bg-slate-50 transition-colors group ${index < 3 ? 'bg-amber-50/30' : ''}`}>
                                                    <td className="py-4 px-6">
                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 text-white' : index === 2 ? 'bg-amber-700/50 text-white' : 'text-slate-400'}`}>
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="font-black text-xs text-slate-900">{res.student_name}</div>
                                                    </td>
                                                    <td className="py-4 px-6 font-mono text-[10px] text-slate-400">{res.admission_number}</td>
                                                    {subjects.filter((sub: any) => groupedResults[groupKey].some((r: any) => r.scores && r.scores[sub.id])).map((sub: any) => (
                                                        <td key={sub.id} className="py-4 px-6 text-center text-[11px] font-black text-slate-600">
                                                            {res.scores[sub.id] !== undefined ? `${res.scores[sub.id]}%` : '—'}
                                                        </td>
                                                    ))}
                                                    <td className="py-4 px-6 text-right font-black text-slate-900">{res.totalScore}</td>
                                                    <td className="py-4 px-6 text-right font-black text-primary">{res.meanScore}%</td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${['A', 'A-'].includes(res.meanGrade) ? 'bg-success/20 text-success' : ['D', 'E'].includes(res.meanGrade) ? 'bg-error/20 text-error' : 'bg-slate-100 text-slate-400'}`}>{res.meanGrade || '-'}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right no-print">
                                                        <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-all">
                                                            <Button variant="ghost" size="sm" className="p-1 h-7 w-7 text-primary hover:bg-primary/10" title="Edit Results" onClick={() => {
                                                                setResultContext({ level: res.form_level, classId: res.classId.toString(), subjectId: 'all' });
                                                                setIsViewResultsModalOpen(false);
                                                                setIsResultModalOpen(true);
                                                            }} icon={<Edit size={12} />} />
                                                            <Button variant="ghost" size="sm" className="p-1 h-7 w-7 text-error hover:bg-error/10" title="Delete All Results" onClick={() => handleDeleteStudentResults(res.student)} icon={<Trash2 size={12} />} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                        {Object.keys(groupedResults).length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center opacity-30">
                                <Trophy size={64} className="mb-4" />
                                <p className="font-black uppercase tracking-widest text-xs">No examination data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {
                activeTab === 'RESOURCES' && (
                    <div className="grid grid-cols-12 gap-6 lg:gap-8">
                        <div className="col-span-12 lg:col-span-8 min-w-0 flex flex-col gap-6">
                            {/* Grading Systems Section */}
                            <div className="card p-0 overflow-hidden shadow-xl border-none">
                                <div className="card-header bg-slate-900 text-white">
                                    <h3 className="mb-0 text-sm font-black uppercase tracking-wider">Institutional Grading</h3>
                                    <Button variant="primary" size="sm" className="font-black px-4 bg-white text-slate-900 border-none hover:bg-slate-100" onClick={() => setIsGradeModalOpen(true)} icon={<Plus size={14} />}>NEW SYSTEM</Button>
                                </div>
                                <div className="card-body p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {gradeSystems.map(gs => (
                                        <div
                                            key={gs.id}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer group ${selectedSystem?.id === gs.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-slate-100 hover:border-primary/30 text-slate-600'}`}
                                            onClick={() => {
                                                setSelectedSystem(gs);
                                                setBoundaryForm(prev => ({ ...prev, system: gs.id }));
                                            }}
                                        >
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-[11px] uppercase tracking-wider">{gs.name}</span>
                                                    {gs.is_default && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${selectedSystem?.id === gs.id ? 'bg-white/20 text-white' : 'bg-success/20 text-success'}`}>DEFAULT</span>}
                                                </div>
                                                <div className="flex gap-1 opacity-100 items-center">
                                                    <Button variant="ghost" size="sm" className={`p-1 ${selectedSystem?.id === gs.id ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-primary'}`} title="Edit System" onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditGradeSystem(gs);
                                                    }} icon={<Edit size={12} />} />
                                                    <Button variant="ghost" size="sm" className={`p-1 ${selectedSystem?.id === gs.id ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-primary'}`} title="Add Boundary" onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedSystem(gs);
                                                        setBoundaryForm(prev => ({ ...prev, system: gs.id }));
                                                        setIsBoundaryModalOpen(true);
                                                    }} icon={<Plus size={14} />} />
                                                    <Button variant="ghost" size="sm" className={`p-1 ${selectedSystem?.id === gs.id ? 'text-white/60 hover:text-error' : 'text-slate-400 hover:text-error'}`} title="Delete System" onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteGradeSystem(gs.id);
                                                    }} icon={<Trash2 size={12} />} />
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {gs.boundaries?.slice(0, 6).sort((a: any, b: any) => b.min_score - a.min_score).map((b: any) => (
                                                    <div key={b.id} className={`flex items-baseline gap-1 px-2 py-1 rounded-lg border ${selectedSystem?.id === gs.id ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                                                        <span className={`text-[11px] font-black ${selectedSystem?.id === gs.id ? 'text-white' : 'text-slate-700'}`}>{b.grade}</span>
                                                        <span className={`text-[9px] font-bold ${selectedSystem?.id === gs.id ? 'text-white/70' : 'text-slate-400'}`}>{b.min_score}+</span>
                                                    </div>
                                                ))}
                                                {gs.boundaries && gs.boundaries.length > 6 && <span className="text-[10px] font-black px-2 py-1 flex items-center text-slate-400">+{gs.boundaries.length - 6} more</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Boundaries Table (Shown when a system is selected) */}
                            {selectedSystem && (
                                <div className="card p-0 overflow-hidden shadow-2xl border-slate-100 fade-in">
                                    <div className="card-header bg-slate-50 border-bottom">
                                        <div>
                                            <h3 className="mb-0 text-xs font-black uppercase text-slate-800 tracking-widest">{selectedSystem.name} Scale</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            {!selectedSystem.is_default && (
                                                <Button variant="outline" size="sm" className="font-black text-[10px]" onClick={async () => {
                                                    try {
                                                        await academicsAPI.gradeSystems.update(selectedSystem.id, { is_default: true });
                                                        success('System set as default');
                                                        loadAllAcademicData();
                                                    } catch (err: any) { toastError(err.message); }
                                                }}>SET AS DEFAULT</Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="table-wrapper overflow-x-auto w-full block m-0">
                                        <table className="table min-w-[600px]">
                                            <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400">
                                                <tr>
                                                    <th className="py-4 px-6 text-left">Grade</th>
                                                    <th className="py-4 px-6">Score Range</th>
                                                    <th className="py-4 px-6 text-center">Points</th>
                                                    <th className="py-4 px-6 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedSystem.boundaries?.sort((a: any, b: any) => b.min_score - a.min_score).map((b: any) => (
                                                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="py-4 px-6 font-black text-slate-900">{b.grade}</td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-[11px] font-black px-2 py-1 bg-slate-100 rounded text-slate-600">{b.min_score}</span>
                                                                <span className="text-slate-300">→</span>
                                                                <span className="font-mono text-[11px] font-black px-2 py-1 bg-slate-100 rounded text-slate-600">{b.max_score}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 text-center font-black text-primary">{b.points}</td>
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="ghost" size="sm" className="text-primary" onClick={() => { setBoundaryForm({ ...b, system: selectedSystem.id }); setEditingBoundaryId(b.id); setIsBoundaryModalOpen(true); }} icon={<Edit size={14} />} />
                                                                <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDeleteBoundary(b.id)} icon={<Trash2 size={14} />} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="col-span-12 lg:col-span-4 min-w-0">
                            <div className="card p-0 overflow-hidden shadow-xl border-slate-100 sticky top-4">
                                <div className="card-header bg-slate-50 border-bottom">
                                    <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-slate-800">Cycles & Terms</h3>
                                    <Button variant="outline" size="sm" className="p-2 border-slate-200" onClick={() => setIsYearModalOpen(true)} icon={<Plus size={14} />} />
                                </div>
                                <div className="card-body p-4 space-y-4">
                                    {academicYears.map(y => (
                                        <div key={y.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-white transition-all group">
                                            <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${y.is_active ? 'bg-success text-white shadow-lg shadow-success/30' : 'bg-slate-100 text-slate-400 hover:bg-success/10 hover:text-success'}`}
                                                        onClick={() => handleSetActiveYear(y)}
                                                        title={y.is_active ? "This is the CURRENT Active Cycle" : "Click to set as Active Cycle"}
                                                    >
                                                        {y.is_active ? <CheckSquare size={18} /> : null}
                                                    </button>
                                                    <div>
                                                        <span className="block font-black text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Academic Cycle</span>
                                                        <span className="block font-black text-sm text-slate-800">{y.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200" onClick={() => { setTermForm({ year: y.id.toString(), name: '', start_date: '', end_date: '', is_active: false }); setEditingTermId(null); setIsTermModalOpen(true); }} icon={<Plus size={14} />} title="Add Term" />
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-primary" onClick={() => openEditYear(y)} icon={<Edit size={14} />} title="Edit Year" />
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-error" onClick={() => handleDeleteYear(y.id)} icon={<Trash2 size={14} />} title="Delete Year" />
                                                </div>
                                            </div>
                                            <div className="space-y-2 mt-2">
                                                <div className="flex items-center justify-between px-1 mb-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Enrolled Terms</span>
                                                    <span className="text-[9px] font-black text-slate-300">{terms.filter(t => t.year === y.id).length} Active</span>
                                                </div>
                                                {terms.filter(t => t.year === y.id).map(t => (
                                                    <div key={t.id} className="flex justify-between items-center text-[10px] bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:border-primary/20 transition-all group/term relative">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                className={`transition-colors ${t.is_active ? 'text-success' : 'text-slate-300 hover:text-primary'}`}
                                                                onClick={() => handleSetActiveTerm(t)}
                                                                title={t.is_active ? "Current Active Term" : "Set as Active"}
                                                            >
                                                                {t.is_active ? <CheckSquare size={14} /> : null}
                                                            </button>
                                                            <span className="font-bold text-slate-600 uppercase">{t.name}</span>
                                                            {new Date() > new Date(t.end_date) && !t.is_active && (
                                                                <span className="ml-2 text-[8px] font-black px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded">CLOSED</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="absolute right-3 flex gap-1 bg-white opacity-0 group-hover/term:opacity-100 transition-opacity pl-2 shadow-[-8px_0_8px_white]">
                                                                <Button variant="ghost" size="sm" className="text-primary p-1" onClick={() => openEditTerm(t)} icon={<Edit size={12} />} title="Edit Term" />
                                                                <Button variant="ghost" size="sm" className="text-error p-1" onClick={() => handleDeleteTerm(t.id)} icon={<Trash2 size={12} />} title="Delete Term" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {terms.filter(t => t.year === y.id).length === 0 && <p className="text-[10px] text-slate-400 italic text-center py-2 uppercase font-bold tracking-tighter">No terms defined</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}


            {activeTab === 'ATTENDANCE' && (
                <div className="overflow-hidden shadow-lg mb-8 border rounded-2xl">
                    <div className="p-4 bg-secondary-light flex flex-col sm:flex-row justify-between items-start sm:items-center border-bottom gap-4">
                        <div className="flex items-center gap-4">
                            <h3 className="mb-0 text-xs font-black uppercase tracking-wider">Attendance Register</h3>
                            <div className="flex gap-2">
                                <div className="w-40">
                                    <SearchableSelect
                                        options={[
                                            { id: 'date', label: 'Sort by Date' },
                                            { id: 'student', label: 'Sort by Student' },
                                            { id: 'class', label: 'Sort by Class' },
                                            { id: 'stream', label: 'Sort by Stream' }
                                        ]}
                                        value={attendanceSort.field}
                                        onChange={(val) => setAttendanceSort({ ...attendanceSort, field: val.toString() })}
                                    />
                                </div>
                                <div className="w-48">
                                    <SearchableSelect
                                        options={[
                                            { id: 'desc', label: 'Descending (Newest/Z-A)' },
                                            { id: 'asc', label: 'Ascending (Oldest/A-Z)' }
                                        ]}
                                        value={attendanceSort.direction}
                                        onChange={(val) => setAttendanceSort({ ...attendanceSort, direction: val as 'asc' | 'desc' })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-white shadow-sm" onClick={handleExportAcademics} loading={isExporting} loadingText="Exporting...">Export CSV</Button>
                            <Button variant="primary" size="sm" className="flex-1 sm:flex-none shadow-sm" onClick={() => { setEditingAttendanceId(null); setAttendanceForm({ student: '', status: 'PRESENT', remark: '', date: new Date().toISOString().split('T')[0] }); setIsAttendanceModalOpen(true); }} icon={<Plus size={14} />}>Log Status</Button>
                        </div>
                    </div>
                    <div className="table-wrapper overflow-x-auto w-full block m-0">
                        <table className="table table-sm min-w-[800px]">
                            <thead className="bg-secondary-light/30 text-secondary">
                                <tr>
                                    <th>Date</th>
                                    <th>Student</th>
                                    <th>Class / Section</th>
                                    <th>Status</th>
                                    <th>Remarks</th>
                                    <th className="text-right sticky right-0 bg-white/90">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceRecords.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center p-8 text-secondary italic">No attendance records found. Use "Log Status" to add entries.</td></tr>
                                ) : (
                                    (() => {
                                        const groupedAtt = attendanceRecords.reduce((acc: any, att: any) => {
                                            const student = students.find(s => s.id === att.student);
                                            const cls = classes.find(c => c.id === student?.current_class);
                                            const groupKey = cls ? `${cls.name} ${cls.stream}` : 'Unassigned';
                                            if (!acc[groupKey]) acc[groupKey] = [];
                                            acc[groupKey].push({ ...att, student_name: student?.full_name, class_name: groupKey });
                                            return acc;
                                        }, {});

                                        return Object.keys(groupedAtt).sort().map(groupKey => (
                                            <React.Fragment key={groupKey}>
                                                <tr className="bg-slate-50">
                                                    <td colSpan={6} className="py-2 px-6 text-[10px] font-black uppercase text-secondary tracking-widest">{groupKey}</td>
                                                </tr>
                                                {groupedAtt[groupKey].map((att: any) => (
                                                    <tr key={att.id} className="hover:bg-blue-50/50">
                                                        <td className="font-mono text-xs">{att.date}</td>
                                                        <td>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-xs">{att.student_name || 'Unknown'}</span>
                                                                <span className="text-[9px] text-secondary">ADM_NOT_STORED</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-xs text-primary">{att.class_name}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge badge-sm font-bold ${att.status === 'PRESENT' ? 'badge-success text-white' : att.status === 'ABSENT' ? 'badge-error text-white' : 'badge-warning'}`}>
                                                                {att.status}
                                                            </span>
                                                        </td>
                                                        <td className="text-xs">{att.remark || '—'}</td>
                                                        <td className="text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="ghost" size="sm" className="text-primary" onClick={() => openEditAttendance(att)} icon={<Edit size={12} />} />
                                                                <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDeleteAttendance(att.id)} icon={<Trash2 size={12} />} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ));
                                    })()
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals Section */}
            <YearModal
                isOpen={isYearModalOpen}
                onClose={() => setIsYearModalOpen(false)}
                yearForm={yearForm}
                setYearForm={setYearForm}
                handleYearSubmit={handleYearSubmit}
                isSubmitting={isSubmitting}
            />

            <TermModal
                isOpen={isTermModalOpen}
                onClose={() => setIsTermModalOpen(false)}
                termForm={termForm}
                setTermForm={setTermForm}
                academicYears={academicYears}
                handleTermSubmit={handleTermSubmit}
                isSubmitting={isSubmitting}
            />

            <ClassModal
                isOpen={isClassModalOpen}
                onClose={() => setIsClassModalOpen(false)}
                classForm={classForm}
                setClassForm={setClassForm}
                staff={staff}
                handleClassSubmit={handleClassSubmit}
                isSubmitting={isSubmitting}
                editingClassId={editingClassId}
            />

            <GroupModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                groupForm={groupForm}
                setGroupForm={setGroupForm}
                handleGroupSubmit={handleGroupSubmit}
                isSubmitting={isSubmitting}
                editingGroupId={editingGroupId}
            />

            <SubjectModal
                isOpen={isSubjectModalOpen}
                onClose={() => setIsSubjectModalOpen(false)}
                subjectForm={subjectForm}
                setSubjectForm={setSubjectForm}
                subjectGroups={subjectGroups}
                handleSubjectSubmit={handleSubjectSubmit}
                isSubmitting={isSubmitting}
            />

            <AttendanceModal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                attendanceForm={attendanceForm}
                setAttendanceForm={setAttendanceForm}
                attendanceFilter={attendanceFilter}
                setAttendanceFilter={setAttendanceFilter}
                bulkAttendanceList={bulkAttendanceList}
                setBulkAttendanceList={setBulkAttendanceList}
                studentOptions={studentOptions}
                uniqueClassNames={uniqueClassNames}
                classes={classes}
                students={students}
                handleAttendanceSubmit={handleAttendanceSubmit}
                isSubmitting={isSubmitting}
            />

            <ExamModal
                isOpen={isExamModalOpen}
                onClose={() => setIsExamModalOpen(false)}
                examForm={examForm}
                setExamForm={setExamForm}
                handleExamSubmit={handleExamSubmit}
                terms={terms}
                gradeSystems={gradeSystems}
                isSubmitting={isSubmitting}
            />

            <SyllabusModal
                isOpen={isSyllabusModalOpen}
                onClose={() => setIsSyllabusModalOpen(false)}
                syllabusForm={syllabusForm}
                setSyllabusForm={setSyllabusForm}
                handleSyllabusSubmit={handleSyllabusSubmit}
                uniqueClassNames={uniqueClassNames}
                classes={classes}
                subjects={subjects}
                isSubmitting={isSubmitting}
            />

            <RankingModal
                isOpen={isViewResultsModalOpen}
                onClose={() => setIsViewResultsModalOpen(false)}
                selectedExam={selectedExam}
                rankingFilter={rankingFilter}
                setRankingFilter={setRankingFilter}
                uniqueClassNames={uniqueClassNames}
                classes={classes}
                subjects={subjects}
                examResults={examResults}
                gradeSystems={gradeSystems}
                handleDeleteStudentResults={handleDeleteStudentResults}
                setIsResultModalOpen={setIsResultModalOpen}
                setResultContext={setResultContext}
            />

            <ExamBroadsheet
                isOpen={isBroadsheetModalOpen}
                onClose={() => setIsBroadsheetModalOpen(false)}
                selectedExam={selectedExam}
                students={students}
                classes={classes}
                subjects={subjects}
                examResults={examResults}
                gradeSystems={gradeSystems}
                uniqueClassNames={uniqueClassNames}
            />

            <ResultEntryModal
                isOpen={isResultModalOpen}
                onClose={() => setIsResultModalOpen(false)}
                selectedExam={selectedExam}
                resultContext={resultContext}
                setResultContext={setResultContext}
                uniqueClassNames={uniqueClassNames}
                classes={classes}
                subjects={subjects}
                filteredResultStudents={filteredResultStudents}
                studentScores={studentScores}
                handleScoreChange={handleScoreChange}
                handleDeleteSingleResult={handleDeleteSingleResult}
                activeClassSubjects={activeClassSubjects}
                gradeSystems={gradeSystems}
                handleBulkResultSubmit={handleBulkResultSubmit}
                isSubmitting={isSubmitting}
            />

            <ViewClassModal
                isOpen={isViewClassModalOpen}
                onClose={() => setIsViewClassModalOpen(false)}
                selectedClass={selectedClass}
                viewClassStudents={viewClassStudents}
            />

            <ConfirmDeleteModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, type: null, id: null })}
                executeDelete={executeDelete}
                isSubmitting={isSubmitting}
            />

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />

            <GradeSystemModal
                isOpen={isGradeModalOpen}
                onClose={() => setIsGradeModalOpen(false)}
                editingSystemId={editingSystemId}
                gradeForm={gradeForm}
                setGradeForm={setGradeForm}
                handleGradeSystemSubmit={handleGradeSystemSubmit}
                isSubmitting={isSubmitting}
            />

            <BoundaryModal
                isOpen={isBoundaryModalOpen}
                onClose={() => setIsBoundaryModalOpen(false)}
                editingBoundaryId={editingBoundaryId}
                boundaryForm={boundaryForm}
                setBoundaryForm={setBoundaryForm}
                handleBoundarySubmit={handleBoundarySubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default Academics;

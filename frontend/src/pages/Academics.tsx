import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { academicsAPI, studentsAPI, staffAPI } from '../api/api';
import { GraduationCap, Calendar, Award, ShieldAlert } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import type {
    AcademicYear, Term, ClassUnit, Subject,
    Exam, GradeSystem
} from '../types/academic.types';
import type { Student } from '../types/student.types';
import { calculateMeanGrade, calculateGrade } from '../utils/academicHelpers';

// Sub-components
import AcademicSummary from './academics/AcademicSummary';
import ClassManager from './academics/ClassManager';
import CurriculumManager from './academics/CurriculumManager';
import AllocationManager from './academics/AllocationManager';
import GradingSystemManager from './academics/GradingSystemManager';
import ExamManager from './academics/ExamManager';
import AcademicModals from './academics/AcademicModals';

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
    // Derived / memoised
    const uniqueClassNames = useMemo(() => Array.from(new Set(classes.map(c => c.name))).sort(), [classes]);

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

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isViewClassModalOpen, setIsViewClassModalOpen] = useState(false);
    const [bulkAttendanceList, setBulkAttendanceList] = useState<any[]>([]);

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

            // Compute mean grade from freshly fetched data (avoids stale state)
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
                const [, studentRes] = await Promise.all([
                    academicsAPI.attendance.getAll({ page_size: 500, ordering: '-date' }),
                    studentsAPI.getAll({ page_size: 200 })
                ]);
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

    const openEditGradeSystem = (gs: any) => {
        setGradeForm({ name: gs.name, is_default: gs.is_default });
        setEditingSystemId(gs.id);
        setIsGradeModalOpen(true);
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
                await academicsAPI.attendance.getAll();
                // Attendance is handled via modal / backend refresh
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

    const handleDeleteSyllabus = async (id: number) => {
        if (await confirm('Delete this syllabus item?', { type: 'danger' })) {
            try {
                await academicsAPI.syllabus.delete(id);
                success('Syllabus item deleted');
                loadAllAcademicData();
            } catch (err: any) { toastError(err.message || 'Delete failed'); }
        }
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
            // Refresh logic:
            const res = await academicsAPI.results.getAll({ exam_id: selectedExam.id });
            const rData = res.data?.results ?? res.data ?? [];
            setExamResults(rData);
        } catch (err: any) {
            toastError(err.message || 'Failed to clear results');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteExam = async (id: number) => {
        if (await confirm('Delete this exam? This will permanently remove all associated results.', { type: 'danger' })) {
            try {
                await academicsAPI.exams.delete(id);
                success('Exam deleted');
                loadAllAcademicData();
            } catch (err: any) { toastError(err.message || 'Delete failed'); }
        }
    };

    const handleDeleteGradeSystem = async (id: number) => {
        if (await confirm('Remove this grading policy?', { type: 'danger' })) {
            try {
                await academicsAPI.gradeSystems.delete(id);
                success('Grading policy removed');
                loadAllAcademicData();
            } catch (err: any) { toastError(err.message || 'Delete failed'); }
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
                <AcademicSummary
                    classes={classes}
                    subjectGroups={subjectGroups}
                    exams={exams}
                    meanGrade={meanGrade}
                    syllabusData={syllabusData}
                    setActiveTab={tab => setActiveTab(tab as any)}
                    setIsSyllabusModalOpen={setIsSyllabusModalOpen}
                    setSyllabusForm={setSyllabusForm}
                    setEditingSyllabusId={setEditingSyllabusId}
                    openViewResults={openViewResults}
                />
            )}


            {activeTab === 'CLASSES' && (
                <ClassManager
                    classes={classes}
                    searchTerm={searchTerm}
                    setIsClassModalOpen={setIsClassModalOpen}
                    openEditClass={openEditClass}
                    openViewClass={openViewClass}
                />
            )}

            {activeTab === 'CURRICULUM' && (
                <CurriculumManager
                    subjectGroups={subjectGroups}
                    subjects={subjects}
                    syllabusData={syllabusData}
                    classes={classes}
                    isReadOnly={isReadOnly}
                    setIsGroupModalOpen={setIsGroupModalOpen}
                    setGroupForm={setGroupForm}
                    setEditingGroupId={setEditingGroupId}
                    openEditGroup={openEditGroup}
                    handleDeleteGroup={handleDeleteGroup}
                    setIsSubjectModalOpen={setIsSubjectModalOpen}
                    openEditSubject={openEditSubject}
                    handleDeleteSubject={handleDeleteSubject}
                    setIsSyllabusModalOpen={setIsSyllabusModalOpen}
                    setSyllabusForm={setSyllabusForm}
                    setEditingSyllabusId={setEditingSyllabusId}
                    handleDeleteSyllabus={handleDeleteSyllabus}
                />
            )}

            {activeTab === 'ALLOCATION' && (
                <AllocationManager
                    classes={classes}
                    subjects={subjects}
                    staff={staff}
                    selectedAllocationClass={selectedAllocationClass}
                    setSelectedAllocationClass={setSelectedAllocationClass}
                    classAllocations={classAllocations}
                    fetchClassAllocations={fetchClassAllocations}
                    syncClassSubjects={syncClassSubjects}
                    isSyncing={isSyncing}
                    toggleClassSubject={toggleClassSubject}
                    updateAllocationTeacher={updateAllocationTeacher}
                />
            )}

            {activeTab === 'GRADING' && (
                <GradingSystemManager
                    gradeSystems={gradeSystems}
                    selectedSystem={selectedSystem}
                    setSelectedSystem={setSelectedSystem}
                    setIsGradeModalOpen={setIsGradeModalOpen}
                    openEditGradeSystem={openEditGradeSystem}
                    handleDeleteGradeSystem={handleDeleteGradeSystem}
                    setIsBoundaryModalOpen={setIsBoundaryModalOpen}
                    setBoundaryForm={setBoundaryForm}
                    setEditingBoundaryId={setEditingBoundaryId}
                    handleDeleteBoundary={handleDeleteBoundary}
                />
            )}

            {activeTab === 'EXAMS' && (
                <ExamManager
                    exams={exams}
                    searchTerm={searchTerm}
                    openEnterResults={openEnterResults}
                    openViewResults={openViewResults}
                    openEditExam={openEditExam}
                    handleDeleteExam={handleDeleteExam}
                    openCreateExam={openCreateExam}
                />
            )}

            <AcademicModals
                modals={{
                    isYearModalOpen, isTermModalOpen, isClassModalOpen, isGroupModalOpen,
                    isSubjectModalOpen, isAttendanceModalOpen, isExamModalOpen,
                    isSyllabusModalOpen, isViewResultsModalOpen, isBroadsheetModalOpen,
                    isResultModalOpen, isViewClassModalOpen, isReportModalOpen,
                    isGradeModalOpen, isBoundaryModalOpen
                }}
                forms={{
                    yearForm, termForm, classForm, groupForm, subjectForm,
                    attendanceForm, examForm, syllabusForm, boundaryForm,
                    gradeForm, attendanceFilter, rankingFilter, resultContext
                }}
                data={{
                    academicYears, terms, classes, subjects, subjectGroups,
                    gradeSystems, staff, students, selectedExam, examResults,
                    viewClassStudents, selectedClass, bulkAttendanceList,
                    studentOptions, uniqueClassNames, filteredResultStudents,
                    studentScores, activeClassSubjects
                }}
                handlers={{
                    setIsYearModalOpen, setIsTermModalOpen, setIsClassModalOpen,
                    setIsGroupModalOpen, setIsSubjectModalOpen, setIsAttendanceModalOpen,
                    setIsExamModalOpen, setIsSyllabusModalOpen, setYearForm,
                    setTermForm, setClassForm, setGroupForm, setSubjectForm,
                    setAttendanceForm, setExamForm, setSyllabusForm,
                    setAttendanceFilter, setBulkAttendanceList, setIsViewResultsModalOpen,
                    setRankingFilter, setIsBroadsheetModalOpen, setIsResultModalOpen,
                    setResultContext, setIsViewClassModalOpen,
                    setIsReportModalOpen, setIsGradeModalOpen, setGradeForm,
                    setIsBoundaryModalOpen, setBoundaryForm, handleYearSubmit,
                    handleTermSubmit, handleClassSubmit, handleGroupSubmit,
                    handleSubjectSubmit, handleAttendanceSubmit, handleExamSubmit,
                    handleSyllabusSubmit, handleGradeSystemSubmit, handleBoundarySubmit,
                    handleDeleteSingleResult, handleBulkResultSubmit, handleDeleteSyllabus,
                    handleScoreChange, handleDeleteStudentResults
                }}
                status={{
                    isSubmitting, editingClassId, editingGroupId,
                    editingSystemId, editingBoundaryId
                }}
            />
        </div>
    );
};

export default Academics;

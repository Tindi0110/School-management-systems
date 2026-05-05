import React from 'react';
import { YearModal, TermModal } from '../../components/academics/AcademicPeriodModals';
import { ClassModal, GroupModal, SubjectModal } from '../../components/academics/AcademicStructureModals';
import { AttendanceModal } from '../../components/academics/AcademicAttendanceModals';
import { ExamModal, SyllabusModal, RankingModal } from '../../components/academics/AcademicAssessmentModals';
import { ResultEntryModal } from '../../components/academics/ResultEntryModal';
import { ViewClassModal, ReportModal } from '../../components/academics/AcademicReviewModals';
import { GradeSystemModal, BoundaryModal } from '../../components/academics/AcademicGradingModals';
import ExamBroadsheet from '../../components/academics/ExamBroadsheet';

interface AcademicModalsProps {
    modals: {
        isYearModalOpen: boolean;
        isTermModalOpen: boolean;
        isClassModalOpen: boolean;
        isGroupModalOpen: boolean;
        isSubjectModalOpen: boolean;
        isAttendanceModalOpen: boolean;
        isExamModalOpen: boolean;
        isSyllabusModalOpen: boolean;
        isViewResultsModalOpen: boolean;
        isBroadsheetModalOpen: boolean;
        isResultModalOpen: boolean;
        isViewClassModalOpen: boolean;
        isReportModalOpen: boolean;
        isGradeModalOpen: boolean;
        isBoundaryModalOpen: boolean;

    };
    forms: {
        yearForm: any;
        termForm: any;
        classForm: any;
        groupForm: any;
        subjectForm: any;
        attendanceForm: any;
        examForm: any;
        syllabusForm: any;
        boundaryForm: any;
        gradeForm: any;
        attendanceFilter: any;
        rankingFilter: any;
        resultContext: any;
    };
    data: {
        academicYears: any[];
        terms: any[];
        classes: any[];
        subjects: any[];
        subjectGroups: any[];
        gradeSystems: any[];
        staff: any[];
        students: any[];
        selectedExam: any;
        examResults: any[];
        viewClassStudents: any[];
        selectedClass: any;
        bulkAttendanceList: any[];
        studentOptions: any[];
        uniqueClassNames: any[];
        filteredResultStudents: any[];
        studentScores: any;
        activeClassSubjects: any[];
    };
    handlers: {
        setIsYearModalOpen: (val: boolean) => void;
        setIsTermModalOpen: (val: boolean) => void;
        setIsClassModalOpen: (val: boolean) => void;
        setIsGroupModalOpen: (val: boolean) => void;
        setIsSubjectModalOpen: (val: boolean) => void;
        setIsAttendanceModalOpen: (val: boolean) => void;
        setIsExamModalOpen: (val: boolean) => void;
        setIsSyllabusModalOpen: (val: boolean) => void;
        setYearForm: (val: any) => void;
        setTermForm: (val: any) => void;
        setClassForm: (val: any) => void;
        setGroupForm: (val: any) => void;
        setSubjectForm: (val: any) => void;
        setAttendanceForm: (val: any) => void;
        setExamForm: (val: any) => void;
        setSyllabusForm: (val: any) => void;
        setAttendanceFilter: (val: any) => void;
        setBulkAttendanceList: (val: any) => void;
        setIsViewResultsModalOpen: (val: boolean) => void;
        setRankingFilter: (val: any) => void;
        setIsBroadsheetModalOpen: (val: boolean) => void;
        setIsResultModalOpen: (val: boolean) => void;
        setResultContext: (val: any) => void;
        setIsViewClassModalOpen: (val: boolean) => void;

        setIsReportModalOpen: (val: boolean) => void;
        setIsGradeModalOpen: (val: boolean) => void;
        setGradeForm: (val: any) => void;
        setIsBoundaryModalOpen: (val: boolean) => void;
        setBoundaryForm: (val: any) => void;
        handleYearSubmit: (e: any) => void;
        handleTermSubmit: (e: any) => void;
        handleClassSubmit: (e: any) => void;
        handleGroupSubmit: (e: any) => void;
        handleSubjectSubmit: (e: any) => void;
        handleAttendanceSubmit: (e: any) => void;
        handleExamSubmit: (e: any) => void;
        handleSyllabusSubmit: (e: any) => void;
        handleDeleteSyllabus: (id: number) => void;
        handleGradeSystemSubmit: (e: any) => void;
        handleBoundarySubmit: (e: any) => void;
        handleDeleteSingleResult: (studentId: number, subjectId: number, resultId: number) => void;
        handleDeleteStudentResults: (studentId: number) => void;
        handleScoreChange: (studentId: any, subjectId: any, val: string) => void;
        handleBulkResultSubmit: (e: any) => void;

    };
    status: {
        isSubmitting: boolean;
        editingClassId: number | null;
        editingGroupId: number | null;
        editingSystemId: number | null;
        editingBoundaryId: number | null;
    };
}

const AcademicModals: React.FC<AcademicModalsProps> = ({ modals, forms, data, handlers, status }) => {
    return (
        <>
            <YearModal
                isOpen={modals.isYearModalOpen}
                onClose={() => handlers.setIsYearModalOpen(false)}
                yearForm={forms.yearForm}
                setYearForm={handlers.setYearForm}
                handleYearSubmit={handlers.handleYearSubmit}
                isSubmitting={status.isSubmitting}
            />

            <TermModal
                isOpen={modals.isTermModalOpen}
                onClose={() => handlers.setIsTermModalOpen(false)}
                termForm={forms.termForm}
                setTermForm={handlers.setTermForm}
                academicYears={data.academicYears}
                handleTermSubmit={handlers.handleTermSubmit}
                isSubmitting={status.isSubmitting}
            />

            <ClassModal
                isOpen={modals.isClassModalOpen}
                onClose={() => handlers.setIsClassModalOpen(false)}
                classForm={forms.classForm}
                setClassForm={handlers.setClassForm}
                staff={data.staff}
                handleClassSubmit={handlers.handleClassSubmit}
                isSubmitting={status.isSubmitting}
                editingClassId={status.editingClassId}
            />

            <GroupModal
                isOpen={modals.isGroupModalOpen}
                onClose={() => handlers.setIsGroupModalOpen(false)}
                groupForm={forms.groupForm}
                setGroupForm={handlers.setGroupForm}
                handleGroupSubmit={handlers.handleGroupSubmit}
                isSubmitting={status.isSubmitting}
                editingGroupId={status.editingGroupId}
            />

            <SubjectModal
                isOpen={modals.isSubjectModalOpen}
                onClose={() => handlers.setIsSubjectModalOpen(false)}
                subjectForm={forms.subjectForm}
                setSubjectForm={handlers.setSubjectForm}
                subjectGroups={data.subjectGroups}
                handleSubjectSubmit={handlers.handleSubjectSubmit}
                isSubmitting={status.isSubmitting}
            />

            <AttendanceModal
                isOpen={modals.isAttendanceModalOpen}
                onClose={() => handlers.setIsAttendanceModalOpen(false)}
                attendanceForm={forms.attendanceForm}
                setAttendanceForm={handlers.setAttendanceForm}
                attendanceFilter={forms.attendanceFilter}
                setAttendanceFilter={handlers.setAttendanceFilter}
                bulkAttendanceList={data.bulkAttendanceList}
                setBulkAttendanceList={handlers.setBulkAttendanceList}
                studentOptions={data.studentOptions}
                uniqueClassNames={data.uniqueClassNames}
                classes={data.classes}
                students={data.students}
                handleAttendanceSubmit={handlers.handleAttendanceSubmit}
                isSubmitting={status.isSubmitting}
            />

            <ExamModal
                isOpen={modals.isExamModalOpen}
                onClose={() => handlers.setIsExamModalOpen(false)}
                examForm={forms.examForm}
                setExamForm={handlers.setExamForm}
                handleExamSubmit={handlers.handleExamSubmit}
                terms={data.terms}
                gradeSystems={data.gradeSystems}
                isSubmitting={status.isSubmitting}
            />

            <SyllabusModal
                isOpen={modals.isSyllabusModalOpen}
                onClose={() => handlers.setIsSyllabusModalOpen(false)}
                syllabusForm={forms.syllabusForm}
                setSyllabusForm={handlers.setSyllabusForm}
                handleSyllabusSubmit={handlers.handleSyllabusSubmit}
                uniqueClassNames={data.uniqueClassNames}
                classes={data.classes}
                subjects={data.subjects}
                isSubmitting={status.isSubmitting}
            />

            <RankingModal
                isOpen={modals.isViewResultsModalOpen}
                onClose={() => handlers.setIsViewResultsModalOpen(false)}
                selectedExam={data.selectedExam}
                rankingFilter={forms.rankingFilter}
                setRankingFilter={handlers.setRankingFilter}
                uniqueClassNames={data.uniqueClassNames}
                classes={data.classes}
                subjects={data.subjects}
                examResults={data.examResults}
                gradeSystems={data.gradeSystems}
                handleDeleteStudentResults={handlers.handleDeleteStudentResults}
                setIsResultModalOpen={handlers.setIsResultModalOpen}
                setResultContext={handlers.setResultContext}
            />

            <ExamBroadsheet
                isOpen={modals.isBroadsheetModalOpen}
                onClose={() => handlers.setIsBroadsheetModalOpen(false)}
                selectedExam={data.selectedExam}
                students={data.students}
                classes={data.classes}
                subjects={data.subjects}
                examResults={data.examResults}
                gradeSystems={data.gradeSystems}
                uniqueClassNames={data.uniqueClassNames}
            />

            <ResultEntryModal
                isOpen={modals.isResultModalOpen}
                onClose={() => handlers.setIsResultModalOpen(false)}
                selectedExam={data.selectedExam}
                resultContext={forms.resultContext}
                setResultContext={handlers.setResultContext}
                uniqueClassNames={data.uniqueClassNames}
                classes={data.classes}
                subjects={data.subjects}
                filteredResultStudents={data.filteredResultStudents}
                studentScores={data.studentScores}
                handleScoreChange={handlers.handleScoreChange}
                handleDeleteSingleResult={handlers.handleDeleteSingleResult}
                activeClassSubjects={data.activeClassSubjects}
                gradeSystems={data.gradeSystems}
                handleBulkResultSubmit={handlers.handleBulkResultSubmit}
                isSubmitting={status.isSubmitting}
            />

            <ViewClassModal
                isOpen={modals.isViewClassModalOpen}
                onClose={() => handlers.setIsViewClassModalOpen(false)}
                selectedClass={data.selectedClass}
                viewClassStudents={data.viewClassStudents}
            />



            <ReportModal
                isOpen={modals.isReportModalOpen}
                onClose={() => handlers.setIsReportModalOpen(false)}
            />

            <GradeSystemModal
                isOpen={modals.isGradeModalOpen}
                onClose={() => handlers.setIsGradeModalOpen(false)}
                editingSystemId={status.editingSystemId}
                gradeForm={forms.gradeForm}
                setGradeForm={handlers.setGradeForm}
                handleGradeSystemSubmit={handlers.handleGradeSystemSubmit}
                isSubmitting={status.isSubmitting}
            />

            <BoundaryModal
                isOpen={modals.isBoundaryModalOpen}
                onClose={() => handlers.setIsBoundaryModalOpen(false)}
                editingBoundaryId={status.editingBoundaryId}
                boundaryForm={forms.boundaryForm}
                setBoundaryForm={handlers.setBoundaryForm}
                handleBoundarySubmit={handlers.handleBoundarySubmit}
                isSubmitting={status.isSubmitting}
            />
        </>
    );
};

export default AcademicModals;

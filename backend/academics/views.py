from django.db.models import Count
from rest_framework import viewsets, permissions, status, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    AcademicYear, Term, SubjectGroup, Subject, 
    Class, GradeSystem, GradeBoundary, Exam, 
    StudentResult, Attendance, LearningResource, SyllabusCoverage,
    ClassSubject, StudentSubject
)
from .serializers import (
    AcademicYearSerializer, TermSerializer, SubjectGroupSerializer,
    SubjectSerializer, GradeSystemSerializer, GradeBoundarySerializer,
    ExamSerializer, StudentResultSerializer, ClassSerializer,
    AttendanceSerializer, LearningResourceSerializer, SyllabusCoverageSerializer,
    ClassSubjectSerializer, StudentSubjectSerializer
)

class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']

class TermViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.select_related('year').all()
    serializer_class = TermSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'year']
    search_fields = ['name']


class SubjectGroupViewSet(viewsets.ModelViewSet):
    queryset = SubjectGroup.objects.all()
    serializer_class = SubjectGroupSerializer

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.select_related('group').all()
    serializer_class = SubjectSerializer

class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.select_related('class_teacher').annotate(
        _student_count=Count('students')
    ).all()
    serializer_class = ClassSerializer

class GradeSystemViewSet(viewsets.ModelViewSet):
    queryset = GradeSystem.objects.all()
    serializer_class = GradeSystemSerializer

class GradeBoundaryViewSet(viewsets.ModelViewSet):
    queryset = GradeBoundary.objects.all()
    serializer_class = GradeBoundarySerializer

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.select_related('term', 'grade_system').all()
    serializer_class = ExamSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['term__year', 'term', 'is_active']
    search_fields = ['name']

    def get_queryset(self):
        qs = super().get_queryset()
        start_date = self.request.query_params.get('start_date')
        if start_date:
            qs = qs.filter(date_started__gte=start_date)
        return qs

from .permissions import IsClassTeacherForSubject

class StudentResultViewSet(viewsets.ModelViewSet):
    queryset = StudentResult.objects.select_related('student', 'exam', 'subject').all()
    serializer_class = StudentResultSerializer
    permission_classes = [permissions.IsAuthenticated, IsClassTeacherForSubject]

    def get_permissions(self):
        """
        Bypass the strict class-teacher check for admin/bulk actions.
        These actions require only authentication:
        - list, create, sync_grades, bulk operations
        Object-level teacher check only applies on update/destroy.
        """
        if self.action in ['list', 'create', 'sync_grades']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()
    
    def get_queryset(self):
        queryset = StudentResult.objects.select_related('student', 'exam', 'subject').all()
        student_id = self.request.query_params.get('student_id')
        exam_id = self.request.query_params.get('exam_id')
        if student_id: queryset = queryset.filter(student_id=student_id)
        if exam_id: queryset = queryset.filter(exam_id=exam_id)
        return queryset

    @action(detail=False, methods=['post'])
    def sync_grades(self, request):
        """
        Recalculate and re-assign grades for all existing results
        based on the currently active/default grading system boundaries.
        """
        from .models import GradeSystem, GradeBoundary
        # Find the default grading system
        try:
            default_system = GradeSystem.objects.filter(is_default=True).first()
            if not default_system:
                default_system = GradeSystem.objects.first()
        except GradeSystem.DoesNotExist:
            return Response({'error': 'No grading system found.'}, status=status.HTTP_404_NOT_FOUND)

        if not default_system:
            return Response({'error': 'No grading system found.'}, status=status.HTTP_404_NOT_FOUND)

        boundaries = list(default_system.boundaries.order_by('-min_score'))
        if not boundaries:
            return Response({'error': 'Grading system has no boundaries defined.'}, status=status.HTTP_400_BAD_REQUEST)

        def get_grade(score):
            for b in boundaries:
                if b.min_score <= float(score) <= b.max_score:
                    return b.grade
            return 'E'  # Default if out of range

        results = StudentResult.objects.all()
        updated = 0
        for r in results:
            new_grade = get_grade(r.score)
            if r.grade != new_grade:
                r.grade = new_grade
                r.save(update_fields=['grade'])
                updated += 1

        return Response({
            'message': f'Re-graded {updated} results using "{default_system.name}" boundaries.',
            'total_results': results.count(),
            'updated': updated,
            'grading_system': default_system.name
        })


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('student').all()
    serializer_class = AttendanceSerializer

class LearningResourceViewSet(viewsets.ModelViewSet):
    queryset = LearningResource.objects.all()
    serializer_class = LearningResourceSerializer

class SyllabusCoverageViewSet(viewsets.ModelViewSet):
    queryset = SyllabusCoverage.objects.select_related('subject', 'class_grade').all()
    serializer_class = SyllabusCoverageSerializer
    
    
    def get_queryset(self):
        queryset = super().get_queryset()
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_grade_id=class_id)
        return queryset


class ClassSubjectViewSet(viewsets.ModelViewSet):
    queryset = ClassSubject.objects.select_related('class_id', 'subject', 'teacher').all()
    serializer_class = ClassSubjectSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        class_id = self.request.query_params.get('class_id')
        if class_id:
            qs = qs.filter(class_id_id=class_id)
        return qs

    @action(detail=True, methods=['post'])
    def sync_students(self, request, pk=None):
        """
        Syncs this class-subject to all students in the class.
        Creates StudentSubject records if they don't exist.
        """
        class_subject = self.get_object()
        student_qs = class_subject.class_id.students.all()
        # Adjust related name if needed. Student model has 'current_class'.
        # Assuming Student model: class Student(models.Model): current_class = ForeignKey(Class, ...)
        
        # We need to import Student model to be safe or use string reference logic
        from students.models import Student
        students = Student.objects.filter(current_class=class_subject.class_id)
        
        count = 0
        for student in students:
            obj, created = StudentSubject.objects.get_or_create(
                student=student,
                subject=class_subject.subject,
                defaults={'is_active': True}
            )
            if created: count += 1
            
        return Response({'status': 'synced', 'added': count, 'total_students': students.count()})

class StudentSubjectViewSet(viewsets.ModelViewSet):
    queryset = StudentSubject.objects.select_related('student', 'subject').all()
    serializer_class = StudentSubjectSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs


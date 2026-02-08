from rest_framework import viewsets, permissions, status
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

class TermViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.all()
    serializer_class = TermSerializer

    def update(self, request, *args, **kwargs):
        print(f"\n[DEBUG] Term Update Triggered")
        print(f"[DEBUG] ID: {kwargs.get('pk')}")
        print(f"[DEBUG] Data: {request.data}")
        try:
            response = super().update(request, *args, **kwargs)
            print(f"[DEBUG] Update Success: {response.data}")
            return response
        except Exception as e:
            print(f"[DEBUG] Update FAILED: {str(e)}")
            import traceback
            traceback.print_exc()
            raise e


class SubjectGroupViewSet(viewsets.ModelViewSet):
    queryset = SubjectGroup.objects.all()
    serializer_class = SubjectGroupSerializer

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer

class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer

class GradeSystemViewSet(viewsets.ModelViewSet):
    queryset = GradeSystem.objects.all()
    serializer_class = GradeSystemSerializer

class GradeBoundaryViewSet(viewsets.ModelViewSet):
    queryset = GradeBoundary.objects.all()
    serializer_class = GradeBoundarySerializer

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer

from .permissions import IsClassTeacherForSubject

class StudentResultViewSet(viewsets.ModelViewSet):
    queryset = StudentResult.objects.all()
    serializer_class = StudentResultSerializer
    permission_classes = [permissions.IsAuthenticated, IsClassTeacherForSubject]
    
    def get_queryset(self):
        queryset = StudentResult.objects.all()
        student_id = self.request.query_params.get('student_id')
        exam_id = self.request.query_params.get('exam_id')
        if student_id: queryset = queryset.filter(student_id=student_id)
        if exam_id: queryset = queryset.filter(exam_id=exam_id)
        return queryset

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

class LearningResourceViewSet(viewsets.ModelViewSet):
    queryset = LearningResource.objects.all()
    serializer_class = LearningResourceSerializer

class SyllabusCoverageViewSet(viewsets.ModelViewSet):
    queryset = SyllabusCoverage.objects.all()
    serializer_class = SyllabusCoverageSerializer
    
    
    def get_queryset(self):
        queryset = SyllabusCoverage.objects.all()
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_grade_id=class_id)
        return queryset


class ClassSubjectViewSet(viewsets.ModelViewSet):
    queryset = ClassSubject.objects.all()
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
    queryset = StudentSubject.objects.all()
    serializer_class = StudentSubjectSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs


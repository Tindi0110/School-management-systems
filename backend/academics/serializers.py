from rest_framework import serializers
from .models import (
    AcademicYear, Term, SubjectGroup, Subject, 
    Class, GradeSystem, GradeBoundary, Exam, 
    StudentResult, Attendance, LearningResource, SyllabusCoverage,
    ClassSubject, StudentSubject
)
from django.contrib.auth import get_user_model

User = get_user_model()

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'

class TermSerializer(serializers.ModelSerializer):
    year_name = serializers.CharField(source='year.name', read_only=True)
    class Meta:
        model = Term
        fields = '__all__'

class SubjectGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubjectGroup
        fields = '__all__'

class SubjectSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True)
    class Meta:
        model = Subject
        fields = '__all__'

class GradeBoundarySerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeBoundary
        fields = '__all__'

class GradeSystemSerializer(serializers.ModelSerializer):
    boundaries = GradeBoundarySerializer(many=True, read_only=True)
    class Meta:
        model = GradeSystem
        fields = '__all__'

class ExamSerializer(serializers.ModelSerializer):
    term_name = serializers.CharField(source='term.name', read_only=True)
    grade_system_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Exam
        fields = '__all__'

    def get_grade_system_name(self, obj):
        return obj.grade_system.name if obj.grade_system else "Default (KNEC)"

class StudentResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class Meta:
        model = StudentResult
        fields = '__all__'

class ClassSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    class_name = serializers.CharField(source='class_id.name', read_only=True)
    
    class Meta:
        model = ClassSubject
        fields = '__all__'

class StudentSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    
    class Meta:
        model = StudentSubject
        fields = '__all__'

class ClassSerializer(serializers.ModelSerializer):
    subjects_detail = SubjectSerializer(source='subjects', many=True, read_only=True)
    class_teacher_name = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Class
        fields = '__all__'
        extra_kwargs = {
            'subjects': {'required': False, 'allow_empty': True}
        }

    def get_class_teacher_name(self, obj):
        return obj.class_teacher.get_full_name() if obj.class_teacher else "Unassigned"

    def get_student_count(self, obj):
        return obj.students.count()

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    class Meta:
        model = Attendance
        fields = '__all__'

class LearningResourceSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class Meta:
        model = LearningResource
        fields = '__all__'

class SyllabusCoverageSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_name = serializers.CharField(source='class_grade.name', read_only=True)
    
    class Meta:
        model = SyllabusCoverage
        fields = '__all__'

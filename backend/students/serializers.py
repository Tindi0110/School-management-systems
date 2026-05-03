from rest_framework import serializers
from .models import (
    Student, Parent, StudentAdmission, StudentDocument,
    DisciplineRecord, HealthRecord, ActivityRecord
)
from academics.models import Attendance, StudentResult

from django.db.models import Avg

class SimpleStudentSerializer(serializers.ModelSerializer):
    class_name = serializers.SerializerMethodField()
    stream = serializers.SerializerMethodField()
    class Meta:
        model = Student
        fields = ['id', 'full_name', 'admission_number', 'class_name', 'stream']

    def get_class_name(self, obj):
        return obj.current_class.name if obj.current_class else "General"

    def get_stream(self, obj):
        return obj.current_class.stream if obj.current_class else ""

class ParentSimpleSerializer(serializers.ModelSerializer):
    """Lighter serializer for nesting inside Student records"""
    class Meta:
        model = Parent
        fields = ['id', 'full_name', 'relationship', 'phone', 'email', 'occupation', 'address', 'is_primary']

class ParentSerializer(serializers.ModelSerializer):
    """Full serializer for Parent registry"""
    students = SimpleStudentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Parent
        fields = ['id', 'full_name', 'relationship', 'phone', 'email', 'occupation', 'address', 'is_primary', 'students']

    def validate_phone(self, value):
        if value and not value.startswith('+'):
            raise serializers.ValidationError("Phone number must include a country code starting with '+' (e.g., +254XXXXXXXXX)")
        return value

class StudentAdmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAdmission
        fields = '__all__'

class StudentDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentDocument
        fields = '__all__'

class DisciplineRecordSerializer(serializers.ModelSerializer):
    reported_by_name = serializers.SerializerMethodField()
    class Meta:
        model = DisciplineRecord
        fields = '__all__'

    def get_reported_by_name(self, obj):
        return obj.reported_by.get_full_name() if obj.reported_by else "Unknown"

class HealthRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthRecord
        fields = '__all__'

class ActivityRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityRecord
        fields = '__all__'

class StudentListSerializer(serializers.ModelSerializer):
    """
    Optimized serializer for list views.
    Includes only essential fields for the registry table and basic edit modal.
    """
    class_name = serializers.SerializerMethodField()
    class_stream = serializers.SerializerMethodField()
    
    # Pre-calculated/annotated fields for performance
    attendance_percentage = serializers.SerializerMethodField()
    average_grade = serializers.SerializerMethodField()
    
    # Needed for basic edit modal in list view - using Simple version to avoid N+1 recursion
    parents_detail = ParentSimpleSerializer(source='parents', many=True, read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'full_name', 'admission_number', 'gender', 'date_of_birth',
            'current_class', 'class_name', 'class_stream', 'status', 'category',
            'fee_balance', 'is_active', 'attendance_percentage', 'average_grade',
            'parents_detail', 'user', 'guardian_name', 'guardian_phone', 'guardian_email'
        ]

    def get_class_name(self, obj):
        return obj.current_class.name if obj.current_class else "General"

    def get_class_stream(self, obj):
        return obj.current_class.stream if obj.current_class else ""

    def get_attendance_percentage(self, obj):
        total = getattr(obj, 'attendance_total', None)
        present = getattr(obj, 'attendance_present', None)
        if total is not None:
            return round((present / total) * 100, 1) if total > 0 else 0
        return obj.get_attendance_stats()

    def get_average_grade(self, obj):
        avg_score = getattr(obj, 'avg_score', None)
        if avg_score is not None:
            score = float(avg_score)
            grade = obj.get_grade_from_score(score)
            return f"{grade} ({round(score)}%)"
        return obj.get_academic_stats()['display']

class StudentSerializer(serializers.ModelSerializer):
    class_name = serializers.SerializerMethodField()
    class_stream = serializers.SerializerMethodField()
    
    # MethodFields for fields requiring logic
    hostel_name = serializers.SerializerMethodField()
    room_number = serializers.SerializerMethodField()

    # Nested Data for SIS Profile
    parents_detail = ParentSimpleSerializer(source='parents', many=True, read_only=True)
    admission_details = StudentAdmissionSerializer(read_only=True)
    health_record = HealthRecordSerializer(read_only=True)

    # Calculated Fields
    attendance_percentage = serializers.SerializerMethodField()
    average_grade = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = '__all__'

    # Write-only fields for admission optimization
    guardian_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    guardian_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    guardian_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    guardian_relation = serializers.CharField(write_only=True, required=False, default='GUARDIAN')
    guardian_address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    is_primary_guardian = serializers.BooleanField(write_only=True, required=False, default=True)

    def get_class_name(self, obj):
        return obj.current_class.name if obj.current_class else "General"

    def get_class_stream(self, obj):
        return obj.current_class.stream if obj.current_class else ""

    def get_hostel_name(self, obj):
        try:
            return obj.hostel_allocation.room.hostel.name
        except Exception:
            return "N/A"

    def get_room_number(self, obj):
        try:
            return obj.hostel_allocation.room.room_number
        except Exception:
            return "N/A"

    def get_attendance_percentage(self, obj):
        total = getattr(obj, 'attendance_total', None)
        present = getattr(obj, 'attendance_present', None)
        if total is not None:
            return round((present / total) * 100, 1) if total > 0 else 0
        return obj.get_attendance_stats()

    def get_average_grade(self, obj):
        avg_score = getattr(obj, 'avg_score', None)
        if avg_score is not None:
            score = float(avg_score)
            grade = obj.get_grade_from_score(score)
            return f"{grade} ({round(score)}%)"
        return obj.get_academic_stats()['display']

    def validate_guardian_phone(self, value):
        if value and not value.startswith('+'):
            raise serializers.ValidationError("Guardian phone number must include a country code starting with '+' (e.g., +254XXXXXXXXX)")
        return value

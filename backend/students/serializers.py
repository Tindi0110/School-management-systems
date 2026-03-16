from rest_framework import serializers
from .models import (
    Student, Parent, StudentAdmission, StudentDocument,
    DisciplineRecord, HealthRecord, ActivityRecord
)
from academics.models import Attendance, StudentResult

from django.db.models import Avg

class SimpleStudentSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='current_class.name', read_only=True)
    stream = serializers.CharField(source='current_class.stream', read_only=True)
    class Meta:
        model = Student
        fields = ['id', 'full_name', 'admission_number', 'class_name', 'stream']

class ParentSerializer(serializers.ModelSerializer):
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
    Lightweight serializer for list views.
    Includes only essential fields and de-normalized balances.
    """
    class_name = serializers.CharField(source='current_class.name', read_only=True)
    class_stream = serializers.CharField(source='current_class.stream', read_only=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'full_name', 'admission_number', 'gender', 
            'class_name', 'class_stream', 'status', 'category',
            'fee_balance', 'is_active'
        ]

class StudentSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='current_class.name', read_only=True)
    class_stream = serializers.CharField(source='current_class.stream', read_only=True)
    
    # MethodFields for fields requiring logic
    hostel_name = serializers.CharField(source='hostel_allocation.room.hostel.name', read_only=True)
    room_number = serializers.CharField(source='hostel_allocation.room.room_number', read_only=True)

    # Nested Data for SIS Profile
    parents_detail = ParentSerializer(source='parents', many=True, read_only=True)
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

    def get_attendance_percentage(self, obj):
        # Use pre-annotated values if available (from list view logic if ever needed there)
        total = getattr(obj, 'attendance_total', None)
        present = getattr(obj, 'attendance_present', None)
        
        if total is None:
            # Fallback for detail view only
            total = obj.attendance_set.count()
            present = obj.attendance_set.filter(status='PRESENT').count()
            
        if total == 0:
            return 0
        return round((present / total) * 100, 1)

    def get_average_grade(self, obj):
        avg_score = getattr(obj, 'avg_score', None)
        if avg_score is None:
            # Fallback for detail view
            avg_score = obj.results.aggregate(Avg('score'))['score__avg']
            
        if avg_score is None:
            return "N/A"
            
        score = float(avg_score)
        grade = 'E'
        if score >= 80: grade = 'A'
        elif score >= 75: grade = 'A-'
        elif score >= 70: grade = 'B+'
        elif score >= 65: grade = 'B'
        elif score >= 60: grade = 'B-'
        elif score >= 55: grade = 'C+'
        elif score >= 50: grade = 'C'
        elif score >= 45: grade = 'C-'
        elif score >= 40: grade = 'D+'
        elif score >= 35: grade = 'D'
        elif score >= 30: grade = 'D-'
        return f"{grade} ({round(score)}%)"

    def validate_guardian_phone(self, value):
        if value and not value.startswith('+'):
            raise serializers.ValidationError("Guardian phone number must include a country code starting with '+' (e.g., +254XXXXXXXXX)")
        return value

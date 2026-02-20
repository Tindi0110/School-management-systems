from rest_framework import serializers
from .models import (
    Student, Parent, StudentAdmission, StudentDocument,
    DisciplineRecord, HealthRecord, ActivityRecord
)
from academics.models import Attendance, StudentResult

from django.db.models import Sum, Value, DecimalField, Avg
from django.db.models.functions import Coalesce

class SimpleStudentSerializer(serializers.ModelSerializer):
    class_name = serializers.SerializerMethodField()
    stream = serializers.SerializerMethodField()
    class Meta:
        model = Student
        fields = ['id', 'full_name', 'admission_number', 'class_name', 'stream']

    def get_class_name(self, obj):
        return obj.current_class.name if obj.current_class else None

    def get_stream(self, obj):
        return obj.current_class.stream if obj.current_class else None

class ParentSerializer(serializers.ModelSerializer):
    students = SimpleStudentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Parent
        fields = '__all__'

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

class StudentSerializer(serializers.ModelSerializer):
    class_name = serializers.SerializerMethodField()
    class_stream = serializers.SerializerMethodField()
    # MethodFields only for fields requiring logic (not mere dot traversal)
    hostel_name = serializers.SerializerMethodField()
    room_number = serializers.SerializerMethodField()

    # Nested Data for SIS Profile
    parents_detail = ParentSerializer(source='parents', many=True, read_only=True)
    admission_details = StudentAdmissionSerializer(read_only=True)
    health_record = HealthRecordSerializer(read_only=True)

    # Calculated Fields — read from queryset annotations when available
    attendance_percentage = serializers.SerializerMethodField()
    average_grade = serializers.SerializerMethodField()
    fee_balance = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = '__all__'

    # Write-only fields for admission optimization (Atomic creation)
    guardian_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    guardian_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    guardian_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    guardian_relation = serializers.CharField(write_only=True, required=False, default='GUARDIAN')
    guardian_address = serializers.CharField(write_only=True, required=False, allow_blank=True)

    def get_class_name(self, obj):
        return obj.current_class.name if obj.current_class else None

    def get_class_stream(self, obj):
        return obj.current_class.stream if obj.current_class else None

    def get_hostel_name(self, obj):
        try:
            return obj.hostel_allocation.room.hostel.name
        except Exception:
            return None

    def get_room_number(self, obj):
        try:
            return obj.hostel_allocation.room.room_number
        except Exception:
            return None

    def get_attendance_percentage(self, obj):
        # Use pre-annotated value if available (avoids per-row DB query)
        if hasattr(obj, 'attendance_pct'):
            total = getattr(obj, 'attendance_total', 0) or 0
            if total == 0:
                return 0
            present = getattr(obj, 'attendance_present', 0) or 0
            return round((present / total) * 100, 1)
        # Fallback for single-object retrieval (detail view)
        try:
            total_days = Attendance.objects.filter(student=obj).count()
            if total_days == 0:
                return 0
            present_days = Attendance.objects.filter(student=obj, status='PRESENT').count()
            return round((present_days / total_days) * 100, 1)
        except Exception:
            return 0

    def get_average_grade(self, obj):
        # Use pre-annotated value if available (avoids per-row DB query)
        if hasattr(obj, 'avg_score'):
            avg_score = obj.avg_score
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
        # Fallback for single-object retrieval (detail view)
        try:
            results = StudentResult.objects.filter(student=obj)
            if not results.exists():
                return "N/A"
            avg_score = results.aggregate(Avg('score'))['score__avg']
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
        except Exception:
            return "N/A"

    def get_fee_balance(self, obj):
        return getattr(obj, 'fee_balance', 0.00)

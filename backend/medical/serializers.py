from rest_framework import serializers
from .models import MedicalRecord

class MedicalRecordListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    nurse_name = serializers.SerializerMethodField()
    
    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'student', 'student_name', 'nurse_name', 'reason', 
            'diagnosis', 'treatment_given', 'date_visited', 'status',
            'height', 'weight', 'temperature', 'blood_pressure', 'pulse_rate'
        ]

    def get_nurse_name(self, obj):
        if obj.nurse and obj.nurse.user:
            return obj.nurse.user.get_full_name() or obj.nurse.user.username
        return 'Clinic System'

class MedicalRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    nurse_name = serializers.SerializerMethodField()
    
    class Meta:
        model = MedicalRecord
        fields = '__all__'
        read_only_fields = ['nurse']

    def get_nurse_name(self, obj):
        if obj.nurse and obj.nurse.user:
            return obj.nurse.user.get_full_name() or obj.nurse.user.username
        return 'Clinic System'

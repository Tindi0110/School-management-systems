from rest_framework import serializers
from .models import MedicalRecord

class MedicalRecordListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    nurse_name = serializers.CharField(source='nurse.user.get_full_name', read_only=True, default='Clinic System')
    
    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'student', 'student_name', 'nurse_name', 'reason', 
            'diagnosis', 'treatment_given', 'date_visited', 'status',
            'height', 'weight', 'temperature', 'blood_pressure', 'pulse_rate'
        ]

class MedicalRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    nurse_name = serializers.CharField(source='nurse.user.get_full_name', read_only=True, default='Clinic System')
    
    class Meta:
        model = MedicalRecord
        fields = '__all__'
        read_only_fields = ['nurse']

from rest_framework import serializers
from .models import MedicalRecord

class MedicalRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    nurse_name = serializers.CharField(source='nurse.user.get_full_name', read_only=True)
    
    class Meta:
        model = MedicalRecord
        fields = '__all__'

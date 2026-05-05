from rest_framework import serializers
from .models import TimetableSlot

class TimetableSlotSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    class_name = serializers.CharField(source='class_assigned.name', read_only=True)
    stream_name = serializers.CharField(source='class_assigned.stream', read_only=True)

    class Meta:
        model = TimetableSlot
        fields = '__all__'

from django.conf import settings
from rest_framework import serializers
from .models import (
    Hostel, Room, Bed, HostelAllocation, HostelAttendance, 
    HostelDiscipline, HostelAsset, GuestLog, HostelMaintenance
)

class BedSerializer(serializers.ModelSerializer):
    hostel_gender = serializers.CharField(source='room.hostel.gender_allowed', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    hostel_name = serializers.CharField(source='room.hostel.name', read_only=True)

    class Meta:
        model = Bed
        fields = '__all__'

class RoomSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    beds = BedSerializer(many=True, read_only=True)
    available_beds = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = '__all__'
    
    def get_available_beds(self, obj):
        return obj.beds.filter(status='AVAILABLE').count()

class HostelSerializer(serializers.ModelSerializer):
    warden_name = serializers.CharField(source='warden.get_full_name', read_only=True if hasattr(settings, 'AUTH_USER_MODEL') else False)
    total_rooms = serializers.IntegerField(source='rooms.count', read_only=True)
    occupancy_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = Hostel
        fields = '__all__'

    def get_occupancy_rate(self, obj):
        total_beds = Bed.objects.filter(room__hostel=obj).count()
        occupied_beds = Bed.objects.filter(room__hostel=obj, status='OCCUPIED').count()
        if total_beds == 0: return 0
        return round((occupied_beds / total_beds) * 100, 1)

class HostelAllocationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    bed_number = serializers.CharField(source='bed.bed_number', read_only=True)
    hostel_name = serializers.CharField(source='room.hostel.name', read_only=True)
    
    class Meta:
        model = HostelAllocation
        fields = '__all__'

    def validate(self, data):
        student = data.get('student')
        room = data.get('room')
        bed = data.get('bed')
        
        # 1. Capacity Check: Is the bed actually available?
        if bed.status != 'AVAILABLE':
             raise serializers.ValidationError({"bed": f"Bed {bed.bed_number} is currently {bed.status}. Please choose another."})
             
        # 2. Gender Validation
        hostel = room.hostel
        if hostel.gender_allowed != 'MIXED' and student.gender != hostel.gender_allowed:
            gender_map = {'M': 'Male', 'F': 'Female'}
            raise serializers.ValidationError({
                "room": f"Hostel '{hostel.name}' is {gender_map.get(hostel.gender_allowed)} only. Student is {gender_map.get(student.gender)}."
            })

        # 3. OneToOne Check: Does student already have an allocation?
        # Only checks on CREATE (if self.instance is None)
        from hostel.models import HostelAllocation
        if not self.instance and HostelAllocation.objects.filter(student=student).exists():
             raise serializers.ValidationError({"student": "This student already has a hostel record. Please update the existing record or use 'Transfer' instead of creating a new one."})

        return data

class HostelAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    hostel_name = serializers.CharField(source='student.hostel_allocation.room.hostel.name', read_only=True)
    class Meta:
        model = HostelAttendance
        fields = '__all__'

class HostelDisciplineSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    reported_by_name = serializers.CharField(source='reported_by.get_full_name', read_only=True)
    class Meta:
        model = HostelDiscipline
        fields = '__all__'

class HostelAssetSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    hostel_name = serializers.CharField(source='room.hostel.name', read_only=True)
    class Meta:
        model = HostelAsset
        fields = '__all__'

class GuestLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student_visited.full_name', read_only=True)
    class Meta:
        model = GuestLog
        fields = '__all__'

class HostelMaintenanceSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    reported_by_name = serializers.CharField(source='reported_by.get_full_name', read_only=True)
    class Meta:
        model = HostelMaintenance
        fields = '__all__'

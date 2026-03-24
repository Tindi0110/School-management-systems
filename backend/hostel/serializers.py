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
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Bed
        fields = '__all__'
    
    def get_is_available(self, obj):
        return obj.status == 'AVAILABLE'

class RoomSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)
    beds = BedSerializer(many=True, read_only=True)
    available_beds = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = '__all__'
    
    def get_available_beds(self, obj):
        return obj.beds.filter(status='AVAILABLE').count()

class HostelListSerializer(serializers.ModelSerializer):
    warden_name = serializers.CharField(source='warden.get_full_name', read_only=True)
    total_rooms = serializers.IntegerField(source='rooms.count', read_only=True)
    occupancy_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = Hostel
        fields = ['id', 'name', 'gender_allowed', 'hostel_type', 'capacity', 'warden_name', 'total_rooms', 'occupancy_rate']

    def get_occupancy_rate(self, obj):
        # Use annotated values if available
        total = getattr(obj, 'total_beds_count', 0)
        occupied = getattr(obj, 'occupied_beds_count', 0)
        if total == 0: return 0
        return round((occupied / total) * 100, 1)

class HostelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hostel
        fields = '__all__'

class AllocationListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    bed_number = serializers.CharField(source='bed.bed_number', read_only=True)
    hostel_name = serializers.CharField(source='room.hostel.name', read_only=True)
    
    class Meta:
        model = HostelAllocation
        fields = ['id', 'student', 'student_name', 'admission_number', 'hostel_name', 'room', 'room_number', 'bed', 'bed_number', 'status', 'is_active', 'date_allocated']

class HostelAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostelAllocation
        fields = '__all__'

    def validate(self, data):
        student = data.get('student')
        room = data.get('room')
        bed = data.get('bed')
        
        # 1. Capacity Check: Is the bed actually available?
        if bed.status != 'AVAILABLE':
            # Allow if we're updating the same allocation and the bed hasn't changed
            if not self.instance or self.instance.bed != bed:
                 raise serializers.ValidationError({"bed": f"Bed {bed.bed_number} is currently {bed.status}. Please choose another."})
             
        # 2. Gender Validation
        hostel = room.hostel
        student_gender = student.gender if student else None
        if hostel.gender_allowed != 'MIXED' and student_gender != hostel.gender_allowed:
            gender_map = {'M': 'Male', 'F': 'Female'}
            raise serializers.ValidationError({
                "room": f"Hostel '{hostel.name}' is {gender_map.get(hostel.gender_allowed)} only. Student is {gender_map.get(student_gender)}."
            })

        # 3. OneToOne Check: Does student already have an allocation?
        # Only checks on CREATE (if self.instance is None)
        from .models import HostelAllocation
        if not self.instance and HostelAllocation.objects.filter(student=student).exists():
             raise serializers.ValidationError({"student": "This student already has a hostel record. Please update the existing record or use 'Transfer' instead of creating a new one."})

        return data

class HostelAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    hostel_name = serializers.SerializerMethodField()
    def get_hostel_name(self, obj):
        try:
            return obj.student.hostel_allocation.room.hostel.name
        except AttributeError:
            return "No Active Allocation"
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

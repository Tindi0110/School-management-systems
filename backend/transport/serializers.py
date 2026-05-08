from rest_framework import serializers
from .models import (
    Vehicle, Route, PickupPoint, TransportAllocation, 
    TripLog, TransportAttendance, VehicleMaintenance, 
    FuelRecord, TransportIncident, DriverProfile, TransportConfig
)

class TransportConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportConfig
        fields = '__all__'

class VehicleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for vehicle list."""
    assigned_driver_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Vehicle
        fields = ['id', 'registration_number', 'make_model', 'vehicle_type', 'seating_capacity', 'status', 'assigned_driver_name', 'insurance_expiry']

    def get_assigned_driver_name(self, obj):
        # Optimized lookup for list view
        driver = getattr(obj, 'assigned_driver_name_annotated', None)
        if driver: return driver
        # Fallback if no annotation
        driver_profile = DriverProfile.objects.filter(assigned_vehicle=obj).select_related('staff__user').first()
        return driver_profile.staff.user.get_full_name() if driver_profile and driver_profile.staff and driver_profile.staff.user else "Unassigned"

class VehicleSerializer(serializers.ModelSerializer):
    maintenance_count = serializers.IntegerField(source='maintenance_logs.count', read_only=True)
    assigned_driver_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    assigned_driver_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Vehicle
        fields = '__all__'
        extra_fields = ['maintenance_count', 'assigned_driver_id', 'assigned_driver_name']

    def get_assigned_driver_name(self, obj):
        if hasattr(obj, 'assigned_driver_name_annotated') and obj.assigned_driver_name_annotated:
            return obj.assigned_driver_name_annotated
        driver = DriverProfile.objects.filter(assigned_vehicle=obj).select_related('staff__user').first()
        if driver and driver.staff and driver.staff.user:
            return driver.staff.user.get_full_name()
        return None

    def create(self, validated_data):
        driver_id = validated_data.pop('assigned_driver_id', None)
        vehicle = super().create(validated_data)
        if driver_id:
            try:
                driver = DriverProfile.objects.get(id=driver_id)
                driver.assigned_vehicle = vehicle
                driver.save()
            except DriverProfile.DoesNotExist:
                pass
        return vehicle

    def update(self, instance, validated_data):
        driver_id = validated_data.pop('assigned_driver_id', None)
        vehicle = super().update(instance, validated_data)
        if driver_id is not None:
            # Clear previous associations if any (optional, usually 1:1)
            DriverProfile.objects.filter(assigned_vehicle=vehicle).update(assigned_vehicle=None)
            if driver_id:
                try:
                    driver = DriverProfile.objects.get(id=driver_id)
                    driver.assigned_vehicle = vehicle
                    driver.save()
                except DriverProfile.DoesNotExist:
                    pass
        return vehicle

class DriverProfileSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.user.get_full_name', read_only=True)
    staff_employee_id = serializers.CharField(source='staff.employee_id', read_only=True)
    vehicle_plate = serializers.CharField(source='assigned_vehicle.registration_number', read_only=True)

    class Meta:
        model = DriverProfile
        fields = '__all__'

class PickupPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = PickupPoint
        fields = '__all__'

class RouteListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for route list."""
    occupancy = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = ['id', 'name', 'route_code', 'distance_km', 'base_cost', 'status', 'occupancy']

    def get_occupancy(self, obj):
        if hasattr(obj, 'occupancy_count'):
            return obj.occupancy_count
        return 0 # Should be annotated in viewset

class RouteSerializer(serializers.ModelSerializer):
    pickup_points = PickupPointSerializer(many=True, read_only=True)
    occupancy = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = '__all__'

    def get_occupancy(self, obj):
        # Use annotated field if available, otherwise fallback to query
        if hasattr(obj, 'occupancy_count'):
            return obj.occupancy_count
        return obj.allocations.filter(status='ACTIVE').count()

class AllocationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for transport allocations list."""
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    route_name = serializers.CharField(source='route.name', read_only=True)
    pickup_point_name = serializers.CharField(source='pickup_point.point_name', read_only=True)

    class Meta:
        model = TransportAllocation
        fields = ['id', 'student', 'student_name', 'route_name', 'pickup_point_name', 'status', 'start_date', 'monthly_fee']

class TransportAllocationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    route_name = serializers.CharField(source='route.name', read_only=True)
    pickup_point_name = serializers.CharField(source='pickup_point.point_name', read_only=True)
    monthly_fee = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = TransportAllocation
        fields = '__all__'

    def validate_student(self, value):
        """Ensure student isn't already enrolled (handled by OneToOne, but we want better error)."""
        instance = getattr(self, 'instance', None)
        # If we are updating an existing allocation, it's fine for the student to be the same
        if instance and instance.student == value:
            return value
            
        if TransportAllocation.objects.filter(student=value).exists():
            raise serializers.ValidationError("This student is already enrolled in a transport route. Remove their existing allocation first or edit it.")
        return value

class TransportAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model = TransportAttendance
        fields = '__all__'

class TripLogSerializer(serializers.ModelSerializer):
    attendance = TransportAttendanceSerializer(many=True, read_only=True)
    vehicle_plate = serializers.CharField(source='vehicle.registration_number', read_only=True)
    route_name = serializers.CharField(source='route.name', read_only=True)

    class Meta:
        model = TripLog
        fields = '__all__'

class VehicleMaintenanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleMaintenance
        fields = '__all__'

class FuelRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelRecord
        fields = '__all__'

class TransportIncidentSerializer(serializers.ModelSerializer):
    reported_by_name = serializers.CharField(source='reported_by.username', read_only=True)

    class Meta:
        model = TransportIncident
        fields = '__all__'

from django.db import models
from django.utils import timezone
from django.conf import settings

class TransportConfig(models.Model):
    policy_document = models.TextField(blank=True)
    transport_fee_notes = models.TextField(blank=True)
    max_wait_time_minutes = models.IntegerField(default=5)
    emergency_contact = models.CharField(max_length=100, blank=True)

    def __str__(self): return "Transport System Configuration"

class Vehicle(models.Model):
    VEHICLE_TYPES = (('BUS', 'Bus'), ('VAN', 'Van'), ('MINIBUS', 'Minibus'), ('OTHER', 'Other'))
    CONDITIONS = (('EXCELLENT', 'Excellent'), ('GOOD', 'Good'), ('FAIR', 'Fair'), ('POOR', 'Needs Repair'))
    STATUS = (('ACTIVE', 'Active'), ('MAINTENANCE', 'In Maintenance'), ('SUSPENDED', 'Suspended'))

    registration_number = models.CharField(max_length=20, unique=True, verbose_name="Number Plate")
    vehicle_type = models.CharField(max_length=10, choices=VEHICLE_TYPES, default='BUS')
    make_model = models.CharField(max_length=100, blank=True)
    seating_capacity = models.IntegerField()
    current_condition = models.CharField(max_length=10, choices=CONDITIONS, default='EXCELLENT')
    status = models.CharField(max_length=15, choices=STATUS, default='ACTIVE')
    
    # Compliance
    insurance_expiry = models.DateField(null=True, blank=True)
    inspection_expiry = models.DateField(null=True, blank=True)
    logbook_number = models.CharField(max_length=50, blank=True)
    
    def __str__(self):
        return f"{self.registration_number} ({self.get_vehicle_type_display()})"

class DriverProfile(models.Model):
    staff = models.OneToOneField('staff.Staff', on_delete=models.CASCADE, related_name='driver_profile')
    license_number = models.CharField(max_length=50, unique=True)
    license_expiry = models.DateField()
    license_type = models.CharField(max_length=20, default='Commercial')
    years_experience = models.IntegerField(default=0)
    assigned_vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self): return f"Driver: {self.staff.full_name}"

class Route(models.Model):
    STATUS = (('ACTIVE', 'Active'), ('INACTIVE', 'Inactive'))
    name = models.CharField(max_length=100)
    route_code = models.CharField(max_length=10, unique=True)
    distance_km = models.DecimalField(max_digits=5, decimal_places=2, help_text="One way distance")
    timing_morning = models.TimeField(null=True, blank=True)
    timing_evening = models.TimeField(null=True, blank=True)
    base_cost = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS, default='ACTIVE')
    
    def __str__(self): return f"{self.route_code} - {self.name}"

class PickupPoint(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='pickup_points')
    point_name = models.CharField(max_length=100)
    pickup_time = models.TimeField()
    dropoff_time = models.TimeField()
    distance_from_school = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Distance in KM")
    additional_cost = models.DecimalField(max_digits=30, decimal_places=2, default=0)

    def __str__(self): return f"{self.point_name} ({self.route.name})"

class TransportAllocation(models.Model):
    STATUS = (('ACTIVE', 'Active'), ('SUSPENDED', 'Suspended'), ('WITHDRAWN', 'Withdrawn'))
    student = models.OneToOneField('students.Student', on_delete=models.CASCADE, related_name='transport_allocation')
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='allocations')
    pickup_point = models.ForeignKey(PickupPoint, on_delete=models.SET_NULL, null=True)
    seat_number = models.CharField(max_length=10, blank=True)
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS, default='ACTIVE')
    
    def __str__(self): return f"{self.student} - {self.route.route_code}"

class TripLog(models.Model):
    TYPES = (('MORNING', 'Morning Pickup'), ('EVENING', 'Evening Drop-off'), ('SPECIAL', 'Special Trip'))
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    route = models.ForeignKey(Route, on_delete=models.CASCADE)
    driver = models.ForeignKey(DriverProfile, on_delete=models.SET_NULL, null=True)
    attendant = models.CharField(max_length=100, blank=True)
    trip_type = models.CharField(max_length=10, choices=TYPES)
    date = models.DateField(default=timezone.now)
    departure_time = models.TimeField(null=True, blank=True)
    arrival_time = models.TimeField(null=True, blank=True)
    odometer_start = models.IntegerField(null=True, blank=True)
    odometer_end = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, default='COMPLETED')

class TransportAttendance(models.Model):
    trip = models.ForeignKey(TripLog, on_delete=models.CASCADE, related_name='attendance')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    is_present = models.BooleanField(default=True)
    remarks = models.CharField(max_length=255, blank=True)

class VehicleMaintenance(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenance_logs')
    service_date = models.DateField()
    description = models.TextField()
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    mileage_at_service = models.IntegerField(null=True, blank=True)
    next_service_due = models.DateField(null=True, blank=True)
    performed_by = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, default='PENDING', choices=(('PENDING', 'Pending'), ('IN_PROGRESS', 'In Progress'), ('COMPLETED', 'Completed')))

class FuelRecord(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='fuel_records')
    date = models.DateField(default=timezone.now)
    liters = models.DecimalField(max_digits=7, decimal_places=2)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    mileage = models.IntegerField()
    receipt_no = models.CharField(max_length=50, blank=True)

class TransportIncident(models.Model):
    SEVERITY = (('MINOR', 'Minor'), ('MAJOR', 'Major'), ('CRITICAL', 'Critical'))
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    severity = models.CharField(max_length=10, choices=SEVERITY)
    incident_type = models.CharField(max_length=20, default='ACCIDENT')
    description = models.TextField()
    action_taken = models.TextField(blank=True)
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

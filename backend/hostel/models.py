from django.db import models
from django.conf import settings
from django.utils import timezone

class Hostel(models.Model):
    GENDER_CHOICES = (('M', 'Male'), ('F', 'Female'))
    TYPE_CHOICES = (('BOARDING', 'Full Boarding'), ('MIXED', 'Mixed Day/Boarding'))
    STATUS_CHOICES = (('ACTIVE', 'Active'), ('MAINTENANCE', 'Under Maintenance'), ('CLOSED', 'Closed'))
    
    name = models.CharField(max_length=100)
    hostel_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='BOARDING')
    gender_allowed = models.CharField(max_length=1, choices=GENDER_CHOICES)
    capacity = models.IntegerField(default=100)
    warden = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='hostels_managed')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ACTIVE')
    rules = models.TextField(blank=True)
    
    def __str__(self):
        return self.name

class Room(models.Model):
    ROOM_TYPES = (('DORM', 'Dormitory'), ('CUBICLE', 'Cubicle'), ('SINGLE', 'Single Room'))
    STATUS_CHOICES = (('AVAILABLE', 'Available'), ('FULL', 'Full'), ('CLOSED', 'Closed'))
    
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=10)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES, default='DORM')
    floor = models.CharField(max_length=20, blank=True)
    capacity = models.IntegerField(default=4)
    current_occupancy = models.IntegerField(default=0)
    condition_notes = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='AVAILABLE')
    
    class Meta:
        unique_together = ('hostel', 'room_number')
        
    def __str__(self):
        return f"{self.hostel.name} - Rm {self.room_number}"

class Bed(models.Model):
    STATUS_CHOICES = (('AVAILABLE', 'Available'), ('OCCUPIED', 'Occupied'), ('RESERVED', 'Reserved'), ('MAINTENANCE', 'Needs Repair'))
    
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='beds')
    bed_number = models.CharField(max_length=10)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='AVAILABLE')
    
    def __str__(self):
        return f"{self.room} - Bed {self.bed_number}"

class HostelAllocation(models.Model):
    STATUS_CHOICES = (('ACTIVE', 'Current'), ('COMPLETED', 'Stay Finished'), ('CANCELLED', 'Cancelled'))
    
    student = models.OneToOneField('students.Student', on_delete=models.CASCADE, related_name='hostel_allocation')
    bed = models.OneToOneField(Bed, on_delete=models.SET_NULL, null=True, related_name='allocation')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='allocations')
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ACTIVE')
    date_allocated = models.DateField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.student} in {self.bed}"

class HostelAttendance(models.Model):
    SESSION_CHOICES = (('MORNING', 'Morning Call'), ('EVENING', 'Evening Call'), ('NIGHT', 'Night Call'))
    STATUS_CHOICES = (('PRESENT', 'Present'), ('ABSENT', 'Absent'), ('PERMITTED', 'On Leave/Exeat'))
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now, db_index=True)
    session = models.CharField(max_length=10, choices=SESSION_CHOICES)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES)
    warden_remark = models.CharField(max_length=255, blank=True)
    
    class Meta:
        unique_together = ('student', 'date', 'session')
        indexes = [
            models.Index(fields=['student', 'date']),
            models.Index(fields=['date', 'session']),
        ]

class HostelDiscipline(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    incident_date = models.DateField(default=timezone.now)
    offence = models.CharField(max_length=100)
    description = models.TextField()
    action_taken = models.CharField(max_length=255)
    severity = models.CharField(max_length=20, default='MINOR', choices=(('MINOR', 'Minor'), ('MAJOR', 'Major'), ('CRITICAL', 'Critical')))
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

class HostelAsset(models.Model):
    ASSET_TYPES = (('BED', 'Bed Frame'), ('MATTRESS', 'Mattress'), ('LOCKER', 'Locker'), ('CHAIR', 'Chair'), ('FURNITURE', 'Furniture'), ('ELECTRONIC', 'Electronics'), ('OTHER', 'Other'))
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name='assets', null=True, blank=True)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='assets')
    asset_type = models.CharField(max_length=15, choices=ASSET_TYPES)
    asset_code = models.CharField(max_length=50, unique=True, null=True, blank=True) # Ensure this is handled carefully in frontend
    condition = models.CharField(max_length=50, default='Good')
    value = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # Added for Finance Sync
    quantity = models.IntegerField(default=1) # Re-added as requested
    last_audit_date = models.DateField(auto_now=True)

class GuestLog(models.Model):
    guest_name = models.CharField(max_length=100)
    id_number = models.CharField(max_length=20, blank=True)
    student_visited = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    check_in = models.DateTimeField(auto_now_add=True)
    check_out = models.DateTimeField(null=True, blank=True)
    purpose = models.CharField(max_length=255)

class HostelMaintenance(models.Model):
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
    date_reported = models.DateField(default=timezone.now)
    issue = models.TextField()
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, default='PENDING')
    repair_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    completion_date = models.DateField(null=True, blank=True)

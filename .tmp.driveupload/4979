from django.db import models
from django.conf import settings
import uuid

class Parent(models.Model):
    RELATIONSHIP_CHOICES = (
        ('FATHER', 'Father'),
        ('MOTHER', 'Mother'),
        ('GUARDIAN', 'Guardian'),
    )
    full_name = models.CharField(max_length=255)
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    occupation = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='parent_profile')

    def __str__(self): return f"{self.full_name} ({self.relationship})"

class Student(models.Model):
    GENDER_CHOICES = (('M', 'Male'), ('F', 'Female'))
    CATEGORY_CHOICES = (('DAY', 'Day Scholar'), ('BOARDING', 'Boarding'))
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
        ('WITHDRAWN', 'Withdrawn'),
        ('ALUMNI', 'Alumni'),
        ('TRANSFERRED', 'Transferred Out')
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='student_profile')
    admission_number = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    # Changed from ImageField to FileField to bypass Pillow dependency
    photo = models.FileField(upload_to='student_photos/', null=True, blank=True)
    
    # SIS Fields
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default='DAY')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ACTIVE')
    
    # Sync Fields (Auto-updated via signals)
    residence_details = models.CharField(max_length=100, blank=True, help_text="Auto-synced from Hostel Allocation")
    transport_details = models.CharField(max_length=100, blank=True, help_text="Auto-synced from Transport Allocation")
    
    # Relationships
    current_class = models.ForeignKey('academics.Class', on_delete=models.SET_NULL, null=True, blank=True, related_name='students') 
    parents = models.ManyToManyField(Parent, related_name='students', blank=True)
    
    # Legacy fields (kept for backward compatibility during migration, will deprecate)
    guardian_name = models.CharField(max_length=255, blank=True)
    guardian_phone = models.CharField(max_length=20, blank=True)
    
    admission_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True) # Linked to status='ACTIVE'

    def __str__(self): return f"{self.full_name} ({self.admission_number})"

class StudentAdmission(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='admission_details')
    previous_school = models.CharField(max_length=255, blank=True)
    previous_grade = models.CharField(max_length=50, blank=True)
    reason_for_leaving = models.TextField(blank=True)
    birth_certificate_no = models.CharField(max_length=50, blank=True)
    nemis_upi = models.CharField(max_length=50, blank=True, verbose_name="NEMIS UPI")
    entry_exam_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

class StudentDocument(models.Model):
    DOC_TYPES = (('BIRTH_CERT', 'Birth Certificate'), ('REPORT_CARD', 'Previous Report Card'), ('TRANSFER_LETTER', 'Transfer Letter'), ('OTHER', 'Other'))
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=20, choices=DOC_TYPES)
    # Changed from FileField to FileField (already was)
    file = models.FileField(upload_to='student_docs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

class DisciplineRecord(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='discipline_records')
    incident_date = models.DateField()
    offence_category = models.CharField(max_length=100) # e.g. Lateness, Disobedience
    description = models.TextField()
    action_taken = models.CharField(max_length=255)
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class HealthRecord(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='health_record')
    blood_group = models.CharField(max_length=5, blank=True)
    allergies = models.TextField(blank=True)
    chronic_conditions = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=255)
    emergency_contact_phone = models.CharField(max_length=20)
    special_needs = models.TextField(blank=True)

class ActivityRecord(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=100) # Club, Sport, Arts
    name = models.CharField(max_length=200) # e.g. Drama Club
    role = models.CharField(max_length=100, blank=True) # e.g. Captain
    achievements = models.TextField(blank=True)
    year = models.IntegerField()

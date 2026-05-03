from django.db import models
from django.conf import settings


class Parent(models.Model):
    RELATIONSHIP_CHOICES = (
        ('FATHER', 'Father'),
        ('MOTHER', 'Mother'),
        ('GUARDIAN', 'Guardian'),
    )
    full_name = models.CharField(max_length=255)
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)
    phone = models.CharField(max_length=20) # Removed unique filter to allow migration with existing duplicates
    email = models.EmailField(blank=True, null=True)
    occupation = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='parent_profile')
    is_primary = models.BooleanField(default=False, help_text="Designates the primary contact for financial and medical alerts.")

    def __str__(self): return f"{self.full_name} ({self.relationship})"

    def delete(self, *args, **kwargs):
        if self.students.exists():
            from django.core.exceptions import ValidationError
            raise ValidationError("Cannot delete a guardian that is linked to students. Unlink them first.")
        super().delete(*args, **kwargs)

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
    admission_number = models.CharField(max_length=20, unique=True, blank=True) # Blank allowed for auto-gen
    full_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    # Changed from ImageField to FileField to bypass Pillow dependency
    photo = models.FileField(upload_to='student_photos/', null=True, blank=True)
    
    # SIS Fields
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default='DAY')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ACTIVE', db_index=True)
    
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
    is_active = models.BooleanField(default=True, db_index=True) # Linked to status='ACTIVE'
    
    # De-normalized fields for performance
    fee_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0, db_index=True)

    def save(self, *args, **kwargs):
        if not self.admission_number:
            from academics.models import AcademicYear
            from django.db import transaction, models
            from django.db.models import Max
            import datetime
            
            with transaction.atomic():
                # 1. Determine the Year Part (YY)
                active_year = AcademicYear.objects.filter(is_active=True).first()
                year_val = active_year.name if active_year else str(datetime.date.today().year)
                
                # Handle formats like "2024" or "24/25"
                if '/' in year_val:
                    short_year = year_val.split('/')[0][-2:]
                else:
                    short_year = year_val[-2:]
                
                # 2. Determine the sequence Part (XXXX)
                year_prefix = f"{short_year}/"
                
                # Get the maximum current admission number for this year to avoid collisions
                max_admission = Student.objects.select_for_update().filter(
                    admission_number__startswith=year_prefix
                ).aggregate(max_num=Max('admission_number'))['max_num']
                
                if max_admission:
                    try:
                        # Extract the sequence part and increment it
                        last_sequence = int(max_admission.split('/')[1])
                        next_num = last_sequence + 1
                    except (IndexError, ValueError):
                        # Fallback if the format is corrupted
                        next_num = Student.objects.filter(admission_number__startswith=year_prefix).count() + 1
                else:
                    next_num = 1
                
                # 3. Format: YY/XXXX (padded to 4)
                self.admission_number = f"{short_year}/{next_num:04d}"
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)

    def __str__(self): return f"{self.full_name} ({self.admission_number})"

    def get_attendance_stats(self):
        """Calculates attendance percentage, prioritizing annotated values."""
        # Use attributes from annotate() if present
        total = getattr(self, 'attendance_total', None)
        present = getattr(self, 'attendance_present', None)
        
        if total is None:
            # Fallback for when not using optimized querysets (e.g. detail view or shell)
            from academics.models import Attendance
            total = Attendance.objects.filter(student=self).count()
            present = Attendance.objects.filter(student=self, status='PRESENT').count()
            
        if not total or total == 0: return 0
        return round((present / total) * 100, 1)

    def get_academic_stats(self):
        """Calculates average score and corresponding grade."""
        # Use attribute from annotate() if present
        avg_score = getattr(self, 'avg_score', None)
        
        if avg_score is None:
            # Fallback for detail views without annotations
            from django.db.models import Avg
            avg_score = self.results.aggregate(Avg('score'))['score__avg']
            
        if avg_score is None:
            return {"average_score": 0, "grade": "N/A", "display": "N/A"}
        
        score = float(avg_score)
        grade = self.get_grade_from_score(score)
        return {
            "average_score": round(score, 1),
            "grade": grade,
            "display": f"{grade} ({round(score)}%)"
        }

    @staticmethod
    def get_grade_from_score(score):
        """Standard hardcoded fallback grading scale."""
        if score >= 80: return 'A'
        if score >= 75: return 'A-'
        if score >= 70: return 'B+'
        if score >= 65: return 'B'
        if score >= 60: return 'B-'
        if score >= 55: return 'C+'
        if score >= 50: return 'C'
        if score >= 45: return 'C-'
        if score >= 40: return 'D+'
        if score >= 35: return 'D'
        if score >= 30: return 'D-'
        return 'E'

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
    
    # Vital Signs baseline
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    blood_pressure = models.CharField(max_length=20, blank=True)
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)

class ActivityRecord(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=100) # Club, Sport, Arts
    name = models.CharField(max_length=200) # e.g. Drama Club
    role = models.CharField(max_length=100, blank=True) # e.g. Captain
    achievements = models.TextField(blank=True)
    year = models.IntegerField()

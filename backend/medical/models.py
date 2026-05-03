from django.db import models
from django.utils import timezone

class MedicalRecord(models.Model):
    STATUS_CHOICES = (
        ('COMPLETED', 'Completed'),
        ('REFERRED', 'Referred'),
        ('PENDING', 'Pending Follow-up'),
    )

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='medical_records')
    date_visited = models.DateTimeField(default=timezone.now, db_index=True)
    nurse = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, blank=True)
    
    reason = models.CharField(max_length=255, blank=True)
    diagnosis = models.CharField(max_length=255)
    treatment_given = models.TextField()
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='COMPLETED')

    # Vital Signs
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True) # cm
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True) # kg
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True) # Celsius
    blood_pressure = models.CharField(max_length=20, blank=True) # e.g. "120/80"
    pulse_rate = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.student} - {self.diagnosis} ({self.date_visited.date()})"

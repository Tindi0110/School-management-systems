from django.db import models
from django.conf import settings

class Staff(models.Model):
    ROLE_CHOICES = (
        ('TEACHER', 'Teacher'),
        ('WARDEN', 'Hostel Warden'),
        ('NURSE', 'Nurse'),
        ('ACCOUNTANT', 'Accountant'),
        ('ADMIN', 'Admin/Principal'),
        ('SUPPORT', 'Support Staff'),
    )
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_profile')
    employee_id = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100, blank=True)
    qualifications = models.TextField(blank=True)
    date_joined = models.DateField()
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.employee_id}"

"""
accounts/models.py

Defines the custom User model for the School Management System.
Uses email as the primary authentication field and includes
role-based access control fields.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    - Email is used as the primary login identifier.
    - Role determines module access across the system.
    - Staff accounts require email verification and admin approval.
    """

    class Role(models.TextChoices):
        ADMIN      = 'ADMIN',      'Administrator'
        PRINCIPAL  = 'PRINCIPAL',  'Principal'
        DEPUTY     = 'DEPUTY',     'Deputy Principal'
        DOS        = 'DOS',        'Director of Studies'
        REGISTRAR  = 'REGISTRAR',  'Admissions Registrar'
        TEACHER    = 'TEACHER',    'Teacher'
        WARDEN     = 'WARDEN',     'Hostel Warden'
        NURSE      = 'NURSE',      'Nurse'
        ACCOUNTANT = 'ACCOUNTANT', 'Accountant'
        LIBRARIAN  = 'LIBRARIAN',  'Librarian'
        STUDENT    = 'STUDENT',    'Student'
        PARENT     = 'PARENT',     'Parent'
        DRIVER     = 'DRIVER',     'Driver'

    email           = models.EmailField(unique=True)
    role            = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    supabase_id     = models.UUIDField(null=True, blank=True, unique=True)
    is_email_verified = models.BooleanField(default=False)
    is_approved     = models.BooleanField(default=False)
    
    # Verification OTP tracking
    email_verification_otp = models.CharField(max_length=6, null=True, blank=True)
    email_verification_otp_created_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    def save(self, *args, **kwargs):
        """Superusers are automatically given admin role, verification, and approval."""
        if self.is_superuser:
            self.role = User.Role.ADMIN
            self.is_email_verified = True
            self.is_approved = True
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.email} ({self.get_role_display()})"

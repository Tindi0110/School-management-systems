from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('PRINCIPAL', 'Principal'),
        ('DEPUTY', 'Deputy Principal'),
        ('DOS', 'Director of Studies'),
        ('REGISTRAR', 'Admissions Registrar'),
        ('TEACHER', 'Teacher'),
        ('WARDEN', 'Hostel Warden'),
        ('NURSE', 'Nurse'),
        ('ACCOUNTANT', 'Accountant'),
        ('LIBRARIAN', 'Librarian'),
        ('STUDENT', 'Student'),
        ('PARENT', 'Parent'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')
    
    def save(self, *args, **kwargs):
        if self.is_superuser and not self.role == 'ADMIN':
            self.role = 'ADMIN'
        super().save(*args, **kwargs)
    
    # Department could be a foreign key, but keeping it simple for now or referencing 'Staff' profile
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group

@receiver(post_save, sender=User)
def sync_user_group(sender, instance, created, **kwargs):
    """
    Syncs the User's 'role' field with Django Groups.
    If the User's role changes, their Group membership is updated.
    """
    if instance.role:
        # Clear existing groups and add the new one based on role
        group_name = instance.role
        group, _ = Group.objects.get_or_create(name=group_name)
        instance.groups.clear()
        instance.groups.add(group)


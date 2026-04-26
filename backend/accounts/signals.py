"""
accounts/signals.py

Django signals for the accounts app.
- Creates a Staff profile when a user with a staff role is approved.
- Syncs the user's role to a Django Group for permission management.
"""

import logging

from django.conf import settings
from django.contrib.auth.models import Group
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from sms.mail import EmailService

logger = logging.getLogger(__name__)

# Roles that map to a Staff profile in the staff module
STAFF_ROLES = frozenset([
    'ADMIN', 'TEACHER', 'PRINCIPAL', 'DEPUTY', 'DOS',
    'REGISTRAR', 'ACCOUNTANT', 'NURSE', 'WARDEN', 'LIBRARIAN', 'DRIVER',
])

# Maps user roles to their primary department name
ROLE_DEPARTMENT_MAP = {
    'ADMIN':      'Administration',
    'PRINCIPAL':  'Administration',
    'DEPUTY':     'Administration',
    'REGISTRAR':  'Administration',
    'DOS':        'Academics',
    'TEACHER':    'Academics',
    'ACCOUNTANT': 'Finance',
    'WARDEN':     'Hostels',
    'NURSE':      'Medical',
    'LIBRARIAN':  'Library',
    'DRIVER':     'Transport',
}


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_staff_profile(sender, instance, **kwargs):
    """
    Creates a Staff profile when a user with a staff role is approved.
    Runs on every save but is a no-op unless approval criteria are met.
    """
    if kwargs.get('raw'):
        return

    if not (instance.is_approved and instance.role in STAFF_ROLES):
        return

    from staff.models import Staff, Department # Local import to avoid circular dependency

    if Staff.objects.filter(user=instance).exists():
        return

    try:
        # Get or create the mapped department
        dept_name = ROLE_DEPARTMENT_MAP.get(instance.role, 'General')
        department, _ = Department.objects.get_or_create(name=dept_name)

        Staff.objects.create(
            user=instance,
            department=department,
            employee_id=f"EMP-{instance.id:04d}",
            date_joined=instance.date_joined.date() if instance.date_joined else timezone.now().date(),
        )
        logger.info("Created Staff profile and assigned to %s department for %s", dept_name, instance.email)

        # 3. Send Approval Email to Staff
        login_link = f"{settings.FRONTEND_URL}/login"
        body = (
            f"Congratulations {instance.username}!\n\n"
            f"Your account on the School Management System has been approved by the administrator.\n\n"
            f"You can now log in using your email and password at:\n"
            f"{login_link}\n\n"
            f"— School Management System"
        )
        try:
            EmailService.send_async('Account Approved — School Management System', body, instance.email)
            logger.info("Approval notification sent to %s", instance.email)
        except Exception:
            logger.exception("Failed to send approval email to %s", instance.email)

    except Exception:
        logger.exception("Failed to create Staff profile for %s", instance.email)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def link_student_profile(sender, instance, **kwargs):
    """
    Automatically links a User with role 'STUDENT' to a Student profile
    if the username matches the student's admission number.
    Runs whenever a User is created or updated.
    """
    if kwargs.get('raw') or instance.role != 'STUDENT' or not instance.username:
        return

    from students.models import Student # Local import to avoid circularity
    
    # If already linked in the DB, skip
    if hasattr(instance, 'student_profile'):
        return

    # Target admission is the username, which had spaces removed during creation.
    target_admission = instance.username.strip()
    
    # Aggressively try finding the student
    # 1. First try exact match (for cleanly formatted numbers)
    student = Student.objects.filter(admission_number__iexact=target_admission).first()
    
    # 2. If not found, try replacing spaces in DB if supported, or falling back
    if not student:
        # Check against replaced-space admission numbers in python
        # (This handles the edge case where DB has '24 / 001' but username is '24/001')
        from django.db.models.functions import Replace
        from django.db.models import Value
        student = Student.objects.annotate(
            clean_adm=Replace('admission_number', Value(' '), Value(''))
        ).filter(clean_adm__iexact=target_admission).first()
    
    if student and not student.user:
        # Link them
        student.user = instance
        student.save(update_fields=['user'])
        logger.info(f"Successfully linked User {instance.username} to Student profile {student.admission_number}")
    elif student:
        # Student exists but already has a user
        if student.user != instance:
            logger.warning(f"Student {target_admission} already linked to another user (ID: {student.user_id})")
    else:
        logger.debug(f"No matching Student profile found for User {instance.username}")


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def sync_user_group(sender, instance, **kwargs):
    """
    Keeps Django Group membership in sync with the user's role field.
    Used for permission checks across the system.
    """
    if kwargs.get('raw') or not instance.role:
        return

    group, _ = Group.objects.get_or_create(name=instance.role)
    instance.groups.set([group])

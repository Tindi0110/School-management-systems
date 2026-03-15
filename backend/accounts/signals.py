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

logger = logging.getLogger(__name__)

# Roles that map to a Staff profile in the staff module
STAFF_ROLES = frozenset([
    'ADMIN', 'TEACHER', 'PRINCIPAL', 'DEPUTY', 'DOS',
    'REGISTRAR', 'ACCOUNTANT', 'NURSE', 'WARDEN', 'LIBRARIAN',
])


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

    from staff.models import Staff  # Local import to avoid circular dependency

    if Staff.objects.filter(user=instance).exists():
        return

    try:
        Staff.objects.create(
            user=instance,
            department=instance.role.title(),
            employee_id=f"EMP-{instance.id:04d}",
            date_joined=instance.date_joined.date() if instance.date_joined else timezone.now().date(),
        )
        logger.info("Created Staff profile for %s", instance.email)
    except Exception:
        logger.exception("Failed to create Staff profile for %s", instance.email)


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

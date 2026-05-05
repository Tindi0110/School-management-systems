"""
staff/models.py

Defines the Staff and Department models.
A Staff profile is automatically created when a user with a staff role
is approved (see accounts/signals.py).
"""

from django.db import models
from django.conf import settings


class Department(models.Model):
    """An organisational department within the institution."""

    name        = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name


class Staff(models.Model):
    """
    Extended profile for a staff member.

    Owns the authoritative `email` and `phone` for contact purposes.
    Both are enforced unique at the database level to prevent duplicates.
    """

    user         = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='staff_profile',
    )
    employee_id  = models.CharField(max_length=20, unique=True)
    department   = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='staff_members',
    )
    email        = models.EmailField(unique=True, null=True, blank=True, help_text="Work email — must be unique across all staff.")
    phone        = models.CharField(max_length=20, unique=True, null=True, blank=True, help_text="Contact phone — must be unique across all staff.")
    qualifications = models.TextField(blank=True)
    date_joined  = models.DateField()

    # ── Computed properties ────────────────────────────────────────────────

    @property
    def full_name(self) -> str:
        return self.user.get_full_name().strip() or self.user.username

    @property
    def role(self) -> str:
        return getattr(self.user, 'role', 'N/A')

    def __str__(self) -> str:
        return f"{self.full_name} ({self.employee_id})"

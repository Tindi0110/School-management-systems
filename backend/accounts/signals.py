from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.utils import timezone
from staff.models import Staff

User = settings.AUTH_USER_MODEL

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_staff_profile(sender, instance, created, **kwargs):
    """
    Automatically create a Staff profile when a new User with a staff role is created.
    """
    if created:
        # Define roles that are considered staff
        STAFF_ROLES = [
            'TEACHER', 'PRINCIPAL', 'DEPUTY', 'DOS', 
            'REGISTRAR', 'ACCOUNTANT', 'NURSE', 'WARDEN', 'LIBRARIAN'
        ]
        
        if instance.role in STAFF_ROLES:
            try:
                # Check if profile already exists (paranoia check)
                if not Staff.objects.filter(user=instance).exists():
                    Staff.objects.create(
                        user=instance,
                        department=instance.role.title(), # Default department
                        employee_id=f"EMP-{instance.id:04d}", # Auto-generate ID (EMP-0001)
                        date_joined=instance.date_joined.date() if instance.date_joined else timezone.now().date()
                    )
                    print(f"[Signal] Created Staff profile for {instance.username}")
            except Exception as e:
                print(f"[Signal] Error creating Staff profile for {instance.username}: {e}")

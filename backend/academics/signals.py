from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Term, AcademicYear, Class, Exam
from students.models import Student
from staff.models import Staff
from finance.models import Invoice
from communication.models import SystemAlert, SchoolEvent

DASHBOARD_CACHE_KEY = 'dashboard_stats_data'

@receiver(post_save, sender=Term)
def sync_term_invoices(sender, instance, created, **kwargs):
    """
    When a Term is created or marked active, ensure all active students 
    have an invoice for this term (which triggers tuition fee addition).
    """
    if kwargs.get('raw'):
        return
        
    if created or instance.is_active:
        try:
            print(f"Syncing invoices for Term: {instance.name}")
            # Deactivate other terms if this one is active
            if instance.is_active:
                Term.objects.filter(is_active=True).exclude(pk=instance.pk).update(is_active=False)

            students = Student.objects.filter(status='ACTIVE')
            for student in students:
                get_or_create_invoice(
                    student, 
                    year_name=instance.year.name, 
                    term_name=instance.name
                )
        except Exception as e:
            print(f"Error syncing term invoices: {e}")
            # Don't re-raise; allow the Term save to succeed even if invoicing fails

@receiver([post_save, post_delete], sender=Student)
@receiver([post_save, post_delete], sender=Staff)
@receiver([post_save, post_delete], sender=Class)
@receiver([post_save, post_delete], sender=AcademicYear)
@receiver([post_save, post_delete], sender=Term)
@receiver([post_save, post_delete], sender=Invoice)
@receiver([post_save, post_delete], sender=SystemAlert)
@receiver([post_save, post_delete], sender=SchoolEvent)
@receiver([post_save, post_delete], sender=Exam)
def invalidate_dashboard_cache(sender, **kwargs):
    """
    Clears the consolidated dashboard statistics cache whenever 
    a related model is created, updated, or deleted.
    """
    cache.delete(DASHBOARD_CACHE_KEY)

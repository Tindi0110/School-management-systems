from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Term, AcademicYear
from students.models import Student
# Import finance signal to trigger invoice creation
from finance.signals import get_or_create_invoice

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


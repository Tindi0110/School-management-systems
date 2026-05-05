from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from finance.models import Invoice
from .models import Student

@receiver(post_save, sender=Invoice)
@receiver(post_delete, sender=Invoice)
def update_student_fee_balance(sender, instance, **kwargs):
    """
    Updates the de-normalized fee_balance on the Student model 
    whenever an Invoice is created, updated, or deleted.
    """
    student = instance.student
    total_balance = student.invoices.aggregate(total=Sum('balance'))['total'] or 0
    
    # We use .update() to avoid triggering student signals recursively if any exist,
    # but since we want to be exact, we update the instance attribute too.
    Student.objects.filter(pk=student.pk).update(fee_balance=total_balance)
    student.fee_balance = total_balance

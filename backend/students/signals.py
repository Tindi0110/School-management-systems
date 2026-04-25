from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from finance.models import Invoice
from .models import Student

@receiver(post_save, sender=Student)
def auto_link_user_account(sender, instance, created, **kwargs):
    """
    Automatically creates/links a User account for a Student.
    Uses admission_number as username.
    """
    if kwargs.get('raw') or not instance.admission_number:
        return

    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Format username: strip and remove spaces
    username = instance.admission_number.strip().replace(" ", "")
    
    if not instance.user:
        # Try to find existing user by username
        user = User.objects.filter(username=username).first()
        
        if not user:
            # Create new user
            # We generate a placeholder email to satisfy uniqueness if missing
            email = f"{username}@placeholder.com"
            user = User.objects.create(
                username=username,
                email=email,
                role='STUDENT'
            )
            user.set_password(username)
            
            # Set names
            name_parts = instance.full_name.split(" ", 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ""
            user.save()
        
        # Link the user
        Student.objects.filter(pk=instance.pk).update(user=user)
        instance.user = user

    # Sync Status
    if instance.user:
        inactive_statuses = ['WITHDRAWN', 'ALUMNI', 'SUSPENDED', 'TRANSFERRED']
        should_be_active = instance.status not in inactive_statuses
        
        if instance.user.is_active != should_be_active:
            instance.user.is_active = should_be_active
            instance.user.save(update_fields=['is_active'])

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

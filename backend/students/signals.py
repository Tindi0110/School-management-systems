from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from finance.models import Invoice
from .models import Student

import logging
logger = logging.getLogger(__name__)

@receiver(post_save, sender=Student)
def auto_link_user_account(sender, instance, created, **kwargs):
    """
    Automatically creates/links a User account for a Student.
    Uses admission_number as username.
    Also synchronizes active status between student profile and user account.
    """
    if kwargs.get('raw') or not instance.admission_number:
        logger.debug(f"Skipping auto-link for student {instance.pk}: No admission number or raw save")
        return

    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Format username: strip and remove spaces
    username = instance.admission_number.strip().replace(" ", "")
    
    # 1. Handle Account Creation/Linking
    # We attempt this even if not 'created' to catch students who were missed initially
    if not instance.user:
        # Try to find existing user by username
        user = User.objects.filter(username=username).first()
        
        if not user:
            # Create new user for the student
            email = f"{username.lower().replace('/', '_')}@placeholder.com"
            try:
                user = User.objects.create(
                    username=username,
                    email=email,
                    role='STUDENT',
                    is_approved=True,
                    is_email_verified=True,
                    is_active=True
                )
                user.set_password(username)
                
                name_parts = instance.full_name.split(" ", 1)
                user.first_name = name_parts[0]
                if len(name_parts) > 1:
                    user.last_name = name_parts[1]
                user.save()
                logger.info(f"Created auto-linked User {username} for Student {instance.admission_number}")
            except Exception as e:
                logger.error(f"Failed to create User for Student {instance.admission_number}: {e}")
                return
        else:
            logger.info(f"Found existing User {username}, linking to Student {instance.admission_number}")
        
        # Link the user
        Student.objects.filter(pk=instance.pk).update(user=user)
        instance.user = user

    # 2. Sync Status
    inactive_statuses = ['WITHDRAWN', 'ALUMNI', 'SUSPENDED', 'TRANSFERRED']
    should_be_active = instance.status not in inactive_statuses
    
    # Update Student's own is_active field
    if hasattr(instance, 'is_active') and instance.is_active != should_be_active:
        Student.objects.filter(pk=instance.pk).update(is_active=should_be_active)
        instance.is_active = should_be_active

    # Update User's is_active field
    if instance.user and instance.user.is_active != should_be_active:
        instance.user.is_active = should_be_active
        instance.user.save(update_fields=['is_active'])
        logger.info(f"Synced User {instance.user.username} is_active to {should_be_active}")

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

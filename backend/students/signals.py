from django.db import models
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.apps import apps
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
    
    # Format username: strip, uppercase, and remove spaces/slashes for consistency if needed
    # But usually, we keep the slashes as per the model's auto-gen.
    username = instance.admission_number.strip().replace(" ", "")
    
    # 1. Handle Account Creation/Linking
    # We attempt this even if not 'created' to catch students who were missed initially
    if not instance.user:
        # Aggressive lookup: try exact and case-insensitive
        user = User.objects.filter(models.Q(username=username) | models.Q(username__iexact=username)).first()
        
        if not user:
            # Create new user for the student
            # Replace slashes with underscores for email if it's used in systems that don't like slashes
            email_prefix = username.lower().replace('/', '_').replace('\\', '_')
            email = f"{email_prefix}@school.com"
            try:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=username,
                    role='STUDENT',
                    is_approved=True,
                    is_email_verified=True,
                    is_active=True
                )
                
                name_parts = instance.full_name.split(" ", 1)
                user.first_name = name_parts[0]
                if len(name_parts) > 1:
                    user.last_name = name_parts[1]
                user.save(update_fields=['first_name', 'last_name'])
                logger.info(f"Successfully created and linked auto-generated User {username} for Student {instance.admission_number}")
            except Exception as e:
                logger.error(f"CRITICAL: Failed to create User for Student {instance.admission_number}. Error: {str(e)}")
                return
        else:
            logger.info(f"Found existing User {user.username} matching Student {instance.admission_number}. Linking now.")
        
        # Link the user to the student
        # We use .update() to avoid re-triggering this signal if the model has other logic
        Student.objects.filter(pk=instance.pk).update(user=user)
        instance.user = user
        logger.info(f"Link established between Student {instance.admission_number} and User PK {user.pk}")

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

@receiver(pre_save, sender=Student)
def handle_category_transition(sender, instance, **kwargs):
    """
    Automates cleanup/setup when a student switches categories (e.g. Boarder -> Day Scholar).
    """
    if not instance.pk or kwargs.get('raw'):
        return

    try:
        old_instance = Student.objects.get(pk=instance.pk)
    except Student.DoesNotExist:
        return

    # 1. BOARDING -> DAY (Cleanup)
    if old_instance.category == 'BOARDING' and instance.category == 'DAY':
        logger.info(f"Transitioning Student {instance.admission_number} to DAY. Cleaning up hostel/fees.")
        
        # A. Cancel Hostel Allocation
        HostelAllocation = apps.get_model('hostel', 'HostelAllocation')
        allocation = HostelAllocation.objects.filter(student=instance, status='ACTIVE').first()
        if allocation:
            allocation.status = 'CANCELLED'
            allocation.save() # This triggers hostel/signals.py to release bed and update residence_details
            logger.info(f"Cancelled active hostel allocation for {instance.admission_number}")

        # B. Remove Hostel Fees from current term's invoice if unpaid
        InvoiceItem = apps.get_model('finance', 'InvoiceItem')
        # Target the current term's invoice specifically
        fees_to_remove = InvoiceItem.objects.filter(
            invoice__student=instance,
            invoice__is_finalized=False
        ).filter(
            models.Q(description__icontains='Boarding') | 
            models.Q(description__icontains='Hostel')
        )
        
        # Only remove if the invoice isn't fully paid yet to avoid messy refunds (manual review for paid ones)
        for fee in fees_to_remove:
            if fee.invoice.status != 'PAID':
                fee.delete() # Triggers finance/signals.py update_student_fee_balance
                logger.info(f"Removed hostel fee '{fee.description}' from invoice {fee.invoice.id}")

    # 2. DAY -> BOARDING (Handled by hostel/signals.py post_save now)
    elif old_instance.category == 'DAY' and instance.category == 'BOARDING':
        logger.info(f"Transitioning Student {instance.admission_number} to BOARDING. Allocation will trigger in post_save.")

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

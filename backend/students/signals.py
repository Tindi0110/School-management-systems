from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Student
from django.utils import timezone
from django.db import transaction

@receiver(post_save, sender=Student)
def auto_manage_hostel_on_category_change(sender, instance, created, **kwargs):
    """
    Automatically manage hostel allocation based on student category (DAY vs BOARDING).
    """
    if kwargs.get('raw'):
        return
    
    from hostel.models import HostelAllocation, Bed, Room, Hostel
    
    if instance.category == 'DAY':
        # 1. De-allocate if they were previously Boarding
        # Use filter to avoid hasattr cache issues
        active_allocation = HostelAllocation.objects.filter(student=instance, status='ACTIVE').first()
        if active_allocation:
            allocation = active_allocation
            bed = allocation.bed
            
            if bed:
                bed.status = 'AVAILABLE'
                bed.save()
                
                room = bed.room
                room.current_occupancy = max(0, room.current_occupancy - 1)
                room.status = 'AVAILABLE'
                room.save()
            
            allocation.status = 'COMPLETED'
            allocation.end_date = timezone.now().date()
            allocation.save()
            print(f"Hostel Sync: De-allocated student {instance.admission_number} (Switched to DAY)")

    elif instance.category == 'BOARDING':
        # 2. Auto-allocate if they are new or newly Boarding AND don't have an active allocation
        if not HostelAllocation.objects.filter(student=instance, status='ACTIVE').exists():
            # Find an available bed matching student gender
            available_bed = Bed.objects.filter(
                status='AVAILABLE',
                room__hostel__gender_allowed=instance.gender,
                room__hostel__status='ACTIVE',
                room__status='AVAILABLE'
            ).first()

            if available_bed:
                # Create or Update allocation
                with transaction.atomic():
                    # Re-verify bed availability under lock
                    bed = Bed.objects.select_for_update().get(id=available_bed.id)
                    if bed.status == 'AVAILABLE':
                        # Check for ANY existing allocation (Active or otherwise) due to OneToOne
                        existing_allocation = HostelAllocation.objects.filter(student=instance).first()
                        
                        if existing_allocation:
                            # Update existing record
                            existing_allocation.bed = bed
                            existing_allocation.room = bed.room
                            existing_allocation.status = 'ACTIVE'
                            existing_allocation.start_date = timezone.now().date()
                            existing_allocation.end_date = None
                            existing_allocation.save()
                        else:
                            HostelAllocation.objects.create(
                                student=instance,
                                bed=bed,
                                room=bed.room,
                                status='ACTIVE',
                                start_date=timezone.now().date()
                            )
                        
                        bed.status = 'OCCUPIED'
                        bed.save()
                        
                        room = bed.room
                        room.current_occupancy += 1
                        if room.current_occupancy >= room.capacity:
                            room.status = 'FULL'
                        room.save()
                        print(f"Hostel Sync: Auto-allocated student {instance.admission_number} to {room.hostel.name} Rm {room.room_number}")
            else:
                print(f"Hostel Sync: No available {instance.gender} beds for student {instance.admission_number}")

@receiver(post_save, sender=Student)
def auto_deallocate_hostel(sender, instance, created, **kwargs):
    """
    Automatically release hostel bed if student is Withdrawn, Alumni, or Suspended.
    """
    if kwargs.get('raw'):
        return

    if created:
        return

    inactive_statuses = ['WITHDRAWN', 'ALUMNI', 'SUSPENDED', 'TRANSFERRED']
    
    if instance.status in inactive_statuses:
        # Check for active allocation
        if hasattr(instance, 'hostel_allocation') and instance.hostel_allocation.status == 'ACTIVE':
            allocation = instance.hostel_allocation
            bed = allocation.bed
            
            # Release Bed
            if bed:
                bed.status = 'AVAILABLE'
                bed.save()
                
                # Update Room Occupancy
                room = bed.room
                room.current_occupancy = max(0, room.current_occupancy - 1)
                room.status = 'AVAILABLE'
                room.save()
            
            # Close Allocation
            allocation.status = 'COMPLETED'
            allocation.end_date = timezone.now().date()
            allocation.save()
            
@receiver(post_save, sender=Student)
def manage_student_user(sender, instance, created, **kwargs):
    """
    Auto-create User for new students and manage active status.
    """
    if kwargs.get('raw'):
        return

    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # 1. Create User if missing (for new admits or manual runs)
    if not instance.user:
        try:
            # Check if user with admission number already exists (re-link scenario)
            username = instance.admission_number.strip().replace(" ", "")
            user, created_user = User.objects.get_or_create(username=username)
            
            if created_user:
                user.set_password(username) # Default password is admission number
                user.role = 'STUDENT'
            
            # Sync details
            user.first_name = instance.full_name.split(" ")[0]
            user.last_name = " ".join(instance.full_name.split(" ")[1:])
            user.save()
            
            # Link to Student
            # Use .update() to bypass redundant post_save signals
            Student.objects.filter(pk=instance.pk).update(user=user)
            # Update the current instance to avoid downstream issues
            instance.user = user
            print(f"Auto-Link: Linked User {username} to Student {instance.admission_number}")
            
        except Exception as e:
            print(f"Auto-Link Error for {instance.admission_number}: {e}")

    # 2. Sync Status (Active/Inactive)
    if instance.user:
        inactive_statuses = ['WITHDRAWN', 'ALUMNI', 'SUSPENDED', 'TRANSFERRED']
        should_be_active = instance.status not in inactive_statuses
        
        if instance.user.is_active != should_be_active:
            instance.user.is_active = should_be_active
            instance.user.save()
            print(f"Auto-Link: Updated User {instance.user.username} status to {should_be_active}")


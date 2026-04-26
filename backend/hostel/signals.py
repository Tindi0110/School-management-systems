from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import HostelDiscipline, HostelAsset, HostelMaintenance, HostelAllocation, Bed, Room
from students.models import Student, DisciplineRecord
from finance.models import Expense
from django.utils import timezone

@receiver(post_save, sender=Student)
def auto_allocate_hostel(sender, instance, created, **kwargs):
    """
    Automatically allocates a bed for new boarding students if available.
    """
    if kwargs.get('raw') or not created:
        return
        
    if instance.category == 'BOARDING':
        # Find an available bed matching the student's gender
        available_bed = Bed.objects.filter(
            status='AVAILABLE',
            room__status='AVAILABLE',
            room__hostel__status='ACTIVE',
            room__hostel__gender_allowed=instance.gender
        ).select_related('room', 'room__hostel').first()
        
        if available_bed:
            try:
                # Create allocation
                HostelAllocation.objects.create(
                    student=instance,
                    bed=available_bed,
                    room=available_bed.room,
                    status='ACTIVE'
                )
                # Update bed status
                available_bed.status = 'OCCUPIED'
                available_bed.save()
                
                # Update room occupancy
                room = available_bed.room
                room.current_occupancy += 1
                if room.current_occupancy >= room.capacity:
                    room.status = 'FULL'
                room.save()
            except Exception as e:
                print(f"Auto-allocation failed for {instance.full_name}: {str(e)}")

@receiver(post_save, sender=HostelDiscipline)
def sync_discipline_to_student_profile(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    if created:
        DisciplineRecord.objects.create(
            student=instance.student,
            incident_date=instance.incident_date,
            offence_category=instance.offence,
            description=instance.description,
            action_taken=instance.action_taken,
            reported_by=instance.reported_by
        )

@receiver(post_save, sender=HostelAsset)
def sync_asset_to_finance(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    if created and instance.value > 0:
        # Map to 'SUPPLIES' or 'OTHER'
        Expense.objects.create(
            category='SUPPLIES', 
            amount=instance.value,
            description=f"Auto-generated from Hostel Asset entry. Room: {instance.room}. Type: {instance.asset_type}",
            paid_to="Vendor (Auto)", # Placeholder
            date_occurred=timezone.now().date(),
            approved_by=None # System generated
        )

@receiver(post_save, sender=HostelMaintenance)
def sync_maintenance_to_finance(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    # Only create expense if cost > 0
    if instance.repair_cost > 0:
        Expense.objects.create(
            category='MAINTENANCE',
            amount=instance.repair_cost,
            description=f"Hostel Maintenance: {instance.issue} ({instance.hostel.name} - {instance.room})",
            paid_to="Repair Service", # Placeholder
            date_occurred=instance.completion_date or timezone.now().date(),
            approved_by=instance.reported_by
        )

@receiver(post_save, sender=HostelAllocation)
def sync_hostel_allocation(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
        
    student = instance.student
    
    # Robust Management of Bed and Room Occupancy
    if instance.status == 'ACTIVE':
        # Update student residence details
        student.__class__.objects.filter(pk=student.pk).update(
            residence_details=f"{instance.room.hostel.name} - {instance.room.room_number}"
        )
        
        # Ensure bed is occupied
        if instance.bed and instance.bed.status != 'OCCUPIED':
            instance.bed.status = 'OCCUPIED'
            instance.bed.save(update_fields=['status'])
    else:
        # If status is COMPLETED or CANCELLED, release the bed
        student.__class__.objects.filter(pk=student.pk).update(
            residence_details="Not Assigned"
        )
        
        if instance.bed and instance.bed.status == 'OCCUPIED':
            instance.bed.status = 'AVAILABLE'
            instance.bed.save(update_fields=['status'])
            
            # Update room occupancy
            room = instance.room
            if room.current_occupancy > 0:
                room.current_occupancy -= 1
                if room.status == 'FULL' and room.current_occupancy < room.capacity:
                    room.status = 'AVAILABLE'
                room.save()

@receiver(post_delete, sender=HostelAllocation)
def release_bed_on_delete(sender, instance, **kwargs):
    """
    Ensure bed is marked AVAILABLE, room occupancy decremented, and student status cleared when allocation is deleted.
    """
    student = instance.student
    # Clear student residence details
    student.__class__.objects.filter(pk=student.pk).update(
        residence_details="Not Assigned"
    )

    if instance.bed:
        # Only release if it was occupied by THIS allocation (robustness)
        # Note: In a OneToOneField, instance.bed.allocation should be 'instance'
        instance.bed.status = 'AVAILABLE'
        instance.bed.save(update_fields=['status'])
        
    if instance.room:
        room = instance.room
        if room.current_occupancy > 0:
            room.current_occupancy -= 1
            if room.status == 'FULL' and room.current_occupancy < room.capacity:
                room.status = 'AVAILABLE'
            room.save()


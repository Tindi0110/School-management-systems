from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import HostelDiscipline, HostelAsset, HostelMaintenance, HostelAllocation
from students.models import DisciplineRecord
from finance.models import Expense
from django.utils import timezone

@receiver(post_save, sender=HostelDiscipline)
def sync_discipline_to_student_profile(sender, instance, created, **kwargs):
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
    student = instance.student
    if instance.status == 'ACTIVE':
        student.residence_details = f"{instance.room.hostel.name} - {instance.room.room_number}"
    else:
        student.residence_details = "Not Assigned" # Or clear it
    student.save()


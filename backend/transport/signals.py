from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import TransportAllocation, FuelRecord
from finance.models import Expense
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=TransportAllocation)
def sync_transport_allocation(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    student = instance.student
    student.transport_details = f"{instance.route.route_code} - {instance.pickup_point.point_name if instance.pickup_point else 'No Point'}"
    student.save()

@receiver(post_delete, sender=TransportAllocation)
def clear_transport_allocation(sender, instance, **kwargs):
    if kwargs.get('raw'):
        return
    try:
        student = instance.student
        student.transport_details = ""
        student.save()
    except:
        pass

@receiver(post_save, sender=FuelRecord)
def sync_fuel_to_expense(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    """
    Auto-create or update an Expense record when Fuel is recorded.
    """
    description = f"Fuel Record #{instance.id}: {instance.liters}L for {instance.vehicle.registration_number}"
    
    # Try to find existing expense linked to this fuel record (by description convention)
    # Using a robust regex or strictly exact match if we control the description
    expense = Expense.objects.filter(description__startswith=f"Fuel Record #{instance.id}:").first()
    
    if not expense:
        expense = Expense(
            category='TRANSPORT',
            paid_to='Pump Station', # Default, or add field to FuelRecord
            approved_by=None # Systems auto-generated
        )
    
    expense.description = description
    expense.amount = instance.amount
    expense.date_occurred = instance.date
    expense.save()

@receiver(post_delete, sender=FuelRecord)
def delete_fuel_expense(sender, instance, **kwargs):
    if kwargs.get('raw'):
        return
    Expense.objects.filter(description__startswith=f"Fuel Record #{instance.id}:").delete()

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import TransportAllocation, FuelRecord, VehicleMaintenance
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
    Expense.objects.update_or_create(
        origin_model='transport.FuelRecord',
        origin_id=instance.id,
        defaults={
            'category': 'TRANSPORT',
            'amount': instance.amount,
            'description': f"Fuel: {instance.liters}L for {instance.vehicle.registration_number} (Receipt: {instance.receipt_no or 'N/A'})",
            'paid_to': 'Pump Station',
            'date_occurred': instance.date,
        }
    )

@receiver(post_delete, sender=FuelRecord)
def delete_fuel_expense(sender, instance, **kwargs):
    if kwargs.get('raw'):
        return
    Expense.objects.filter(origin_model='transport.FuelRecord', origin_id=instance.id).delete()

@receiver(post_save, sender=VehicleMaintenance)
def sync_maintenance_to_expense(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    if instance.cost > 0:
        Expense.objects.update_or_create(
            origin_model='transport.VehicleMaintenance',
            origin_id=instance.id,
            defaults={
                'category': 'MAINTENANCE',
                'amount': instance.cost,
                'description': f"Maintenance: {instance.description} ({instance.vehicle.registration_number})",
                'paid_to': instance.performed_by or 'Mechanic',
                'date_occurred': instance.service_date,
            }
        )

@receiver(post_delete, sender=VehicleMaintenance)
def delete_maintenance_expense(sender, instance, **kwargs):
    if kwargs.get('raw'):
        return
    Expense.objects.filter(origin_model='transport.VehicleMaintenance', origin_id=instance.id).delete()

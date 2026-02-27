from django.db.models.signals import post_save
from django.db import models # for Q objects
from django.dispatch import receiver
from django.utils import timezone
from .models import Invoice, InvoiceItem, Expense, FeeStructure
# Import sender models. Using strings to avoid circular imports if possible, or direct imports if apps are ready.
# It is safer to use string references in ForeignKey, but for signals we need the actual model class or string.
# Using string sender in @receiver is supported in Django.

from students.models import Student
from hostel.models import HostelAllocation, HostelMaintenance, HostelAsset
from transport.models import TransportAllocation, VehicleMaintenance, FuelRecord
from library.models import LibraryFine

from .utils import get_or_create_invoice

@receiver(post_save, sender=HostelAllocation)
def sync_hostel_fee(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    """
    When a student is allocated a room (ACTIVE), add Hostel Fee to invoice.
    ONLY if student is marked as 'BOARDING'.
    """
    if instance.status == 'ACTIVE' and instance.student.category == 'BOARDING':
        # Find Fee Structure for Hostel
        fee_structure = FeeStructure.objects.filter(name__icontains='Boarding').first()
        if not fee_structure:
            fee_structure = FeeStructure.objects.filter(name__icontains='Hostel').first()
        
        amount = fee_structure.amount if fee_structure else 0
        description = f"Hostel Fee: {instance.room.hostel.name} ({instance.room.room_number})"

        invoice = get_or_create_invoice(instance.student)
        
        # IMPROVED DEDUPLICATION:
        # Check for ANY existing item that looks like a Hostel/Boarding fee
        # We check by fee_structure OR by fuzzy description match
        item = InvoiceItem.objects.filter(
            models.Q(invoice=invoice, fee_structure=fee_structure) |
            models.Q(invoice=invoice, description__icontains="Hostel Fee") |
            models.Q(invoice=invoice, description__icontains="Boarding")
        ).first()

        if not item:
            InvoiceItem.objects.create(
                invoice=invoice,
                amount=amount,
                description=description,
                fee_structure=fee_structure
            )
        else:
            # Update existing if needed, but avoid redundant saves
            if item.amount != amount:
                item.amount = amount
                item.description = description
                item.fee_structure = fee_structure
                item.save()
        
        # Recalculate invoice totals
        update_invoice_totals(invoice)

@receiver(post_save, sender=TransportAllocation)
def sync_transport_fee(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    """
    When allocated transport, add Transport Fee.
    """
    if instance.status == 'ACTIVE':
        # Point-Based Pricing Logic:
        # If a Pickup Point exists, its cost is the TOTAL cost.
        # Fallback to Route Base Cost only if no point is selected.
        if instance.pickup_point:
            total_cost = instance.pickup_point.additional_cost
            description = f"Transport: {instance.pickup_point.point_name} (Route: {instance.route.name})"
        else:
            total_cost = instance.route.base_cost
            description = f"Transport: {instance.route.name}"

        invoice = get_or_create_invoice(instance.student)

        # Check for existing transport item
        # Use filter().first() instead of update_or_create with __startswith to avoid MultipleObjectsReturned
        item = InvoiceItem.objects.filter(invoice=invoice, description__startswith="Transport:").first()
        if not item:
            InvoiceItem.objects.create(
                invoice=invoice,
                amount=total_cost,
                description=description
            )
        else:
            item.amount = total_cost
            item.description = description
            item.save()
        
        # We don't need update_invoice_totals because InvoiceItem.save() handles it now

@receiver(post_save, sender=HostelMaintenance)
def sync_hostel_maintenance_expense(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    """
    When maintenance is completed or has cost, create Expense.
    """
    if (instance.status == 'COMPLETED' or instance.repair_cost > 0) and instance.repair_cost > 0:
        description = f"Hostel Repair: {instance.issue} ({instance.hostel.name if instance.hostel else 'General'})"
        
        # Use update_or_create for idempotency and robust updates
        Expense.objects.update_or_create(
            origin_model='hostel.HostelMaintenance',
            origin_id=instance.id,
            defaults={
                'category': 'MAINTENANCE',
                'amount': instance.repair_cost,
                'date_occurred': instance.date_reported if instance.date_reported else timezone.now().date(),
                'description': description,
                'paid_to': 'Maintenance Vendor',
                'approved_by': instance.reported_by
            }
        )

@receiver(post_save, sender=VehicleMaintenance)
def sync_vehicle_maintenance_expense(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    if (instance.status == 'COMPLETED' or instance.cost > 0) and instance.cost > 0:
        description = f"Vehicle Service: {instance.vehicle.registration_number} - {instance.description}"
        
        Expense.objects.update_or_create(
            origin_model='transport.VehicleMaintenance',
            origin_id=instance.id,
            defaults={
                'category': 'MAINTENANCE',
                'amount': instance.cost,
                'date_occurred': instance.service_date,
                'description': description,
                'paid_to': instance.performed_by or 'Mechanic'
            }
        )

@receiver(post_save, sender=FuelRecord)
def sync_fuel_expense(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    if instance.amount > 0:
        description = f"Fuel Purchase: {instance.vehicle.registration_number} - {instance.liters}L (Receipt: {instance.receipt_no or 'N/A'})"
        
        # We use update_or_create with origin tracking to ensure persistence on deletion
        Expense.objects.update_or_create(
            origin_model='transport.FuelRecord',
            origin_id=instance.id,
            defaults={
                'category': 'OTHER',
                'amount': instance.amount,
                'date_occurred': instance.date,
                'description': description,
                'paid_to': 'Fuel Station'
            }
        )

@receiver(post_save, sender=HostelAsset)
def sync_asset_purchase_expense(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    if created and instance.value > 0:
        total_value = instance.value * instance.quantity
        description = f"Asset Purchase: {instance.asset_type} x{instance.quantity} for {instance.hostel.name if instance.hostel else 'Storage'}"
        
        Expense.objects.update_or_create(
            origin_model='hostel.HostelAsset',
            origin_id=instance.id,
            defaults={
                'category': 'SUPPLIES',
                'amount': total_value,
                'date_occurred': instance.last_audit_date or timezone.now().date(),
                'description': description,
                'paid_to': 'Supplier'
            }
        )

@receiver(post_save, sender=Student)
def auto_create_tuition_invoice(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    """
    Ensure every new student has a base invoice with tuition fees, 
    regardless of whether they have a hostel/transport allocated yet.
    """
    if created and instance.status == 'ACTIVE':
        try:
            get_or_create_invoice(instance)
            print(f"Finance Sync: Created initial tuition invoice for student {instance.admission_number}")
        except Exception as e:
            print(f"Finance Sync Error for {instance.admission_number}: {e}")

def update_invoice_totals(invoice):
    """
    Recalculate total_amount for invoice based on items.
    """
    total = sum(item.amount for item in invoice.items.all())
    invoice.total_amount = total
    invoice.update_balance() # Saves the model

@receiver(post_save, sender=Invoice)
def sync_fine_payment(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    """
    When Invoice is PAID or OVERPAID, mark linked Library Fines as PAID.
    """
    if instance.status in ['PAID', 'OVERPAID'] or instance.balance <= 0:
        # distinct() is good practice if multiple adjustments link to same fine (unlikely OneToOne but safe)
        # We need to find Adjustments on this invoice that have a library_fine
        # library_fine is the related_name on Adjustment from LibraryFine model
        
        # We need to import LibraryFine but avoid circular import. 
        # Best to use string relationship or check hasattr
        
        for adjustment in instance.adjustments.all():
            if hasattr(adjustment, 'library_fine'):
                fine = adjustment.library_fine
                if fine.status != 'PAID':
                    fine.status = 'PAID'
                    fine.save()
                    print(f"Finance Sync: Marked Library Fine {fine.id} as PAID (Invoice {instance.id} cleared)")

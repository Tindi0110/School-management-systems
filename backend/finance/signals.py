from django.db.models.signals import post_save, post_delete
from django.db import models # for Q objects
from django.dispatch import receiver
from django.utils import timezone
from .models import Invoice, InvoiceItem, Expense, FeeStructure, Payment, Adjustment
# Import sender models. Using strings to avoid circular imports if possible, or direct imports if apps are ready.
# It is safer to use string references in ForeignKey, but for signals we need the actual model class or string.
# Using string sender in @receiver is supported in Django.

from students.models import Student
from hostel.models import HostelAllocation, HostelMaintenance, HostelAsset
from transport.models import TransportAllocation, VehicleMaintenance, FuelRecord


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
        invoice = get_or_create_invoice(instance.student)
        
        # Find Fee Structure for Hostel matching this specific term and year
        fee_structure = FeeStructure.objects.filter(
            academic_year=invoice.academic_year,
            term=invoice.term,
            is_active=True
        ).filter(
            models.Q(name__icontains='Boarding') | models.Q(name__icontains='Hostel')
        ).first()

        amount = fee_structure.amount if fee_structure else 0
        description = f"Hostel Fee: {instance.room.hostel.name} ({instance.room.room_number})"
        
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
@receiver(post_delete, sender=Invoice)
def update_student_fee_balance(sender, instance, **kwargs):
    """
    Recalculates total fee_balance for a student whenever an invoice changes or is deleted.
    Also clears the dashboard stats cache to ensure real-time updates.
    """
    if kwargs.get('raw'):
        return
    
    # 1. Clear Server-side Stats Cache
    from django.core.cache import cache
    cache.delete('finance_dashboard_stats_active')
    cache.delete('finance_dashboard_stats_alltime')

    # 2. Update Student Balance
    invoice = instance
    student = invoice.student
    
    # Sum up all invoice balances for this student
    total_balance = student.invoices.aggregate(
        total=models.Sum('balance')
    )['total'] or 0
    
    if student.fee_balance != total_balance:
        Student.objects.filter(pk=student.pk).update(fee_balance=total_balance)
        student.fee_balance = total_balance
        print(f"Finance Sync: Updated fee_balance for {student.admission_number} to {total_balance}")

@receiver(post_save, sender=Invoice)
def sync_fine_payment(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    """
    When Invoice is PAID or OVERPAID, mark linked Library Fines as PAID.
    """
    if instance.status in ['PAID', 'OVERPAID'] or instance.balance <= 0:
        for adjustment in instance.adjustments.all():
            if hasattr(adjustment, 'library_fine'):
                fine = adjustment.library_fine
                if fine.status != 'PAID':
                    fine.status = 'PAID'
                    fine.save()
                    print(f"Finance Sync: Marked Library Fine {fine.id} as PAID (Invoice {instance.id} cleared)")

# --- CLEANUP SIGNALS (Preventing Orphaned Expenses) ---

@receiver(post_delete, sender=HostelMaintenance)
def cleanup_hostel_maintenance_expense(sender, instance, **kwargs):
    Expense.objects.filter(origin_model='hostel.HostelMaintenance', origin_id=instance.id).delete()

@receiver(post_delete, sender=VehicleMaintenance)
def cleanup_vehicle_maintenance_expense(sender, instance, **kwargs):
    Expense.objects.filter(origin_model='transport.VehicleMaintenance', origin_id=instance.id).delete()

@receiver(post_delete, sender=FuelRecord)
def cleanup_fuel_expense(sender, instance, **kwargs):
    Expense.objects.filter(origin_model='transport.FuelRecord', origin_id=instance.id).delete()

@receiver(post_delete, sender=HostelAsset)
def cleanup_asset_expense(sender, instance, **kwargs):
    Expense.objects.filter(origin_model='hostel.HostelAsset', origin_id=instance.id).delete()

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
from transport.models import TransportAllocation, VehicleMaintenance

def get_or_create_invoice(student, year_name=None, term_name=None):
    """
    Helper to get active academic year/term invoice or create one.
    Defaults to '2026' / 'Term 1' if not found dynamically (simplification for now).
    Ideally should fetch 'Active' year/term from academics app.
    """
    from academics.models import AcademicYear, Term
    
    # Try to find active year/term
    active_year = AcademicYear.objects.filter(is_active=True).first()
    if not active_year:
        active_year = AcademicYear.objects.first()
    if not active_year:
        active_year = AcademicYear.objects.create(name=year_name or '2026', is_active=True)

    active_term = Term.objects.filter(year=active_year, is_active=True).first()
    if not active_term:
        active_term = Term.objects.filter(year=active_year).first()
    if not active_term:
        active_term = Term.objects.create(
            name=term_name or 'Term 1', 
            year=active_year, 
            is_active=True,
            start_date=timezone.now().date(),
            # 3 months later
            end_date=timezone.now().date() + timezone.timedelta(days=90)
        )

    # Get/Create Invoice
    # We assume 'term' in Invoice model is an Integer (1, 2, 3) based on previous view_file.
    # We need to map Term name to int or just use 1 if unknown.
    term_int = 1
    if '2' in active_term.name: term_int = 2
    elif '3' in active_term.name: term_int = 3

    # Create Invoice if not exists
    invoice, created = Invoice.objects.get_or_create(
        student=student,
        academic_year=active_year,
        term=term_int,
        defaults={
            'status': 'UNPAID',
            'date_generated': timezone.now().date(),
            'is_finalized': False
        }
    )

    # --- AUTO-APPLY STANDARD FEES (Tuition) ---
    # Ensure standard fees (like Tuition) are applied to this invoice
    # We look for FeeStructure with no specific class (Global) or matching Student's class
    std_fees = FeeStructure.objects.filter(
        is_active=True,
        term=term_int,
        academic_year=active_year
    ).filter(
        # Apply Logic: Fee is Global (class_level=None) OR matches Student's Class
        models.Q(class_level__isnull=True) | models.Q(class_level=student.current_class)
    )

    for fee in std_fees:
        # Avoid duplicating if already present
        # We check if an item with this fee_structure already exists on this invoice
        if not InvoiceItem.objects.filter(invoice=invoice, fee_structure=fee).exists():
            InvoiceItem.objects.create(
                invoice=invoice,
                fee_structure=fee,
                description=fee.name, # e.g. "Tuition Fee"
                amount=fee.amount
            )
            # We don't need to call update_invoice_totals here because InvoiceItem.save() now does it automatically (via our previous fix)
            
    return invoice

@receiver(post_save, sender=HostelAllocation)
def sync_hostel_fee(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    """
    When a student is allocated a room (ACTIVE), add Hostel Fee to invoice.
    """
    if instance.status == 'ACTIVE':
        # Find Fee Structure for Hostel
        # We look for a FeeStructure that looks like 'Boarding' or 'Hostel'
        # This is a heuristic. In a real app, maybe Linked to HostelType.
        fee_structure = FeeStructure.objects.filter(name__icontains='Boarding').first()
        if not fee_structure:
            fee_structure = FeeStructure.objects.filter(name__icontains='Hostel').first()
        
        amount = fee_structure.amount if fee_structure else 0
        description = f"Hostel Fee: {instance.room.hostel.name} ({instance.room.room_number})"

        invoice = get_or_create_invoice(instance.student)
        
        # Check if item already exists to avoid duplicates
        # Use filter().first() instead of get_or_create with __icontains to avoid MultipleObjectsReturned
        item = InvoiceItem.objects.filter(invoice=invoice, description__icontains="Hostel Fee").first()
        if not item:
            InvoiceItem.objects.create(
                invoice=invoice,
                amount=amount,
                description=description,
                fee_structure=fee_structure
            )
        else:
            # Update existing if needed
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
        
        # Idempotency check: simplified by checking description/date/amount
        Expense.objects.get_or_create(
            category='MAINTENANCE',
            amount=instance.repair_cost,
            date_occurred=instance.date_reported if instance.date_reported else timezone.now().date(),
            defaults={
                'description': description,
                'paid_to': 'Maintenance Vendor', # Generic
                'approved_by': instance.reported_by
            }
        )

@receiver(post_save, sender=VehicleMaintenance)
def sync_vehicle_maintenance_expense(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    if (instance.status == 'COMPLETED' or instance.cost > 0) and instance.cost > 0:
        description = f"Vehicle Service: {instance.vehicle.registration_number} - {instance.description}"
        
        Expense.objects.get_or_create(
            category='MAINTENANCE',
            amount=instance.cost,
            date_occurred=instance.service_date,
            defaults={
                'description': description,
                'paid_to': instance.performed_by or 'Mechanic'
            }
        )

@receiver(post_save, sender=HostelAsset)
def sync_asset_purchase_expense(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    if created and instance.value > 0:
        total_value = instance.value * instance.quantity
        description = f"Asset Purchase: {instance.asset_type} x{instance.quantity} for {instance.hostel.name if instance.hostel else 'Storage'}"
        
        Expense.objects.get_or_create(
            category='SUPPLIES', # Or OTHER
            amount=total_value,
            date_occurred=instance.last_audit_date, # Approximation
            defaults={
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

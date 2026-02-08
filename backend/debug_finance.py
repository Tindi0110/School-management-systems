import os
import django
from django.conf import settings
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student
from transport.models import TransportAllocation, Route, PickupPoint
from finance.models import Invoice, Payment
from django.contrib.auth import get_user_model

User = get_user_model()

print("--- Debugging Finance for Evans Zariah Jade ---")

# 1. Find Student
student = Student.objects.filter(full_name__icontains="Evans").first()
if not student:
    print("Student not found!")
    exit()

print(f"Student: {student.full_name} ({student.admission_number})")

# 2. Check Transport Allocation
allocation = getattr(student, 'transport_allocation', None)
if allocation:
    print(f"Transport Allocation: {allocation.route.name} - {allocation.pickup_point.point_name if allocation.pickup_point else 'No Pickup'}")
    print(f"Route Base Cost: {allocation.route.base_cost}")
    if allocation.pickup_point:
        print(f"Pickup Additional Cost: {allocation.pickup_point.additional_cost}")
    
    total_expected = allocation.route.base_cost + (allocation.pickup_point.additional_cost if allocation.pickup_point else 0)
    print(f"Total Expected Cost: {total_expected}")
else:
    print("No Transport Allocation found.")

# 3. Check Invoice
invoice = Invoice.objects.filter(student=student).last()
if invoice:
    print(f"Invoice {invoice.id}: Total={invoice.total_amount}, Paid={invoice.paid_amount}, Balance={invoice.balance}, Status={invoice.status}")
    print("Items:")
    for item in invoice.items.all():
        print(f" - {item.description}: {item.amount}")
else:
    print("No Invoice found.")
    # Create one for testing if missing?
    # invoice = Invoice.objects.create(student=student, academic_year_id=1, term=1, total_amount=6000)

# 4. Test Payment Creation
if invoice:
    print("\n--- Testing Payment Creation ---")
    try:
        # Get admn user
        admin = User.objects.filter(is_superuser=True).first()
        payment = Payment(
            invoice=invoice,
            amount=Decimal('500'),
            method='CASH',
            received_by=admin,
            reference_number=f"TEST-{os.urandom(4).hex()}"
        )
        payment.save()
        print(f"Payment Saved Successfully! New Paid Amount: {invoice.paid_amount}")
        
        # Verify invoice update
        invoice.refresh_from_db()
        print(f"Invoice After Payment: Paid={invoice.paid_amount}, Balance={invoice.balance}")
        
    except Exception as e:
        print(f"PAYMENT SAVE FAILED: {e}")
        import traceback
        traceback.print_exc()

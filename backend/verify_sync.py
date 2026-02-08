import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student
from transport.models import TransportAllocation
from finance.models import Invoice, FeeStructure

print("--- Verifying Full Finance Sync for Evans ---")
student = Student.objects.filter(full_name__icontains="Evans").first()
if not student:
    print("Student not found")
    exit()

# 1. Trigger Signal to run get_or_create_invoice logic
print("Triggering Transport Allocation Save...")
if hasattr(student, 'transport_allocation'):
    student.transport_allocation.save() # This should call sync_transport_fee -> get_or_create_invoice -> Add Tuition

# 2. Check Invoice
invoice = Invoice.objects.filter(student=student).last()
if invoice:
    print(f"Invoice {invoice.id} Status:")
    print(f"Total Amount: {invoice.total_amount}")
    print(f"Paid Amount: {invoice.paid_amount}")
    print(f"Balance: {invoice.balance}")
    print(f"Status: {invoice.status}")
    print("Items:")
    for item in invoice.items.all():
        print(f" - {item.description}: {item.amount}")
    
    # Validation
    expected_total = Decimal('23000.00') # 20k Tuition + 3k Transport
    if abs(invoice.total_amount - expected_total) < Decimal('1.00'):
        print("\nSUCCESS: Total matches Expected (23,000)")
    else:
        print(f"\nFAIL: Total {invoice.total_amount} != Expected {expected_total}")

else:
    print("No invoice found.")

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from finance.models import Payment

# Find payments with empty string as reference_number
empty_ref_payments = Payment.objects.filter(reference_number="")
print(f"Found {empty_ref_payments.count()} payments with empty reference number string.")

for p in empty_ref_payments:
    print(f"Payment ID: {p.id}, Amount: {p.amount}, Date: {p.date_received}")

# Find if there are duplicates with null reference numbers (should be fine in Postgres)
null_ref_payments = Payment.objects.filter(reference_number__isnull=True)
print(f"Found {null_ref_payments.count()} payments with null reference number.")

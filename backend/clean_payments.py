import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from finance.models import Payment

# Handle the single existing record with "" to prevent it blocking logic
Payment.objects.filter(reference_number="").update(reference_number=None)
print("Updated empty reference numbers to NULL.")

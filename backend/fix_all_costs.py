import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from transport.models import PickupPoint
from finance.models import FeeStructure

print("--- Normalizing Transport Costs ---")
# 1. Zero out all PickupPoint additional costs
points = PickupPoint.objects.all()
for p in points:
    if p.additional_cost > 0:
        print(f"Zeroing cost for {p.point_name} (Was: {p.additional_cost})")
        p.additional_cost = 0
        p.save()
print("All Pickup Points set to 0 additional cost.")

print("\n--- Ensuring Standard Tuition Fee Exists ---")
# 2. Check for Standard Tuition Fee
tuition, created = FeeStructure.objects.get_or_create(
    name="Tuition Fee",
    defaults={
        'amount': 20000.00,
        'term': 1, # Term 1
        'description': 'Standard Term Tuition',
        'is_active': True
    }
)
if created:
    print("Created Default Tuition Fee (20,000)")
else:
    print(f"Tuition Fee exists: {tuition.amount}")

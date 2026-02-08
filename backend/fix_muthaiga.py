import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from transport.models import PickupPoint, TransportAllocation
from finance.models import Invoice, InvoiceItem

print("Fixing Muthaiga Cost...")

# 1. Update Pickup Point
muthaiga = PickupPoint.objects.filter(point_name__icontains="Muthaiga").first()
if muthaiga:
    print(f"Found Muthaiga. Old Cost: {muthaiga.additional_cost}")
    muthaiga.additional_cost = 0
    muthaiga.save()
    print("Updated Muthaiga Cost to 0.")

    # 2. Update Allocations/Invoices that use this
    # We need to find invoice items for this and update them? or just re-save allocations?
    # Re-saving allocation triggers signal, which updates InvoiceItem.
    allocations = TransportAllocation.objects.filter(pickup_point=muthaiga)
    for alloc in allocations:
        print(f"Updating allocation for {alloc.student.full_name}...")
        alloc.save() # Triggers sync_transport_fee -> updates InvoiceItem -> Recalculates Invoice
        print("Done.")

else:
    print("Muthaiga pickup point not found.")

import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from transport.models import Route, PickupPoint, TransportAllocation

print("--- Migrating Transport Costs to Point-Based ---")

routes = Route.objects.all()
for route in routes:
    # 1. Capture Route Cost
    old_base_cost = route.base_cost
    print(f"Processing Route: {route.name} (Base: {old_base_cost})")

    if old_base_cost > 0:
        # 2. Assign to all child Pickup Points
        points = route.pickup_points.all()
        if points.exists():
            print(f"  -> Applying {old_base_cost} to {points.count()} pickup points...")
            for p in points:
                # We overwrite the cost to match the route base cost (per user request to make point determine cost)
                # If point previously had 0 (from my last fix), it now gets 3000.
                p.additional_cost = old_base_cost
                p.save()
                print(f"     - Updated {p.point_name} to {p.additional_cost}")
            
            # 3. Clear Route Cost
            route.base_cost = 0
            route.save()
            print("  -> Route Base Cost cleared to 0.")
        else:
            print("  -> No pickup points found. Leaving Route Base Cost as fallback.")
    else:
        print("  -> Route already has 0 base cost (or negative). Skipping.")

print("\n--- Triggering Recalculation for Active Allocations ---")
allocations = TransportAllocation.objects.all()
for alloc in allocations:
    print(f"Syncing allocation for {alloc.student.full_name}...")
    alloc.save() # Triggers signal to update invoice based on new Point costs

print("Migration Complete.")

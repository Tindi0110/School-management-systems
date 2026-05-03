from django.core.management.base import BaseCommand
from finance.signals import sync_hostel_fee, sync_transport_fee, sync_hostel_maintenance_expense, sync_vehicle_maintenance_expense, sync_asset_purchase_expense
from hostel.models import HostelAllocation, HostelMaintenance, HostelAsset
from transport.models import TransportAllocation, VehicleMaintenance

class Command(BaseCommand):
    help = 'Syncs existing backend data (Allocations, Maintenance, Assets) to Finance Invoices and Expenses.'

    def handle(self, *args, **options):
        self.stdout.write("Starting Finance Synchronization...")

        # 1. Hostel Allocations
        h_allocs = HostelAllocation.objects.all()
        self.stdout.write(f"Processing {len(h_allocs)} Hostel Allocations...")
        for alloc in h_allocs:
            try:
                sync_hostel_fee(sender=HostelAllocation, instance=alloc, created=False)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error syncing HostelAlloc {alloc.id}: {e}"))

        # 2. Transport Allocations
        t_allocs = TransportAllocation.objects.all()
        self.stdout.write(f"Processing {len(t_allocs)} Transport Allocations...")
        for alloc in t_allocs:
            try:
                sync_transport_fee(sender=TransportAllocation, instance=alloc, created=False)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error syncing TransportAlloc {alloc.id}: {e}"))
        
        # 3. Hostel Maintenance
        h_maint = HostelMaintenance.objects.all()
        self.stdout.write(f"Processing {len(h_maint)} Hostel Maintenance Records...")
        for m in h_maint:
            try:
                sync_hostel_maintenance_expense(sender=HostelMaintenance, instance=m, created=False)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error syncing HostelMaint {m.id}: {e}"))
        
        # 4. Vehicle Maintenance
        v_maint = VehicleMaintenance.objects.all()
        self.stdout.write(f"Processing {len(v_maint)} Vehicle Maintenance Records...")
        for m in v_maint:
            try:
                sync_vehicle_maintenance_expense(sender=VehicleMaintenance, instance=m, created=False)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error syncing VehicleMaint {m.id}: {e}"))

        # 5. Hostel Assets
        h_assets = HostelAsset.objects.all()
        self.stdout.write(f"Processing {len(h_assets)} Hostel Assets...")
        for a in h_assets:
            try:
                # We treat it as 'created' to force run the logic, but idempotency inside signal handles dups.
                sync_asset_purchase_expense(sender=HostelAsset, instance=a, created=True)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error syncing HostelAsset {a.id}: {e}"))

        self.stdout.write(self.style.SUCCESS("Finance Synchronization Completed."))

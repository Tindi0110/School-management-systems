import os
import django
import sys

# Setup Django environment
sys.path.append(r'c:\Users\Evans\School management system\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from hostel.models import Room, Hostel, Bed, HostelAllocation

def audit_hostel_occupancy():
    print("--- Hostel Occupancy Audit ---")
    
    # Target Twiga Hostel and TWIGA-104 specifically
    try:
        twiga = Hostel.objects.get(name__icontains='Twiga')
        print(f"Auditing Hostel: {twiga.name}")
    except Hostel.DoesNotExist:
        print("Twiga Hostel not found.")
        return

    rooms = Room.objects.filter(hostel=twiga)
    
    for room in rooms:
        # Calculate actual occupancy based on active allocations
        actual_allocations_count = HostelAllocation.objects.filter(room=room, status='ACTIVE').count()
        beds = Bed.objects.filter(room=room)
        occupied_beds_count = beds.filter(status='OCCUPIED').count()
        available_beds_count = beds.filter(status='AVAILABLE').count()
        
        print(f"\nRoom: {room.room_number} (ID: {room.id})")
        print(f"  Capacity:         {room.capacity}")
        print(f"  Stored Occupancy: {room.current_occupancy}")
        print(f"  Stored Status:    {room.status}")
        print(f"  Total Beds:       {beds.count()}")
        print(f"  Available Beds:   {available_beds_count}")
        print(f"  Occupied Beds:    {occupied_beds_count}")
        
        for bed in beds:
            print(f"    - Bed {bed.bed_number}: {bed.status}")
            has_allocation = HostelAllocation.objects.filter(bed=bed, status='ACTIVE').exists()
            if bed.status == 'OCCUPIED' and not has_allocation:
                print(f"      [!] Orphaned 'OCCUPIED' status (No active allocation)")
            elif bed.status == 'AVAILABLE' and has_allocation:
                print(f"      [!] Stale 'AVAILABLE' status (Active allocation exists)")

if __name__ == "__main__":
    audit_hostel_occupancy()

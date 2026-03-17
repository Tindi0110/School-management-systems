import os
import django
import sys

# Setup Django environment
sys.path.append(r'c:\Users\Evans\School management system\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from hostel.models import Room, Hostel, Bed, HostelAllocation

def fix_hostel_data():
    print("--- Fixing Hostel Data ---")
    
    rooms = Room.objects.all()
    
    for room in rooms:
        print(f"\nChecking Room: {room.room_number} (Hostel: {room.hostel.name})")
        
        # 1. Generate missing beds
        current_beds_count = Bed.objects.filter(room=room).count()
        if current_beds_count < room.capacity:
            missing = room.capacity - current_beds_count
            print(f"  [!] Missing {missing} beds. Generating...")
            for i in range(current_beds_count + 1, room.capacity + 1):
                Bed.objects.create(
                    room=room,
                    bed_number=f"{i}",
                    status='AVAILABLE'
                )
        
        # 2. Sync Bed statuses with Allocations
        beds = Bed.objects.filter(room=room)
        for bed in beds:
            has_allocation = HostelAllocation.objects.filter(bed=bed, status='ACTIVE').exists()
            if has_allocation:
                if bed.status != 'OCCUPIED':
                    print(f"  [*] Bed {bed.bed_number} status corrected to OCCUPIED")
                    bed.status = 'OCCUPIED'
                    bed.save()
            else:
                if bed.status == 'OCCUPIED':
                    print(f"  [*] Bed {bed.bed_number} status corrected to AVAILABLE (Orphaned)")
                    bed.status = 'AVAILABLE'
                    bed.save()
        
        # 3. Recalculate Room occupancy
        actual_occupancy = HostelAllocation.objects.filter(room=room, status='ACTIVE').count()
        room.current_occupancy = actual_occupancy
        if actual_occupancy >= room.capacity:
            room.status = 'FULL'
        else:
            room.status = 'AVAILABLE'
        room.save()
        print(f"  [+] Final Occupancy: {room.current_occupancy}/{room.capacity}, Status: {room.status}")

if __name__ == "__main__":
    fix_hostel_data()

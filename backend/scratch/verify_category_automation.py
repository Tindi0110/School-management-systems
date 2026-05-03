import os
import django
import sys

# Setup Django
sys.path.append('/home/evans/Public/School-management-systems/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student
from hostel.models import Hostel, Room, Bed, HostelAllocation
from finance.models import Invoice, InvoiceItem, FeeStructure
from academics.models import AcademicYear, Term, Class
from django.utils import timezone
from decimal import Decimal

def verify():
    print("--- Starting Category Automation Verification ---")
    
    # 1. Setup Environment
    year, _ = AcademicYear.objects.get_or_create(name="2026", defaults={'is_active': True})
    term, _ = Term.objects.get_or_create(name="Term 1", year=year, defaults={'is_active': True, 'start_date': timezone.now(), 'end_date': timezone.now()})
    cls, _ = Class.objects.get_or_create(name="Form 1", defaults={'capacity': 40})
    
    # Create Hostel Fee Structure
    hostel_fee, _ = FeeStructure.objects.get_or_create(
        name="Hostel Fee",
        academic_year=year,
        term=1,
        defaults={'amount': Decimal('5000'), 'is_active': True}
    )
    
    # Create Hostel, Room, Bed
    hostel, _ = Hostel.objects.get_or_create(name="Test Hostel", gender_allowed='M', defaults={'capacity': 100})
    room, _ = Room.objects.get_or_create(hostel=hostel, room_number="101", defaults={'capacity': 4})
    bed, _ = Bed.objects.get_or_create(room=room, bed_number="1", defaults={'status': 'AVAILABLE'})
    
    # Ensure bed is available
    bed.status = 'AVAILABLE'
    bed.save()
    room.current_occupancy = 0
    room.save()

    # 2. Create BOARDING Student
    print("\n[Step 1] Creating BOARDING Student...")
    student = Student.objects.create(
        full_name="Automation Test Student",
        gender='M',
        date_of_birth="2010-01-01",
        category='BOARDING',
        current_class=cls,
        status='ACTIVE'
    )
    
    # Check Allocation
    alloc = HostelAllocation.objects.filter(student=student, status='ACTIVE').first()
    if alloc:
        print(f"PASS: Bed {alloc.bed.bed_number} allocated.")
    else:
        print("FAIL: No bed allocated.")
        
    # Check Fee
    invoice = student.invoices.first()
    if invoice:
        hostel_item = invoice.items.filter(description__icontains='Hostel').first()
        if hostel_item:
            print(f"PASS: Hostel fee ({hostel_item.amount}) added to invoice.")
        else:
            print("FAIL: No hostel fee found on invoice.")
    else:
        print("FAIL: No invoice found.")

    # 3. Change to DAY
    print("\n[Step 2] Changing Category to DAY...")
    student.category = 'DAY'
    student.save()
    
    # Check Allocation
    alloc.refresh_from_db()
    if alloc.status == 'CANCELLED':
        print("PASS: Hostel allocation CANCELLED.")
    else:
        print(f"FAIL: Allocation status is {alloc.status}")
        
    bed.refresh_from_db()
    if bed.status == 'AVAILABLE':
        print("PASS: Bed released (AVAILABLE).")
    else:
        print(f"FAIL: Bed status is {bed.status}")
        
    # Check Fee removal
    invoice.refresh_from_db()
    hostel_item = invoice.items.filter(description__icontains='Hostel').first()
    if not hostel_item:
        print("PASS: Hostel fee removed from invoice.")
    else:
        print("FAIL: Hostel fee still exists on invoice.")

    # 4. Change back to BOARDING
    print("\n[Step 3] Changing Category back to BOARDING...")
    student.category = 'BOARDING'
    student.save()
    
    # Check New Allocation
    new_alloc = HostelAllocation.objects.filter(student=student, status='ACTIVE').first()
    if new_alloc:
        print(f"PASS: New bed {new_alloc.bed.bed_number} allocated.")
    else:
        print("FAIL: No bed allocated for returning boarder.")
        
    # Check Fee restoration
    invoice.refresh_from_db()
    hostel_item = invoice.items.filter(description__icontains='Hostel').first()
    if hostel_item:
        print(f"PASS: Hostel fee ({hostel_item.amount}) restored to invoice.")
    else:
        print("FAIL: Hostel fee not restored to invoice.")

    # 5. Cleanup
    # student.delete()
    print("\nVerification Complete.")

if __name__ == "__main__":
    verify()

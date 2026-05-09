import os
import django
import sys

sys.path.append(r'c:\Users\Evans\School management system\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student
from finance.models import Invoice, Payment
from hostel.models import Hostel, Room, Bed, HostelAllocation
from transport.models import Vehicle, TransportAllocation

def audit_data():
    print("--- Database Record Counts ---")
    print(f"Students: {Student.objects.count()}")
    print(f"Finance - Invoices: {Invoice.objects.count()}")
    print(f"Finance - Payments: {Payment.objects.count()}")
    print(f"Hostel - Hostels: {Hostel.objects.count()}")
    print(f"Hostel - Rooms: {Room.objects.count()}")
    print(f"Hostel - Beds: {Bed.objects.count()}")
    print(f"Hostel - Allocations: {HostelAllocation.objects.count()}")
    print(f"Transport - Vehicles: {Vehicle.objects.count()}")
    print(f"Transport - Allocations: {TransportAllocation.objects.count()}")
    
    print("\n--- Checking for Data Consistency Issues ---")
    
    # Check for empty fields in students
    students = Student.objects.all()
    missing_names = students.filter(first_name='').count() + students.filter(last_name='').count()
    missing_classes = students.filter(current_class__isnull=True).count()
    print(f"Students with missing names: {missing_names}")
    print(f"Students without a class assigned: {missing_classes}")
    
    # Check for finance issues
    invoices = Invoice.objects.all()
    orphaned_invoices = invoices.filter(student__isnull=True).count()
    print(f"Orphaned Fee Invoices (no student): {orphaned_invoices}")

    # Check for hostel issues
    allocations = HostelAllocation.objects.all()
    orphaned_allocations = allocations.filter(student__isnull=True).count()
    print(f"Orphaned Hostel Allocations (no student): {orphaned_allocations}")
    
    allocations_without_bed = allocations.filter(bed__isnull=True).count()
    print(f"Hostel Allocations without a bed assigned: {allocations_without_bed}")

if __name__ == "__main__":
    audit_data()

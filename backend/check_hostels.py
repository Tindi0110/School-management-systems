import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student
from hostel.models import HostelAllocation

boarders = Student.objects.filter(category='BOARDING')
allocations = HostelAllocation.objects.filter(status='ACTIVE')

print(f"Total Boarding Students: {boarders.count()}")
print(f"Total Active Hostel Allocations: {allocations.count()}")

allocated_student_ids = set(allocations.values_list('student_id', flat=True))
unallocated_boarders = boarders.exclude(id__in=allocated_student_ids)

print("\nBoarding students without active hostel allocation:")
for s in unallocated_boarders:
    print(f"- {s.full_name} ({s.admission_number}) - Registered: {s.date_joined}")

day_scholars_with_allocation = Student.objects.filter(category='DAY', hostel_allocation__status='ACTIVE')
print(f"\nDay scholars with active allocation: {day_scholars_with_allocation.count()}")
for s in day_scholars_with_allocation:
    print(f"- {s.full_name} ({s.admission_number})")

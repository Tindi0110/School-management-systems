import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from academics.models import GradeSystem, GradeBoundary, StudentResult, Exam
from students.models import Student

print("Checking Systems...")
for s in GradeSystem.objects.all():
    print(f"System: {s.name}, Default: {s.is_default}, Boundaries: {s.boundaries.count()}")

print("\nChecking Damaris Njoki...")
damaris = Student.objects.filter(admission_number='26/0002').first()
if damaris:
    print(f"Found: {damaris.full_name}")
    results = StudentResult.objects.filter(student=damaris)
    for r in results:
        print(f"Exam: {r.exam.name}, Term: {r.exam.term}, Sub: {r.subject.name}, Score: {r.score}, Grade: '{r.grade}'")
else:
    print("Damaris not found by ADM 26/0002")

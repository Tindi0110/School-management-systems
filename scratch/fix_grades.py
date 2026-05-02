import os
import sys
import django

# Add backend and venv site-packages
sys.path.append(r'c:\Users\Evans\School management system\backend')
sys.path.append(r'c:\Users\Evans\School management system\.venv\Lib\site-packages')

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
    if not results.exists():
        print("No results found for Damaris.")
    for r in results:
        print(f"Exam: {r.exam.name}, Term: {r.exam.term}, Sub: {r.subject.name}, Score: {r.score}, Grade: '{r.grade}'")
        if not r.grade or r.grade == 'N/A':
            print(f"Fixing grade for {r.subject.name}...")
            r.calculate_grade()
            r.save()
            print(f"New Grade: {r.grade}")
else:
    print("Damaris not found by ADM 26/0002")

print("\nEnsuring all results have grades...")
# Recalculate for all results that might have empty grades
missing = StudentResult.objects.filter(grade__in=['', 'N/A'])
print(f"Found {missing.count()} results with missing/NA grades.")
for r in missing:
    r.calculate_grade()
    r.save()
print("All grades verified.")

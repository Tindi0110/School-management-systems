import os
import django
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from academics.models import GradeSystem, GradeBoundary, StudentResult

def run():
    print("Checking Grade Systems...")
    system = GradeSystem.objects.first()
    if not system:
        print("Creating default Grade System...")
        system = GradeSystem.objects.create(name="KNEC 8-4-4", is_default=True)
    
    # Check Boundaries
    if not GradeBoundary.objects.filter(system=system).exists():
        print("Creating default boundaries...")
        GradeBoundary.objects.create(system=system, grade='A', min_score=80, max_score=100, points=12, remarks='Excellent')
        GradeBoundary.objects.create(system=system, grade='A-', min_score=75, max_score=79, points=11, remarks='Very Good')
        GradeBoundary.objects.create(system=system, grade='B+', min_score=70, max_score=74, points=10, remarks='Good')
        GradeBoundary.objects.create(system=system, grade='B', min_score=65, max_score=69, points=9, remarks='Good')
        GradeBoundary.objects.create(system=system, grade='B-', min_score=60, max_score=64, points=8, remarks='Fair')
        GradeBoundary.objects.create(system=system, grade='C+', min_score=55, max_score=59, points=7, remarks='Fair')
        GradeBoundary.objects.create(system=system, grade='C', min_score=50, max_score=54, points=6, remarks='Average')
        GradeBoundary.objects.create(system=system, grade='C-', min_score=45, max_score=49, points=5, remarks='Weak')
        GradeBoundary.objects.create(system=system, grade='D+', min_score=40, max_score=44, points=4, remarks='Poor')
        GradeBoundary.objects.create(system=system, grade='D', min_score=35, max_score=39, points=3, remarks='Poor')
        GradeBoundary.objects.create(system=system, grade='D-', min_score=30, max_score=34, points=2, remarks='Very Poor')
        GradeBoundary.objects.create(system=system, grade='E', min_score=0, max_score=29, points=1, remarks='Fail')

    print(f"Recalculating grades for {StudentResult.objects.count()} results...")
    count = 0
    for result in StudentResult.objects.all():
        old_grade = result.grade
        result.grade = '' # Force recalc
        result.save() # save() calls calculate_grade()
        print(f"Result {result.id}: Score {result.score} -> Grade {result.grade} (Was: {old_grade})")
        count += 1
    
    print(f"Done. Updated {count} records.")

if __name__ == '__main__':
    run()

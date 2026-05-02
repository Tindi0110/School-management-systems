import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from academics.models import GradeBoundary, GradeSystem

print("Checking Grading Systems...")
systems = GradeSystem.objects.all()
for s in systems:
    print(f"\nSystem: {s.name} (Default: {s.is_default})")
    boundaries = GradeBoundary.objects.filter(system=s).order_by('-min_score')
    print(f"{'Grade':<10} | {'Min':<5} | {'Max':<5} | {'Points':<5}")
    print("-" * 35)
    for b in boundaries:
        print(f"{b.grade:<10} | {b.min_score:<5} | {b.max_score:<5} | {b.points:<5}")

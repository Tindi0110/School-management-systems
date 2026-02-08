import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from academics.models import (
    AcademicYear, Term, SubjectGroup, Subject, 
    GradeSystem, GradeBoundary
)

def seed_academics():
    # 1. Academic Year & Terms
    year, _ = AcademicYear.objects.get_or_create(name="2026", is_active=True)
    
    Term.objects.get_or_create(
        year=year, name="Term 1", 
        start_date=date(2026, 1, 5), end_date=date(2026, 4, 10),
        is_active=True
    )
    Term.objects.get_or_create(
        year=year, name="Term 2", 
        start_date=date(2026, 5, 4), end_date=date(2026, 8, 7)
    )
    Term.objects.get_or_create(
        year=year, name="Term 3", 
        start_date=date(2026, 8, 31), end_date=date(2026, 11, 20)
    )

    # 2. Subject Groups
    groups = ['Sciences', 'Humanities', 'Languages', 'Technical', 'Mathematics']
    for g_name in groups:
        SubjectGroup.objects.get_or_create(name=g_name)

    # 3. Subjects
    sci_group = SubjectGroup.objects.get(name='Sciences')
    lang_group = SubjectGroup.objects.get(name='Languages')
    math_group = SubjectGroup.objects.get(name='Mathematics')

    Subject.objects.get_or_create(name="Mathematics", code="MAT", group=math_group)
    Subject.objects.get_or_create(name="Biology", code="BIO", group=sci_group)
    Subject.objects.get_or_create(name="Physics", code="PHY", group=sci_group)
    Subject.objects.get_or_create(name="English", code="ENG", group=lang_group)

    # 4. Grading System
    system, _ = GradeSystem.objects.get_or_create(name="KCSE Standard Grading", is_default=True)
    
    boundaries = [
        ('A', 80, 100, 12, 'Excellent'),
        ('A-', 75, 79, 11, 'Very Good'),
        ('B+', 70, 74, 10, 'Good'),
        ('B', 65, 69, 9, 'Good'),
        ('B-', 60, 64, 8, 'Above Average'),
        ('C+', 55, 59, 7, 'Average'),
        ('C', 50, 54, 6, 'Satisfactory'),
        ('D', 30, 49, 4, 'Fair'),
        ('E', 0, 29, 1, 'Poor'),
    ]

    for grade, min_s, max_s, pts, rem in boundaries:
        GradeBoundary.objects.get_or_create(
            system=system, grade=grade, 
            min_score=min_s, max_score=max_s, 
            points=pts, remarks=rem
        )

    print("Academic metadata seeded successfully!")

if __name__ == '__main__':
    seed_academics()

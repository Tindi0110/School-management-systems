import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student, Parent, StudentAdmission, DisciplineRecord, HealthRecord
from academics.models import Class
from django.contrib.auth import get_user_model

User = get_user_model()

def seed_sis():
    print("Seeding Expanded SIS Data...")
    
    # 1. Create a few Parents
    p1, _ = Parent.objects.get_or_create(
        full_name="John Kamau",
        relationship="FATHER",
        phone="+254711223344",
        email="john.kamau@example.com",
        occupation="Civil Engineer"
    )
    p2, _ = Parent.objects.get_or_create(
        full_name="Mary Kamau",
        relationship="MOTHER",
        phone="+254722334455",
        email="mary.kamau@example.com",
        occupation="Teacher"
    )
    
    # 2. Assign Parents to Students
    students = Student.objects.all()
    if not students.exists():
        print("No students found. Please run seed_students first.")
        return

    for student in students:
        student.parents.add(p1, p2)
        student.category = "BOARDING" if student.id % 2 == 0 else "DAY"
        student.status = "ACTIVE"
        student.is_active = True
        student.save()
        
        # Create Admission Details
        StudentAdmission.objects.get_or_create(
            student=student,
            previous_school="Nairobi Primary School",
            previous_grade="Class 8",
            nemis_upi="ABC123XYZ",
            birth_certificate_no="BC-12345-678"
        )
        
        # Create Health Record
        HealthRecord.objects.get_or_create(
            student=student,
            blood_group="O+",
            allergies="Peanuts" if student.id % 3 == 0 else "None",
            emergency_contact_name=p1.full_name,
            emergency_contact_phone=p1.phone
        )
        
        # Create a Discipline Record for some
        if student.id % 4 == 0:
            admin_user = User.objects.filter(is_staff=True).first()
            DisciplineRecord.objects.get_or_create(
                student=student,
                incident_date=date.today() - timedelta(days=10),
                offence_category="Lateness",
                description="Repeatedly late for morning assembly.",
                action_taken="Verbal Warning & Clean-up duty",
                reported_by=admin_user
            )

    print("SIS Seeding Completed!")

if __name__ == "__main__":
    seed_sis()

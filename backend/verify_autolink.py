import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student
from django.contrib.auth import get_user_model
from datetime import date

User = get_user_model()

def test_student_auto_creates_user():
    print("Testing: Creating Student should create User...")
    adm_no = "TEST/001"
    full_name = "John Doe Test"
    
    # Ensure no existing student/user
    Student.objects.filter(admission_number=adm_no).delete()
    User.objects.filter(username=adm_no.replace(" ", "")).delete()
    
    student = Student.objects.create(
        admission_number=adm_no,
        full_name=full_name,
        gender='M',
        date_of_birth=date(2010, 1, 1)
    )
    
    # Check if user was created
    user = User.objects.filter(username=adm_no).first()
    if user:
        print(f"SUCCESS: User {user.username} created and linked.")
        if student.user == user:
            print("SUCCESS: Student.user link verified.")
        else:
            print("FAILURE: Student.user link NOT verified.")
    else:
        print("FAILURE: User not created.")

def test_user_links_to_existing_student():
    print("\nTesting: Creating User should link to existing Student...")
    adm_no = "TEST/002"
    full_name = "Jane Doe Test"
    
    # Ensure no existing student/user
    Student.objects.filter(admission_number=adm_no).delete()
    User.objects.filter(username=adm_no).delete()
    
    # Create student manually but bypass signal's user creation (by setting adm_no AFTER save if possible, or just delete user if created)
    student = Student.objects.create(
        admission_number="WILL_CHANGE",
        full_name=full_name,
        gender='F',
        date_of_birth=date(2012, 1, 1)
    )
    student.admission_number = adm_no
    student.user = None
    student.save()
    
    # Delete the user if the signal created it
    User.objects.filter(username=adm_no).delete()
    
    # Now create user
    user = User.objects.create(
        username=adm_no,
        email="jane@test.com",
        role='STUDENT'
    )
    
    student.refresh_from_db()
    if student.user == user:
        print(f"SUCCESS: User {user.username} linked to existing Student {student.admission_number}.")
    else:
        print("FAILURE: User not linked to existing Student.")

if __name__ == "__main__":
    test_student_auto_creates_user()
    test_user_links_to_existing_student()

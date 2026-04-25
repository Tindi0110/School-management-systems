import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')

try:
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    sys.exit(1)

from django.contrib.auth import get_user_model
from students.models import Student
from django.db import transaction

User = get_user_model()

def verify_student_linking():
    print("\n=== VERIFYING STUDENT LINKING ===")
    
    # 1. Test Linking on Student Creation
    adm_no_1 = "LINK-TEST-001"
    print(f"\n1. Testing Student creation for {adm_no_1}...")
    
    # Pre-clean
    Student.objects.filter(admission_number=adm_no_1).delete()
    User.objects.filter(username=adm_no_1).delete()
    
    student = Student.objects.create(
        full_name="Auto Link Student",
        admission_number=adm_no_1,
        gender='M',
        date_of_birth='2000-01-01',
        status='ACTIVE'
    )
    
    user = User.objects.filter(username=adm_no_1).first()
    if user and student.user == user:
        print(f"SUCCESS: Student {adm_no_1} auto-created and linked to User {user.username}")
        print(f"User data: Role={user.role}, Approved={user.is_approved}, Active={user.is_active}")
    else:
        print(f"FAILURE: Linking failed for student {adm_no_1}")

    # 2. Test Linking User to Existing Student
    adm_no_2 = "LINK-TEST-002"
    print(f"\n2. Testing User creation for existing Student {adm_no_2}...")
    
    # Pre-clean
    Student.objects.filter(admission_number=adm_no_2).delete()
    User.objects.filter(username=adm_no_2).delete()
    
    # Create student (temporarily disable signal if needed or just handle what it does)
    # We'll just create the student, if it auto-creates user, we delete the user.
    student2 = Student.objects.create(
        full_name="Exist Student",
        admission_number=adm_no_2,
        gender='F',
        date_of_birth='2000-01-01'
    )
    if student2.user:
        u = student2.user
        Student.objects.filter(pk=student2.pk).update(user=None)
        u.delete()
        student2.refresh_from_db()
        print(f"Student {adm_no_2} exists but is now unlinked.")
    
    # Now create user
    user2 = User.objects.create(
        username=adm_no_2,
        email="test_link@example.com",
        role='STUDENT',
        is_approved=True
    )
    
    student2.refresh_from_db()
    if student2.user == user2:
        print(f"SUCCESS: Existing Student {adm_no_2} linked to new User {user2.username}")
    else:
        print(f"FAILURE: Account signal failed to link student {adm_no_2}")

def verify_status_sync():
    print("\n=== VERIFYING STATUS SYNCHRONIZATION ===")
    
    adm_no = "SYNC-TEST-001"
    Student.objects.filter(admission_number=adm_no).delete()
    User.objects.filter(username=adm_no).delete()
    
    student = Student.objects.create(
        full_name="Status Sync Student",
        admission_number=adm_no,
        gender='M',
        date_of_birth='2000-01-01',
        status='ACTIVE'
    )
    user = student.user
    
    print(f"Initial: Student status={student.status}, Student is_active={student.is_active}, User is_active={user.is_active}")
    
    # Deactivate
    print("\nSetting Student status to SUSPENDED...")
    student.status = 'SUSPENDED'
    student.save()
    
    user.refresh_from_db()
    print(f"After Suspended: Student status={student.status}, Student is_active={student.is_active}, User is_active={user.is_active}")
    
    if student.is_active is False and user.is_active is False:
        print("SUCCESS: Sync worked for SUSPENDED.")
    else:
        print("FAILURE: Sync failed for SUSPENDED.")
        
    # Reactivate
    print("\nSetting Student status back to ACTIVE...")
    student.status = 'ACTIVE'
    student.save()
    
    user.refresh_from_db()
    print(f"After Active: Student status={student.status}, Student is_active={student.is_active}, User is_active={user.is_active}")
    
    if student.is_active is True and user.is_active is True:
        print("SUCCESS: Sync worked for ACTIVE.")
    else:
        print("FAILURE: Sync failed for ACTIVE.")

if __name__ == "__main__":
    verify_student_linking()
    verify_status_sync()

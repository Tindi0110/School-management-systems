import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student
from students.serializers import StudentSerializer
import traceback

def diagnose():
    print("--- DIAGNOSTICS START ---")
    
    # 1. Check Student Count
    count = Student.objects.count()
    print(f"Total Students in DB: {count}")
    
    if count == 0:
        print("WARNING: Database is empty of students.")
        return

    # 2. Try to serialize first 5 students
    students = Student.objects.all()[:5]
    print(f"Testing serialization for {len(students)} students...")
    
    for student in students:
        try:
            print(f"Serializing: {student} (ID: {student.id}, Category: {student.category})")
            serializer = StudentSerializer(student)
            data = serializer.data
            # Access a computed field to ensure it runs
            print(f"  - Hostel: {data.get('hostel_name')}")
            print(f"  - Balance: {data.get('fee_balance')}")
            print("  -> OK")
        except Exception as e:
            print(f"  -> ERROR serializing student {student.id}: {e}")
            traceback.print_exc()

    print("--- DIAGNOSTICS COMPLETE ---")

if __name__ == '__main__':
    diagnose()

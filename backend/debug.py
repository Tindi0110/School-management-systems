import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student
from django.test import Client

client = Client()

# Get the last created student to simulate opening the profile
student = Student.objects.last()
if not student:
    print("No students found.")
else:
    id = student.id
    print(f"Testing with student ID {id}")
    
    # Simulate API gets
    print("1. getOne")
    r1 = client.get(f'/api/students/{id}/')
    if r1.status_code == 500:
        print("FAIL getOne")
        print(r1.content)
    
    print("2. getForStudent Parents")
    r2 = client.get(f'/api/parents/?student_id={id}')
    if r2.status_code == 500:
        print("FAIL Parents")
        print(r2.content)

    print("3. Library")
    r3 = client.get(f'/api/book-lendings/?student_id={id}')
    if r3.status_code == 500:
        print("FAIL Library")
        print(r3.content)

    print("4. Results")
    r4 = client.get(f'/api/student-results/?student_id={id}')
    if r4.status_code == 500:
        print("FAIL Results")
        print(r4.content)

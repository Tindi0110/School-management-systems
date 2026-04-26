import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "management_system.settings")
django.setup()

from students.models import Student
from django.contrib.auth import get_user_model
import datetime

User = get_user_model()

# Create a test student
print("Creating a test student...")
student = Student(
    full_name="Test Student AutoLink",
    gender="M",
    date_of_birth=datetime.date(2010, 1, 1),
    category="DAY",
    status="ACTIVE"
)
student.save()

print(f"Created student. Admission Number: {student.admission_number}")

# Fetch again
student.refresh_from_db()
print(f"Does student have a linked user? {student.user is not None}")

if student.user:
    print(f"Linked user username: {student.user.username}")
else:
    # See if user exists
    username = student.admission_number.strip().replace(" ", "")
    user = User.objects.filter(username=username).first()
    print(f"Does a user with username {username} exist in DB? {user is not None}")
    
# Clean up
if student.user:
    student.user.delete()
student.delete()

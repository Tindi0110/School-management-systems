import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student
from django.contrib.auth import get_user_model

User = get_user_model()

students = Student.objects.all()
unlinked = students.filter(user__isnull=True)

print(f"Total students: {students.count()}")
print(f"Unlinked students: {unlinked.count()}")

for s in unlinked:
    print(f"Student: {s.full_name}, Admission: {s.admission_number}")
    username = s.admission_number.strip().replace(" ", "")
    user = User.objects.filter(username=username).first()
    if user:
        print(f"  - Found matching user: {user.email}")
    else:
        print(f"  - No matching user found for {username}")

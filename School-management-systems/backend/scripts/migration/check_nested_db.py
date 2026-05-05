import os
import django
import sys

# TARGET THE NESTED DB
BASE_DIR = r'c:\Users\Evans\School management system\School-management-systems\backend'
os.chdir(BASE_DIR)
sys.path.append(BASE_DIR)

os.environ['DATABASE_URL'] = f'sqlite:///{os.path.join(BASE_DIR, "db.sqlite3")}'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from accounts.models import User
from students.models import Student
from staff.models import Staff

print("--- Nested SQLite Diagnostic ---")
print(f"Total Users: {User.objects.count()}")
print(f"Total Students: {Student.objects.count()}")
print(f"Total Staff: {Staff.objects.count()}")

for user in User.objects.all()[:5]:
    print(f"User: {user.username} | Role: {user.role} | Super: {user.is_superuser}")

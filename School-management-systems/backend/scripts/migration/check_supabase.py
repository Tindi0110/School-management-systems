import os
import django
import sys

# Setup paths
BASE_DIR = r'c:\Users\Evans\School management system\backend'
os.chdir(BASE_DIR)
sys.path.append(BASE_DIR)

# Configure Django to use Supabase from .env
with open('.env', 'r') as f:
    lines = f.readlines()
    supa_url = ""
    for line in lines:
        if line.startswith('DATABASE_URL='):
            supa_url = line.split('=', 1)[1].strip().strip('"').strip("'")
            break

if not supa_url:
    print("Error: Could not find DATABASE_URL in .env")
    exit(1)

os.environ['DATABASE_URL'] = supa_url
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from accounts.models import User
from students.models import Student
from staff.models import Staff

print("--- Live Supabase Diagnostic ---")
print(f"Total Users: {User.objects.count()}")
print(f"Total Students: {Student.objects.count()}")
print(f"Total Staff: {Staff.objects.count()}")

print("\n--- User Roles ---")
for user in User.objects.all()[:10]: # Check first 10
    print(f"User: {user.username} | Role: {user.role} | Is Superuser: {user.is_superuser}")

superuser = User.objects.filter(is_superuser=True).first()
if superuser:
    print(f"\nSuperuser Detected: {superuser.username}")
    print(f"Superuser Role: {superuser.role}")
else:
    print("\nNO SUPERUSER FOUND IN SUPABASE!")

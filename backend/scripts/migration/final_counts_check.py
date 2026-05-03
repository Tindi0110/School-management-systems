import os
import django
import sys

# Setup paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
os.chdir(BASE_DIR)
sys.path.append(BASE_DIR)

# Configure Django
with open('.env', 'r') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            os.environ['DATABASE_URL'] = line.split('=', 1)[1].strip().strip('"').strip("'")
            break

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from accounts.models import User
from students.models import Student
from staff.models import Staff

print(f"Supabase TOTAL Users: {User.objects.count()}")
print(f"Supabase TOTAL Students: {Student.objects.count()}")
print(f"Supabase TOTAL Staff Profiles: {Staff.objects.count()}")

admins = User.objects.filter(role='ADMIN', is_superuser=True)
print(f"Admins in Supabase: {[u.username for u in admins]}")

if User.objects.filter(username='admin').exists():
    admin = User.objects.get(username='admin')
    print(f"Admin 'admin' exists: Role={admin.role}, is_superuser={admin.is_superuser}")

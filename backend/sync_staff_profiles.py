import os
import django
import sys

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from staff.models import Staff

User = get_user_model()

def sync_staff():
    print("--- Starting Staff Sync ---")
    
    # Roles that should be considered "Staff"
    STAFF_ROLES = ['TEACHER', 'PRINCIPAL', 'DEPUTY', 'DOS', 'REGISTRAR', 'ACCOUNTANT', 'NURSE', 'WARDEN', 'LIBRARIAN']
    
    users = User.objects.filter(role__in=STAFF_ROLES)
    synced_count = 0
    
    for user in users:
        # Check if staff profile exists
        if not Staff.objects.filter(user=user).exists():
            print(f"Creating Staff profile for: {user.username} ({user.role})")
            try:
                Staff.objects.create(
                    user=user,
                    # first_name/last_name/email/role are on the User model, not Staff
                    department=user.role.title(), # Default department to role name
                    employee_id=f"EMP-{user.id:03d}", # Generate a temp ID
                    date_joined=user.date_joined.date() if user.date_joined else timezone.now().date()
                )
                synced_count += 1
            except Exception as e:
                print(f"  Failed: {e}")
        else:
            # print(f"  Skipping {user.username}, already exists.")
            pass
            
    print(f"--- Sync Complete. Created {synced_count} new staff profiles. ---")

if __name__ == '__main__':
    sync_staff()

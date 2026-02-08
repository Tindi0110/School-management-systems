import os
import django
import sys

# Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def verify_rbac():
    # Check Registrar (should have staff + hostels + transport + students)
    try:
        r = User.objects.get(username='registra')
        print(f"\nUser: {r.username} ({r.role})")
        perms = r.get_all_permissions()
        print(f"Has view_staff? {'staff.view_staff' in perms or 'sms.view_staff' in perms}")
        print(f"Has view_hostel? {'hostel.view_hostel' in perms or 'sms.view_hostel' in perms}")
        print(f"Has view_transport? {'transport.view_transportallocation' in perms or 'sms.view_transport' in perms}")
    except: print("Registrar not found")

    # Check DOS (New Role)
    try:
        # Create a test DOS user if not exists
        d, created = User.objects.get_or_create(username='dos_admin', role='DOS', defaults={'email':'dos@school.com'})
        if created: d.set_password('password123'); d.save()
        
        print(f"\nUser: {d.username} ({d.role})")
        perms = d.get_all_permissions()
        print(f"Has view_academics? {'academics.view_academics' in perms}")
        print(f"Has change_exam? {'academics.change_exam' in perms}")
        print(f"Has change_timetable? {'academics.change_timetable' in perms}")
        # Validate NOT finance
        print(f"Has view_invoice? {'finance.view_invoice' in perms}")
    except Exception as e: print(f"DOS Error: {e}")

if __name__ == '__main__':
    verify_rbac()

import os
import django
import sys

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission

User = get_user_model()

def check_perms(username):
    try:
        user = User.objects.get(username=username)
        print(f"\n--- Checking Permissions for: {user.username} (Role: {user.role}) ---")
        
        # 1. Check Groups
        groups = user.groups.all()
        print(f"Groups: {[g.name for g in groups]}")
        
        # 2. Check Permissions from Groups
        if groups:
            for group in groups:
                print(f"  Permissions in Group '{group.name}':")
                perms = group.permissions.all()
                for p in perms:
                    print(f"    - {p.content_type.app_label}.{p.codename}")
        else:
            print("  No Groups assigned.")

        # 3. Check Effective Permissions (what get_all_permissions returns)
        all_perms = user.get_all_permissions()
        print(f"Effective Permissions Count: {len(all_perms)}")
        print(f"Sample Effective Permissions: {list(all_perms)[:5]} ...")
        
        # 4. Specific Checks
        checks = ['finance.view_finance', 'sms.view_dashboard', 'students.view_students']
        for check in checks:
            has_perm = user.has_perm(check)
            print(f"  Has '{check}'? {has_perm}")

    except User.DoesNotExist:
        print(f"User '{username}' not found.")

if __name__ == '__main__':
    # Check a few users based on list_users.py output
    # ID: 6 | User: 'Thesa' | Role: TEACHER
    check_perms('Thesa')
    
    # ID: 4 | User: 'Judy' | Role: ACCOUNTANT
    check_perms('Judy')
    
    # ID: 8 | User: 'Twiri' | Role: LIBRARIAN
    check_perms('Twiri')

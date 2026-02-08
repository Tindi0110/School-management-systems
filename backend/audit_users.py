import os
import django
import sys

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def audit_users():
    print(f"{'USERNAME':<15} | {'ROLE':<15} | {'IS_STAFF':<10} | {'IS_SUPER':<10} | {'GROUPS'}")
    print("-" * 75)
    for u in User.objects.all():
        groups = [g.name for g in u.groups.all()]
        print(f"{u.username:<15} | {u.role:<15} | {str(u.is_staff):<10} | {str(u.is_superuser):<10} | {groups}")

if __name__ == '__main__':
    audit_users()

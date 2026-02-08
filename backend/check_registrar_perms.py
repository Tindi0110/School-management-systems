import os
import django
import sys

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def check_registrar_perms():
    try:
        u = User.objects.get(username='registra')
        perms = u.get_all_permissions()
        print(f"User: {u.username}")
        print(f"Role: {u.role}")
        print("--- Permissions ---")
        for p in sorted(perms):
            print(p)
    except User.DoesNotExist:
        print("User 'registra' not found.")

if __name__ == '__main__':
    check_registrar_perms()

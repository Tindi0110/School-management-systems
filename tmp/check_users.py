import os
import sys
import django

sys.path.append(r'c:\Users\Evans\School management system\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from accounts.models import User

def check_users():
    print("--- User Accounts in Production ---")
    users = User.objects.all()
    for u in users:
        print(f"Username: {u.username} | Email: {u.email} | Active: {u.is_active} | Superuser: {u.is_superuser}")

if __name__ == "__main__":
    check_users()

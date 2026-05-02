import os
import sys
import django

# Add backend to path
sys.path.append(r'c:\Users\Evans\School management system\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from accounts.models import User

def reset_user():
    email = 'tindievans0110@gmail.com'
    new_password = 'SchoolAdmin2026!'
    
    try:
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.is_approved = True
        user.is_email_verified = True
        user.save()
        print(f"SUCCESS: Password for {email} has been reset to '{new_password}'.")
        print(f"Permissions granted: Staff={user.is_staff}, Superuser={user.is_superuser}, Approved={user.is_approved}")
    except User.DoesNotExist:
        print(f"ERROR: User with email {email} not found.")

if __name__ == "__main__":
    reset_user()

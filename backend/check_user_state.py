import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from accounts.models import User
user = User.objects.get(email='josephmatindi8@gmail.com')
print(f"Role: {user.role}, Verified: {user.is_email_verified}, Approved: {user.is_approved}")

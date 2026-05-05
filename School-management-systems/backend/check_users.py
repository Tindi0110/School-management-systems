import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from accounts.models import User
for u in User.objects.all():
    print(f"User ID: {u.id}, Username: '{u.username}', Email: '{u.email}'")

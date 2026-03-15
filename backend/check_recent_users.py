import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from accounts.models import User
users = User.objects.all().order_by('-date_joined')[:5]
for u in users:
    print(f"User: {u.username}, Email: {u.email}, Joined: {u.date_joined}")

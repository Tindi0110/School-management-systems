import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("Checking User Roles:")
for u in User.objects.all().order_by('username'):
    print(f"User: {u.username}, Role: {u.role}, Superuser: {u.is_superuser}, Staff: {u.is_staff}")
    if u.is_superuser and u.role != 'ADMIN':
        print(f"  -> FIXING: Promoting {u.username} to ADMIN")
        u.role = 'ADMIN'
        u.save()

print("\nDone.")

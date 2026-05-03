import os
import sys
import django
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

total = User.objects.count()
migrated = User.objects.exclude(supabase_id=None).count()
unmigrated = User.objects.filter(supabase_id=None).count()

print(f"Total Users: {total}")
print(f"Migrated Users: {migrated}")
print(f"Unmigrated Users: {unmigrated}")

if unmigrated > 0:
    print("FAILED: Some users were not migrated:")
    for u in User.objects.filter(supabase_id=None):
        print(f"  - {u.username} ({u.email})")
    sys.exit(1)
else:
    print("SUCCESS: All users migrated.")
    sys.exit(0)

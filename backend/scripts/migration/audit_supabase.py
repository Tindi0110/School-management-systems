import os
import django
import sys
from django.db import connections
from django.conf import settings
import dj_database_url

# Setup paths
BASE_DIR = r'c:\Users\Evans\School management system\backend'
os.chdir(BASE_DIR)
sys.path.append(BASE_DIR)

# Force Supabase URL
supa_url = ""
with open('.env', 'r') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            supa_url = line.split('=', 1)[1].strip().strip('"').strip("'")
            break

if not supa_url:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

os.environ['DATABASE_URL'] = supa_url
os.environ['DJANGO_SETTINGS_MODULE'] = 'sms.settings'

django.setup()

from django.apps import apps
from accounts.models import User

print("--- Supabase Data Audit ---")
for model in apps.get_models():
    count = model.objects.count()
    if count > 0:
        print(f"{model.__name__}: {count}")

print("\n--- User Details ---")
users = User.objects.all()
print(f"Total Users: {users.count()}")
for u in users:
    print(f"- {u.username} ({u.role})")

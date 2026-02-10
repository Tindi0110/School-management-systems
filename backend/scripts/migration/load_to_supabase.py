import os
import django
import sys
from django.core.management import call_command
from django.db import connections

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
    print("Error: Could not find DATABASE_URL in .env")
    exit(1)

os.environ['DATABASE_URL'] = supa_url
os.environ['DJANGO_SETTINGS_MODULE'] = 'sms.settings'

django.setup()

from accounts.models import User
from django.contrib.auth.models import Group
from rest_framework.authtoken.models import Token

print("--- Supabase Load Script (Conflict Resolve) ---")

# Clear potential conflicts
print("Clearing existing users and tokens in Supabase to avoid conflicts...")
Token.objects.all().delete()
User.objects.all().delete()
Group.objects.all().delete()
print("Conflicts cleared.")

print("Loading data into Supabase...")
try:
    call_command('loaddata', 'data.json')
    print("Successfully migrated data to Supabase!")
except Exception as e:
    print(f"Error during loaddata: {e}")

# Fix roles
print("Finalizing superuser roles...")
sus = User.objects.filter(is_superuser=True)
for su in sus:
    su.role = 'ADMIN'
    su.save()
    print(f"Fixed {su.username} to ADMIN")

print("Migration Complete.")

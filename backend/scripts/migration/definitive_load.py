import os
import django
import sys
import time
from django.core.management import call_command
from django.db import connections, transaction
from django.dispatch import Signal

# 1. HARD MUTE SIGNALS
def muted_send(self, sender, **named):
    return []

Signal.send = muted_send
Signal.send_robust = muted_send

# 2. SETUP
GOLD_DATA_PATH = r'C:\Users\Evans\School management system\School-management-systems\backend\data.json'
MAIN_BACKEND = r'c:\Users\Evans\School management system\backend'

os.chdir(MAIN_BACKEND)
sys.path.append(MAIN_BACKEND)

# 3. GET SUPABASE URL
supa_url = ""
with open('.env', 'r') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            supa_url = line.split('=', 1)[1].strip().strip('"').strip("'")
            break

if not supa_url:
    print("Error: DATABASE_URL not found.")
    sys.exit(1)

# 4. INITIALIZE DJANGO FOR SUPABASE
os.environ['DATABASE_URL'] = supa_url
os.environ['DJANGO_SETTINGS_MODULE'] = 'sms.settings'
django.setup()

from accounts.models import User
from django.contrib.auth.models import Group
from rest_framework.authtoken.models import Token

print("\n=== DEFINITIVE GOLD DATA LOAD ===")

# 5. CLEAR SUPABASE
print("Step 1: Clearing Supabase...")
try:
    with transaction.atomic():
        Token.objects.all().delete()
        User.objects.all().delete()
        Group.objects.all().delete()
    print("Supabase objects (Users, Tokens, Groups) cleared.")
except Exception as e:
    print(f"Clear error: {e}")

# 6. LOAD DATA
print(f"Step 2: Loading data from {GOLD_DATA_PATH}...")
start_time = time.time()
try:
    # Use loaddata on the specific path
    call_command('loaddata', GOLD_DATA_PATH, verbosity=2)
    print(f"Successfully loaded data in {time.time() - start_time:.2f}s")
except Exception as e:
    print(f"CRITICAL LOAD ERROR: {e}")
    sys.exit(1)

# 7. RBAC FIXES
print("\nStep 3: Fixing superuser roles...")
sus = User.objects.filter(is_superuser=True)
for su in sus:
    su.role = 'ADMIN'
    su.save()
    print(f"Configured Superuser: {su.username} -> ADMIN")

# Special case for 'Zariah'
zariah = User.objects.filter(username__iexact='Zariah').first()
if zariah:
    zariah.role = 'ADMIN'
    zariah.is_superuser = True
    zariah.save()
    print("Handled Zariah (ADMIN).")

print(f"\nMigration Summary:")
print(f"- Total Users: {User.objects.count()}")
print(f"- Total Staff: {User.objects.exclude(role='STUDENT').count()}")
print(f"- Superusers: {User.objects.filter(is_superuser=True).count()}")

print("\n=== GOLD LOAD COMPLETED SUCCESSFULLY ===")

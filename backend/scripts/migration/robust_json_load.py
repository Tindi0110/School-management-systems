import os
import django
import sys
import json
import time
from django.db import connections, transaction
from django.dispatch import Signal
from django.core import serializers

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

print("\n=== ROBUST PROGRAMMATIC DATA LOAD ===")

# 5. CLEAR SUPABASE (Users and related)
print("Step 1: Clearing critical Supabase tables...")
try:
    with transaction.atomic():
        Token.objects.all().delete()
        User.objects.all().delete()
        Group.objects.all().delete()
    print("Cleared Users, Tokens, Groups.")
except Exception as e:
    print(f"Clear error: {e}")

# 6. LOAD DATA Programmatically
print(f"Step 2: Loading data from {GOLD_DATA_PATH}...")
start_time = time.time()

with open(GOLD_DATA_PATH, 'rb') as f:
    objects = serializers.deserialize('json', f, ignorenonexistent=True)
    
    count = 0
    success = 0
    errors = 0
    
    # We'll use a set to keep track of what we already cleared to avoid clearing non-user tables multiple times
    # Actually, we'll just try to save. If it fails due to FK, we'll see.
    
    for obj in objects:
        count += 1
        try:
            # Silence signals again just in case some import re-registered them
            Signal.send = muted_send
            Signal.send_robust = muted_send
            
            obj.save()
            success += 1
            if success % 50 == 0:
                print(f"  Processed {success} objects...")
        except Exception as e:
            errors += 1
            # print(f"  Error on object {count} ({obj.object}): {e}")
            
    print(f"\nLoad completed in {time.time() - start_time:.2f}s")
    print(f"Total: {count}, Success: {success}, Errors: {errors}")

# 7. RBAC FIXES
print("\nStep 3: Fixing superuser roles...")
sus = User.objects.filter(is_superuser=True)
for su in sus:
    su.role = 'ADMIN'
    su.save()
    print(f"Configured Superuser: {su.username} -> ADMIN")

zariah = User.objects.filter(username__iexact='Zariah').first()
if zariah:
    zariah.role = 'ADMIN'
    zariah.is_superuser = True
    zariah.save()
    print("Handled Zariah (ADMIN).")

print(f"\nFinal State:")
print(f"- Total Users: {User.objects.count()}")
print(f"- Total Staff: {User.objects.exclude(role='STUDENT').count()}")

print("\n=== MIGRATION COMPLETED ===")

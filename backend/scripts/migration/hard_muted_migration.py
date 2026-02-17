import os
import django
import sys
from django.core.management import call_command
from django.db import connections, transaction

# HARD MUTE SIGNALS
from django.dispatch import Signal

# Save original send
original_send = Signal.send
original_send_robust = Signal.send_robust

def muted_send(self, sender, **named):
    # print(f"Muted signal from {sender}")
    return []

# PATCH
Signal.send = muted_send
Signal.send_robust = muted_send

# Setup paths
NESTED_BASE_DIR = r'c:\Users\Evans\School management system\School-management-systems\backend'
os.chdir(NESTED_BASE_DIR)
sys.path.append(NESTED_BASE_DIR)

# 1. Setup Supabase Connection
MAIN_ENV = r'c:\Users\Evans\School management system\backend\.env'
supa_url = ""
env_to_use = MAIN_ENV if os.path.exists(MAIN_ENV) else '.env'

with open(env_to_use, 'r') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            supa_url = line.split('=', 1)[1].strip().strip('"').strip("'")
            break

if not supa_url:
    print(f"Error: DATABASE_URL not found in {env_to_use}")
    exit(1)

# 2. Setup Django for Supabase immediately
os.environ['DATABASE_URL'] = supa_url
os.environ['DJANGO_SETTINGS_MODULE'] = 'sms.settings'
django.setup()

from accounts.models import User
from django.contrib.auth.models import Group
from rest_framework.authtoken.models import Token

print("\n--- Hard-Muted Migration to Supabase ---")

# Clear Supabase
try:
    with transaction.atomic():
        Token.objects.all().delete()
        User.objects.all().delete()
        Group.objects.all().delete()
    print("Supabase cleared.")
except Exception as e:
    print(f"Clear error: {e}")

# Load data from the migration_data.json we already have in the nested folder 
# (or dump it again if needed, but the previous run dumped it)
# Let's dump again to be safe and use the correct path.
print("Dumping from nested SQLite...")
# Keep muted during dump too? Why not.
os.environ['DATABASE_URL'] = f'sqlite:///{os.path.join(NESTED_BASE_DIR, "db.sqlite3")}'
# We need to re-read settings for SQLite dump
from django.conf import settings
import dj_database_url
settings.DATABASES['default'] = dj_database_url.config(default=os.environ['DATABASE_URL'])
connections['default'].close()

from io import StringIO
output = StringIO()
call_command('dumpdata', exclude=['contenttypes', 'auth.permission'], indent=2, stdout=output)
with open('migration_data.json', 'w') as f:
    f.write(output.getvalue())
print("Dump completed.")

# Switch back to Supabase for load
os.environ['DATABASE_URL'] = supa_url
settings.DATABASES['default'] = dj_database_url.config(default=supa_url)
settings.DATABASES['default']['OPTIONS'] = {'sslmode': 'require'}
connections['default'].close()

print("Loading into Supabase (Hard Muted)...")
try:
    call_command('loaddata', 'migration_data.json')
    print("SUCCESS: Data loaded into Supabase.")
except Exception as e:
    print(f"CRITICAL ERROR during loaddata: {e}")

# 3. Final Fixes
print("\nFixing Administrative roles...")
sus = User.objects.filter(is_superuser=True)
for su in sus:
    su.role = 'ADMIN'
    su.save()
    print(f"Superuser {su.username} set to ADMIN.")

zariah = User.objects.filter(username__iexact='Zariah').first()
if zariah:
    zariah.role = 'ADMIN'
    zariah.is_superuser = True
    zariah.save()
    print("Zariah verified as ADMIN.")

print(f"Migration finished. User count: {User.objects.count()}")

# RESTORE SIGNALS (optional but good practice)
Signal.send = original_send
Signal.send_robust = original_send_robust

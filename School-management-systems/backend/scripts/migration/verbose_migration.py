import os
import django
import sys
import time
from django.core.management import call_command
from django.db import connections, transaction
from django.dispatch import Signal

# 1. HARD MUTE SIGNALS IMMEDIATELY
def muted_send(self, sender, **named):
    return []

Signal.send = muted_send
Signal.send_robust = muted_send

# 2. SETUP PATHS
# Targeting the database that actually has the data
NESTED_BASE_DIR = r'c:\Users\Evans\School management system\School-management-systems\backend'
if not os.path.exists(NESTED_BASE_DIR):
    print(f"Error: Path {NESTED_BASE_DIR} does not exist.")
    sys.exit(1)

os.chdir(NESTED_BASE_DIR)
sys.path.append(NESTED_BASE_DIR)

# 3. GET SUPABASE URL
MAIN_ENV = r'c:\Users\Evans\School management system\backend\.env'
supa_url = ""
with open(MAIN_ENV, 'r') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            supa_url = line.split('=', 1)[1].strip().strip('"').strip("'")
            break

if not supa_url:
    print("Error: DATABASE_URL not found.")
    sys.exit(1)

# 4. INITIALIZE DJANGO
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.conf import settings
import dj_database_url

print("\n=== STARTING VERBOSE MIGRATION ===")

# 5. DUMP FROM NESTED SQLITE
print("Step 1: Dumping data from Nested SQLite...")
os.environ['DATABASE_URL'] = f'sqlite:///{os.path.join(NESTED_BASE_DIR, "db.sqlite3")}'
settings.DATABASES['default'] = dj_database_url.config(default=os.environ['DATABASE_URL'])
connections['default'].close()

from io import StringIO
output = StringIO()
# Exclude problematic models
call_command('dumpdata', exclude=['contenttypes', 'auth.permission', 'sessions', 'admin'], indent=2, stdout=output)
with open('migration_data.json', 'w') as f:
    f.write(output.getvalue())
print(f"Dumped {len(output.getvalue())} bytes to migration_data.json.")

# 6. CLEAR SUPABASE
print("\nStep 2: Clearing Supabase...")
os.environ['DATABASE_URL'] = supa_url
settings.DATABASES['default'] = dj_database_url.config(default=supa_url)
settings.DATABASES['default']['OPTIONS'] = {'sslmode': 'require'}
connections['default'].close()

from accounts.models import User
from django.contrib.auth.models import Group
from rest_framework.authtoken.models import Token

try:
    with transaction.atomic():
        t_count = Token.objects.all().delete()[0]
        u_count = User.objects.all().delete()[0]
        g_count = Group.objects.all().delete()[0]
        print(f"Deleted: {u_count} Users, {t_count} Tokens, {g_count} Groups.")
except Exception as e:
    print(f"Note on clear: {e}")

# 7. LOAD INTO SUPABASE
print("\nStep 3: Loading into Supabase (this may take a minute)...")
start_time = time.time()
try:
    # Use verbosity 2 to see what's happening
    call_command('loaddata', 'migration_data.json', verbosity=2)
    print(f"Load completed in {time.time() - start_time:.2f}s")
except Exception as e:
    print(f"FAILED TO LOAD: {e}")
    sys.exit(1)

# 8. POST-MIGRATION FIXES
print("\nStep 4: Running RBAC fixes...")
sus = User.objects.filter(is_superuser=True)
for su in sus:
    if su.role != 'ADMIN':
        su.role = 'ADMIN'
        su.save()
        print(f"Optimized {su.username} to ADMIN")

zariah = User.objects.filter(username__iexact='Zariah').first()
if zariah:
    zariah.role = 'ADMIN'
    zariah.is_superuser = True
    zariah.save()
    print("Verified Zariah is ADMIN.")

print(f"\nFinal State: {User.objects.count()} Users total in Supabase.")
print("=== MIGRATION SUCCESSFUL ===")

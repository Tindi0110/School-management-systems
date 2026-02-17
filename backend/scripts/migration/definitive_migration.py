import os
import django
import sys
from django.core.management import call_command
from django.db import connections, transaction
from django.db.models.signals import post_save, post_delete, pre_save, pre_delete

# Setup paths
# THE CORRECT DB IS IN THE NESTED FOLDER
NESTED_BASE_DIR = r'c:\Users\Evans\School management system\School-management-systems\backend'
os.chdir(NESTED_BASE_DIR)
sys.path.append(NESTED_BASE_DIR)

# 1. Setup Supabase Connection
# Read .env from the MAIN backend folder or NESTED one?
# Let's check both, but the user has been editing the main one.
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

# 2. DUMP from NESTED SQLite
os.environ['DATABASE_URL'] = f'sqlite:///{os.path.join(NESTED_BASE_DIR, "db.sqlite3")}'
os.environ['DJANGO_SETTINGS_MODULE'] = 'sms.settings'
django.setup()

print("--- Step 1: Dumping from CORRECT Nested SQLite ---")
from io import StringIO
output = StringIO()
call_command('dumpdata', exclude=['contenttypes', 'auth.permission'], indent=2, stdout=output)
data_json = output.getvalue()
with open('migration_data.json', 'w') as f:
    f.write(data_json)
print(f"Dumped {len(data_json)} bytes.")

# 3. DISCONNECT SIGNALS
def disconnect_signals():
    print("Disconnecting signals...")
    from django.apps import apps
    for model in apps.get_models():
        post_save.disconnect(sender=model)
        post_delete.disconnect(sender=model)
        pre_save.disconnect(sender=model)
        pre_delete.disconnect(sender=model)
    print("Signals disconnected.")

# 4. LOAD into Supabase
# Switch DB
os.environ['DATABASE_URL'] = supa_url
from django.conf import settings
import dj_database_url
settings.DATABASES['default'] = dj_database_url.config(default=supa_url)
settings.DATABASES['default']['OPTIONS'] = {'sslmode': 'require'}
connections['default'].close()

print("\n--- Step 2: Loading into Supabase ---")
disconnect_signals()

# Clear Supabase first
from accounts.models import User
from django.contrib.auth.models import Group
from rest_framework.authtoken.models import Token
try:
    with transaction.atomic():
        Token.objects.all().delete()
        User.objects.all().delete()
        Group.objects.all().delete()
    print("Supabase cleared.")
except Exception as e:
    print(f"Note: Error clearing Supabase (may be empty): {e}")

try:
    call_command('loaddata', 'migration_data.json')
    print("Successfully migrated data to Supabase!")
except Exception as e:
    print(f"Error during load: {e}")

# 5. Fix Roles
print("\n--- Step 3: Final Fixes ---")
sus = User.objects.filter(is_superuser=True)
for su in sus:
    su.role = 'ADMIN'
    su.save()
    print(f"Fixed {su.username} role to ADMIN")

# Special check for 'Zariah' if she was in the other DB or manually added
zariah = User.objects.filter(username__iexact='Zariah').first()
if zariah:
    zariah.role = 'ADMIN'
    zariah.is_superuser = True
    zariah.save()
    print("Verified Zariah is an ADMIN.")

print(f"Total Users: {User.objects.count()}")
print("Migration Complete.")

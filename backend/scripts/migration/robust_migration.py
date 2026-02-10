import os
import django
import sys
import json
from django.core.management import call_command
from io import StringIO
from django.db import connections, transaction
from django.conf import settings
import dj_database_url

# Setup paths
BASE_DIR = r'c:\Users\Evans\School management system\backend'
os.chdir(BASE_DIR)
sys.path.append(BASE_DIR)

# 1. DUMP from Local SQLite
os.environ['DATABASE_URL'] = f'sqlite:///{os.path.join(BASE_DIR, "db.sqlite3")}'
os.environ['DJANGO_SETTINGS_MODULE'] = 'sms.settings'

# Initialize Django for SQLite
django.setup()

print("--- Step 1: Dumping data from local SQLite ---")
output = StringIO()
try:
    # Exclude contenttypes and permissions to avoid constraint issues on different DB versions
    call_command('dumpdata', exclude=['contenttypes', 'auth.permission'], indent=2, stdout=output)
    data_json = output.getvalue()
    with open('migration_data.json', 'w') as f:
        f.write(data_json)
    print(f"Successfully dumped data to migration_data.json ({len(data_json)} bytes)")
except Exception as e:
    print(f"Error during dump: {e}")
    sys.exit(1)

# 2. Extract Supabase URL from .env
print("\n--- Step 2: Extracting Supabase URL ---")
supa_url = ""
if os.path.exists('.env'):
    with open('.env', 'r') as f:
        for line in f:
            if line.startswith('DATABASE_URL='):
                supa_url = line.split('=', 1)[1].strip().strip('"').strip("'")
                break

if not supa_url:
    print("Error: DATABASE_URL not found in .env")
    sys.exit(1)
print(f"Found Supabase URL (host: {supa_url.split('@')[-1]})")

# 3. LOAD into Supabase
print("\n--- Step 3: Loading data into Supabase ---")
# Update environment for Supabase
os.environ['DATABASE_URL'] = supa_url

# Force Django to re-read settings with the new DATABASE_URL
# We'll manually patch the settings as django.setup() only runs once
db_config = dj_database_url.config(default=supa_url)
settings.DATABASES['default'] = db_config
settings.DATABASES['default']['CONN_MAX_AGE'] = 600
settings.DATABASES['default']['OPTIONS'] = {'sslmode': 'require'}

# Reset connections
connections['default'].close()

try:
    # Clear existing data in correct order to avoid FK issues
    from django.contrib.auth.models import Group
    from accounts.models import User
    from rest_framework.authtoken.models import Token
    
    print("Clearing existing users and groups in Supabase...")
    with transaction.atomic():
        Token.objects.all().delete()
        User.objects.all().delete()
        Group.objects.all().delete()
    print("Supabase cleared.")

    print("Running loaddata...")
    call_command('loaddata', 'migration_data.json')
    print("Successfully loaded data into Supabase!")
except Exception as e:
    print(f"Error during load: {e}")
    sys.exit(1)

# 4. Verification and RBAC Fix
print("\n--- Step 4: Final verification and RBAC fixes ---")
superuser = User.objects.filter(is_superuser=True).first()
if superuser:
    print(f"Found superuser: {superuser.username}")
    if superuser.role != 'ADMIN':
        superuser.role = 'ADMIN'
        superuser.save()
        print(f"Updated {superuser.username} role to ADMIN")
else:
    print("WARNING: No superuser found in migrated data!")

print(f"Total Users in Supabase: {User.objects.count()}")
print(f"Total Staff in Supabase: {User.objects.filter(role='TEACHER').count()} Teachers (example check)")

print("\n--- MIGRATION PROCESS COMPLETE ---")

import os
import django
import sys
from django.core.management import call_command
from io import StringIO
from django.db import connections
from django.conf import settings
import dj_database_url

# Setup paths
BASE_DIR = r'c:\Users\Evans\School management system\backend'
os.chdir(BASE_DIR)
sys.path.append(BASE_DIR)

# 1. DUMP from Local SQLite
# Set env for dump
os.environ['DATABASE_URL'] = f'sqlite:///{os.path.join(BASE_DIR, "db.sqlite3")}'
os.environ['DJANGO_SETTINGS_MODULE'] = 'sms.settings'

# We need to ensure settings are loaded with the SQLite URL first
if 'django.conf' in sys.modules:
    # If already loaded, we might have issues, but let's try
    pass

django.setup()

print("Dumping data from local SQLite...")
output = StringIO()
call_command('dumpdata', exclude=['auth.permission', 'contenttypes'], indent=2, stdout=output)
data = output.getvalue()
with open('data.json', 'w') as f:
    f.write(data)
print(f"Data dumped locally ({len(data)} bytes).")

# 2. LOAD into Supabase
# Read the REAL DATABASE_URL from .env
supa_url = ""
with open('.env', 'r') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            supa_url = line.split('=', 1)[1].strip().strip('"').strip("'")
            break

if not supa_url:
    print("Error: Could not find DATABASE_URL in .env")
    exit(1)

print(f"Targeting Supabase: {supa_url.split('@')[-1]}") # Print host only for safety

# FORCE settings update
settings.DATABASES['default'] = dj_database_url.parse(supa_url)
settings.DATABASES['default']['CONN_MAX_AGE'] = 600
settings.DATABASES['default']['OPTIONS'] = {'sslmode': 'require'}

# Close old connection to force new one
connections['default'].close()

print("Loading data into Supabase...")
try:
    call_command('loaddata', 'data.json')
    print("Successfully migrated data to Supabase!")
except Exception as e:
    print(f"Error during loaddata: {e}")

# 3. Final Task: Fix Superuser roles in Supabase
from accounts.models import User
superusers = User.objects.filter(is_superuser=True)
for su in superusers:
    su.role = 'ADMIN'
    su.save()
    print(f"Fixed superuser {su.username} role to ADMIN.")

print("Migration Complete.")

import os
import django
import sys
import time
from django.db import connections

# Setup paths
BASE_DIR = r'c:\Users\Evans\School management system\backend'
os.chdir(BASE_DIR)
sys.path.append(BASE_DIR)

# Get URL
supa_url = ""
with open('.env', 'r') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            supa_url = line.split('=', 1)[1].strip().strip('"').strip("'")
            break

print(f"Testing connection to: {supa_url.split('@')[-1]}")

os.environ['DATABASE_URL'] = supa_url
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

start = time.time()
try:
    conn = connections['default']
    conn.ensure_connection()
    print(f"Connection successful in {time.time() - start:.2f}s")
    
    start_query = time.time()
    with conn.cursor() as cursor:
        cursor.execute("SELECT 1")
    print(f"Query successful in {time.time() - start_query:.2f}s")
    
except Exception as e:
    print(f"Connection failed: {e}")

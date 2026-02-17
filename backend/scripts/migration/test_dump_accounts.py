import os
import django
import sys
from django.core.management import call_command

# TARGET THE NESTED DB
BASE_DIR = r'c:\Users\Evans\School management system\School-management-systems\backend'
os.chdir(BASE_DIR)
sys.path.append(BASE_DIR)

os.environ['DATABASE_URL'] = f'sqlite:///{os.path.join(BASE_DIR, "db.sqlite3")}'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

print("Dumping accounts...")
try:
    from io import StringIO
    output = StringIO()
    call_command('dumpdata', 'accounts', indent=2, stdout=output)
    print(f"Dumped accounts: {len(output.getvalue())} bytes")
    with open('accounts_dump.json', 'w') as f:
        f.write(output.getvalue())
except Exception as e:
    print(f"Error: {e}")

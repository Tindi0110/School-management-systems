import os
import django
import json
from django.core.management import call_command
from io import StringIO

# Setup paths
BASE_DIR = r'c:\Users\Evans\School management system\backend'
os.chdir(BASE_DIR)

# Configure Django to use local SQLite for dumping
os.environ['DATABASE_URL'] = f'sqlite:///{os.path.join(BASE_DIR, "db.sqlite3")}'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

print("Dumping data from local SQLite...")
output = StringIO()
call_command('dumpdata', exclude=['auth.permission', 'contenttypes'], indent=2, stdout=output)

data = output.getvalue()
with open('data.json', 'w') as f:
    f.write(data)

print("Data dumped to data.json successfully.")

import os
import django
import sys
import json

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student

def run():
    # Print raw values to see what the FK looks like
    students = list(Student.objects.values('id', 'full_name', 'current_class')[:3])
    print(json.dumps(students, indent=2, default=str))

if __name__ == '__main__':
    run()

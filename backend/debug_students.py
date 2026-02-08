import os
import django
import sys
import json

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student
from students.serializers import StudentSerializer

def run():
    students = Student.objects.all()[:3]
    serializer = StudentSerializer(students, many=True)
    print(json.dumps(serializer.data, indent=2))

if __name__ == '__main__':
    run()

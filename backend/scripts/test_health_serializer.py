import os
import django
import json
import sys

# Add current directory to path so 'sms' module can be found
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student, HealthRecord
from students.serializers import StudentSerializer

# Create a test student and health record
student = Student.objects.create(
    full_name="Test Student Health",
    admission_number="TEST/9999",
    date_of_birth="2010-01-01",
    gender="M"
)

health = HealthRecord.objects.create(
    student=student,
    blood_group="O+",
    height=165.5,
    weight=60.0,
    emergency_contact_name="Emergency Contact",
    emergency_contact_phone="+254700000000"
)

# Serialize
serializer = StudentSerializer(student)
data = serializer.data

print(f"Student ID: {data['id']}")
print(f"Health Record in Serializer Data: {json.dumps(data.get('health_record'), indent=2)}")

# Cleanup
# health.delete()
# student.delete()

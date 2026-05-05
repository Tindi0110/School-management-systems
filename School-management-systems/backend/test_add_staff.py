import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from staff.serializers import StaffSerializer
from accounts.models import User

data = {
    "employee_id": "",
    "full_name": "Test Add",
    "email": "testadd4@example.com",
    "department": 1,
    "role": "TEACHER",
    "qualifications": "BSc",
    "date_joined": "2026-03-15",
    "write_full_name": "Test Add",
    "write_role": "TEACHER"
}

serializer = StaffSerializer(data=data)
if serializer.is_valid():
    try:
        staff = serializer.save()
        print("Success:", staff)
    except Exception as e:
        print("Save Exception:", e)
else:
    print("Validation Error:", serializer.errors)

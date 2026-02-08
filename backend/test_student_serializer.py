import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student
from students.serializers import StudentSerializer
from rest_framework.renderers import JSONRenderer

print("Verifying Student Serializer...")

student = Student.objects.first()
if not student:
    print("No students found.")
else:
    print(f"Testing Student: {student.full_name} ({student.admission_number})")
    try:
        serializer = StudentSerializer(student)
        # Force rendering to trigger all fields
        json_data = JSONRenderer().render(serializer.data)
        print("Serializer Success!")
        # print(json_data)
    except Exception as e:
        print(f"Serializer FAILED: {e}")
        import traceback
        traceback.print_exc()

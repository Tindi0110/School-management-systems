import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student
from students.serializers import StudentListSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

# Create a dummy student and change them to DAY
s = Student.objects.first()
if s:
    print(f"Original: {s.full_name}, Category: {s.category}")
    s.category = 'DAY'
    s.save()
    print(f"Updated to DAY")

    # Now simulate a request to the list view
    from students.views import StudentViewSet
    view = StudentViewSet.as_view({'get': 'list'})
    factory = APIRequestFactory()
    request = factory.get('/api/students/', {'nopage': 'true'})
    response = view(request)
    
    found = False
    for item in response.data:
        if item['id'] == s.id:
            found = True
            print(f"Student found in list: {item['full_name']}, Category: {item['category']}")
    
    if not found:
        print("Student NOT found in list!")
else:
    print("No students found in DB to test.")

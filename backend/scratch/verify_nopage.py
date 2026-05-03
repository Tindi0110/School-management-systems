import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student
from rest_framework.test import APIRequestFactory
from students.views import StudentViewSet
from academics.models import Class

def verify_nopage():
    print("--- Verifying Nopage Logic ---")
    
    # Ensure at least one student exists
    if Student.objects.count() == 0:
        print("Creating dummy student for test...")
        cls, _ = Class.objects.get_or_create(name="Test", stream="A", year=2026)
        Student.objects.create(full_name="Test Student", admission_number="TEST001", current_class=cls)

    factory = APIRequestFactory()
    view = StudentViewSet.as_view({'get': 'list'})
    
    # 1. Test default pagination
    request_paged = factory.get('/api/students/')
    response_paged = view(request_paged)
    paged_count = len(response_paged.data.get('results', []))
    print(f"Default paged count: {paged_count}")
    print(f"Response type (default): {type(response_paged.data)}")
    
    # 2. Test nopage=true
    # IMPORTANT: factory.get doesn't populate request.query_params in a way that
    # view.as_view handles correctly if not processed by middleware/router.
    # However, DRF Request object should handle it.
    request_nopage = factory.get('/api/students/?nopage=true')
    response_nopage = view(request_nopage)
    
    print(f"Response type (nopage): {type(response_nopage.data)}")
    
    if isinstance(response_nopage.data, list):
        nopage_count = len(response_nopage.data)
        print(f"Nopage count: {nopage_count}")
        print("SUCCESS: nopage=true returned a list.")
    else:
        print(f"FAILURE: nopage=true response is {type(response_nopage.data)}, not a list.")
        print(f"Response keys: {response_nopage.data.keys() if hasattr(response_nopage.data, 'keys') else 'N/A'}")

if __name__ == "__main__":
    verify_nopage()

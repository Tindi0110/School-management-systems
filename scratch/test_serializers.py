import os
import django
import sys

# Setup Django environment
sys.path.append('/home/evans/Public/School-management-systems/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from hostel.models import Hostel, HostelAllocation
from hostel.serializers import HostelListSerializer, AllocationListSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

def test_serializers():
    print("Testing HostelListSerializer...")
    hostels = Hostel.objects.all()
    for h in hostels:
        try:
            data = HostelListSerializer(h).data
            print(f"Hostel {h.name} serialized OK")
        except Exception as e:
            print(f"Hostel {h.name} failed: {str(e)}")

    print("\nTesting AllocationListSerializer...")
    allocations = HostelAllocation.objects.all()
    for a in allocations:
        try:
            data = AllocationListSerializer(a).data
            print(f"Allocation {a.id} serialized OK")
        except Exception as e:
            print(f"Allocation {a.id} failed: {str(e)}")

if __name__ == "__main__":
    test_serializers()

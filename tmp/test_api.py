import os
import sys
import django

sys.path.append(r'c:\Users\Evans\School management system\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from accounts.models import User

def test_api():
    # Get a token
    token = Token.objects.first()
    if not token:
        user = User.objects.first()
        if user:
            token = Token.objects.create(user=user)
        else:
            print("No users found")
            return
            
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)
    
    print("Testing Student API...")
    res = client.get('/api/students/')
    print("Status:", res.status_code)
    if res.status_code == 200:
        data = res.json()
        print("Keys:", data.keys() if isinstance(data, dict) else "List")
        if isinstance(data, dict) and 'results' in data:
            print("Results count:", len(data['results']))
    else:
        print("Error:", res.content)
        
    print("\nTesting Finance API...")
    res = client.get('/api/finance/invoices/')
    print("Status:", res.status_code)
    
    print("\nTesting Hostels API...")
    res = client.get('/api/hostel/allocations/')
    print("Status:", res.status_code)
    
    print("\nTesting Stats Dashboard API...")
    res = client.get('/api/reports/dashboard/')
    print("Status:", res.status_code)
    if res.status_code != 200:
        print("Error:", res.content)

if __name__ == "__main__":
    test_api()

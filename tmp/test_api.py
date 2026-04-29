import os
import sys
import django
import requests

sys.path.append(r'c:\Users\Evans\School management system\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from rest_framework.authtoken.models import Token
from accounts.models import User

def test_api():
    # Get a token
    token = Token.objects.first()
    if not token:
        print("No users found")
        return
            
    headers = {'Authorization': 'Token ' + token.key}
    base_url = 'http://localhost:8000'
    
    print("Testing Student API...")
    res = requests.get(f'{base_url}/api/students/', headers=headers)
    print("Status:", res.status_code)
    if res.status_code == 200:
        data = res.json()
        print("Results count:", len(data.get('results', [])))
    else:
        print("Error:", res.text[:200])
        
    print("\nTesting Finance API...")
    res = requests.get(f'{base_url}/api/invoices/', headers=headers)
    print("Status:", res.status_code)
    
    print("\nTesting Hostels API...")
    res = requests.get(f'{base_url}/api/hostel-allocations/', headers=headers)
    print("Status:", res.status_code)

if __name__ == "__main__":
    test_api()


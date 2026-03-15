import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from rest_framework.test import APIClient
import time

client = APIClient()

data = {
    'email': 'tinditechnologies+staff2@gmail.com',
    'password': 'Securepassword123',
    'full_name': 'Test Staff 2',
    'role': 'TEACHER'
}

print("Sending POST request to /api/auth/register/...")
response = client.post('/api/auth/register/', data, format='json')

print(f"Status Code: {response.status_code}")
print(f"Response Data: {response.data}")

# Allow time for async email thread to run
time.sleep(3)

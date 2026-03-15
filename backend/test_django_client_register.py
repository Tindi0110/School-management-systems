import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.test import Client
from accounts.models import User

client = Client()

data = {
    'email': 'tinditechnologies+staff3@gmail.com',
    'password': 'Securepassword123',
    'full_name': 'Test Staff 3',
    'role': 'TEACHER'
}

print("Executing test registration request...")
response = client.post('/api/auth/register/', data, content_type='application/json')
print(f"Status Code: {response.status_code}")
try:
    print(f"Response JSON: {response.json()}")
except Exception as e:
    print(f"Failed to parse JSON: {e}")
    print(f"Response Content: {response.content}")

user_count = User.objects.filter(email='tinditechnologies+staff3@gmail.com').count()
print(f"User created: {user_count > 0}")


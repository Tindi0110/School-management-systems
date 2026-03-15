import requests

data = {
    'email': 'tinditechnologies+staff4@gmail.com',
    'password': 'Securepassword123',
    'full_name': 'Test Staff 4',
    'role': 'TEACHER'
}

print("Executing test registration request...")
try:
    response = requests.post('http://127.0.0.1:8000/api/auth/register/', json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response JSON: {response.json()}")
except requests.exceptions.ConnectionError:
    from django.core.management import call_command
    print("Server not running, starting it...")

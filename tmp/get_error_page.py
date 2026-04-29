import requests
import os
import django
import sys

sys.path.append(r'c:\Users\Evans\School management system\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from rest_framework.authtoken.models import Token

def get_error():
    token = Token.objects.first().key
    headers = {'Authorization': f'Token {token}'}
    try:
        res = requests.get('http://localhost:8000/api/invoices/', headers=headers)
        with open('tmp_finance_error.html', 'w', encoding='utf-8') as f:
            f.write(res.text)
        print(f"Status: {res.status_code}")
        print("Error page saved to tmp_error.html")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    get_error()

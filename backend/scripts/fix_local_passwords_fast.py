import os
import sys
import django
from django.contrib.auth.hashers import make_password

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def quick_reset():
    print("Generating password hash...")
    # Generate hash once
    hashed_pwd = make_password("ChangeMe123!")
    print(f"Hash generated: {hashed_pwd[:10]}...")
    
    print("Updating all users...")
    # Bulk update
    count = User.objects.all().update(password=hashed_pwd)
    print(f"Successfully updated {count} users.")

if __name__ == "__main__":
    quick_reset()

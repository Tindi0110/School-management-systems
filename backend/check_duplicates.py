import os
import sys
import django
from dotenv import load_dotenv
from collections import Counter

load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("Checking for duplicate emails...")
emails = list(User.objects.values_list('email', flat=True))
counts = Counter(emails)
duplicates = {email: count for email, count in counts.items() if count > 1}

if duplicates:
    print(f"Found {len(duplicates)} duplicate emails:")
    for email, count in duplicates.items():
        print(f"  {email}: {count} users")
        # List the users with this email
        users = User.objects.filter(email=email)
        for u in users:
            print(f"    - ID: {u.id}, Username: {u.username}, Role: {u.role}")
else:
    print("No duplicate emails found.")

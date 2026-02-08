import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.serializers import RegisterSerializer
import sys

User = get_user_model()

# Test Data
data = {
    "username": "debug_user_1",
    "email": "debug1@example.com",
    "password": "Password123!",
    "role": "TEACHER",
    "full_name": "Debug Teacher"
}

print("--- Starting Registration Debug ---")
try:
    # 1. Validate Serializer
    serializer = RegisterSerializer(data=data)
    if serializer.is_valid():
        print("Serializer Valid. Saving...")
        # 2. Save (Triggering Signals)
        user = serializer.save()
        print(f"User Created: {user.username} (ID: {user.id})")
        
        # 3. Check Signal Result
        if hasattr(user, 'staff_profile'):
            print(f"Staff Profile Created: {user.staff_profile.employee_id}")
        else:
            print("WARNING: Staff Profile NOT created.")
            
    else:
        print("Serializer Validation Failed:")
        print(serializer.errors)

except Exception as e:
    print("\n!!! EXCEPTION CAUGHT !!!")
    import traceback
    traceback.print_exc()

print("--- End Debug ---")

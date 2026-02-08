import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.serializers import RegisterSerializer

User = get_user_model()

# Test Data
data = {
    "username": "test_teacher",
    "email": "teacher@school.com",
    "password": "TestPassword123!",
    "role": "TEACHER",
    "full_name": "Test Teacher"
}

print("--- Creating Test User ---")
try:
    if User.objects.filter(username=data['username']).exists():
        print("User already exists, deleting...")
        User.objects.filter(username=data['username']).delete()

    serializer = RegisterSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        print(f"SUCCESS: User '{user.username}' created with ID {user.id}")
        
        if hasattr(user, 'staff_profile'):
            print(f"SUCCESS: Staff Profile created: {user.staff_profile.employee_id}")
        else:
            print("FAILURE: Staff Profile MISSING")
    else:
        print("Validation Errors:", serializer.errors)

except Exception as e:
    import traceback
    traceback.print_exc()

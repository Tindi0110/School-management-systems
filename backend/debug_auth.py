import os
import django

# DATABASE_URL is now expected to work
# if 'DATABASE_URL' in os.environ:
#     del os.environ['DATABASE_URL']

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()
from accounts.serializers import RegisterSerializer

print("Attempting to create user via Serializer...")
data = {
    "username": "testuser_debug_500",
    "email": "test@debug.com",
    "password": "password123",
    "role": "STUDENT",
    "full_name": "Test User"
}

serializer = RegisterSerializer(data=data)
if serializer.is_valid():
    try:
        user = serializer.save()
        print(f"User created successfully: {user}")
    except Exception as e:
        print(f"Error creating user: {e}")
        import traceback
        traceback.print_exc()
else:
    print(f"Serializer errors: {serializer.errors}")

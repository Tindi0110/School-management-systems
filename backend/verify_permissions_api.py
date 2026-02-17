import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.serializers import UserSerializer

User = get_user_model()

def test_user_perms(username):
    try:
        user = User.objects.get(username=username)
        serializer = UserSerializer(user)
        perms = serializer.data['permissions']
        print(f"User: {username} ({user.role})")
        print(f"Permissions: {sorted(perms)}")
        print("-" * 40)
    except User.DoesNotExist:
        print(f"User {username} not found")

print("Verifying Permissions Injection:\n")
test_user_perms('admin')
test_user_perms('Twiri') # Librarian
test_user_perms('Judy')  # Accountant

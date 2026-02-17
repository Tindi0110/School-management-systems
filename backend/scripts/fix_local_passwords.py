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

def reset_passwords():
    print("Resetting all local user passwords to 'ChangeMe123!'...")
    users = User.objects.all()
    count = 0
    
    # Pre-calculate hash for performance (though django salts per user, so make_password generally generates unique salts, 
    # but we should use set_password on each user to be proper)
    
    for user in users:
        try:
            user.set_password("ChangeMe123!")
            user.save()
            count += 1
            if count % 10 == 0:
                print(f"Processed {count} users...")
        except Exception as e:
            print(f"Error resetting {user.username}: {e}")

    print(f"Successfully reset passwords for {count} users.")

if __name__ == "__main__":
    reset_passwords()

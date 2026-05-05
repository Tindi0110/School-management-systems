import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from accounts.serializers import RegisterSerializer
from accounts.views import RegisterView
from django.test import RequestFactory

data = {
    'email': 'tinditechnologies+staff1@gmail.com',
    'password': 'Securepassword123',
    'full_name': 'Test Staff',
    'role': 'TEACHER'
}

serializer = RegisterSerializer(data=data)
if serializer.is_valid():
    print("Serializer valid. Performing create...")
    view = RegisterView()
    # Mock behavior of perform_create
    user = serializer.save()
    print(f"User created: {user.username}, {user.email}")
    
    from django.contrib.auth.tokens import default_token_generator
    from django.utils.encoding import force_bytes
    from django.utils.http import urlsafe_base64_encode
    from sms.mail import EmailService
    from django.conf import settings
    
    token = default_token_generator.make_token(user)
    uid   = urlsafe_base64_encode(force_bytes(user.pk))
    link  = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}"

    body = (
        f"Hello {user.first_name or user.username},\n\n"
        f"Please verify your email by clicking the link below:\n\n"
        f"{link}\n\n"
        f"— School Management System"
    )
    print("Calling send_async...")
    try:
        thread = EmailService.send_async('Verify Your Email — School Management System', body, user.email)
        thread.join(timeout=10)
        print("Email sent successfully.")
    except Exception as e:
        print(f"Error: {e}")
else:
    print(f"Serializer errors: {serializer.errors}")

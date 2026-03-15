import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from sms.mail import EmailService

try:
    success, msg = EmailService.send_sync(
        'Test Subject',
        'Test Body EmailService within Django',
        'tinditechnologies@gmail.com'
    )
    print(f"Sync result: {success}, {msg}")
except Exception as e:
    print(f"Exception calling send_sync: {e}")

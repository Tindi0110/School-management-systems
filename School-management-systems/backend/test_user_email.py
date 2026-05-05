import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from sms.mail import EmailService

try:
    print("Testing synchronous email delivery to josephmatindi8@gmail.com...")
    EmailService.send_sync(
        "Diagnostic Test", 
        "This is a test to see if emails to this address are delivered.", 
        "josephmatindi8@gmail.com"
    )
    print("Email successfully accepted by SMTP server.")
except Exception as e:
    print(f"SMTP Error: {e}")

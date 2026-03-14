from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
import traceback

class Command(BaseCommand):
    help = 'Sends a test email to verify SMTP settings'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Recipient email address')

    def handle(self, *args, **options):
        recipient = options['email']
        self.stdout.write(f"Attempting to send test email to {recipient}...")
        self.stdout.write(f"Using EMAIL_HOST: {settings.EMAIL_HOST}")
        self.stdout.write(f"Using EMAIL_PORT: {settings.EMAIL_PORT}")
        self.stdout.write(f"Using EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        self.stdout.write(f"Using DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

        try:
            send_mail(
                'Test Email - School Management System',
                'If you are reading this, your SMTP settings are working correctly!',
                settings.DEFAULT_FROM_EMAIL,
                [recipient],
                fail_silently=False,
            )
            self.stdout.write(self.style.SUCCESS(f"Successfully sent test email to {recipient}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to send email: {str(e)}"))
            self.stdout.write(self.style.ERROR("Traceback:"))
            self.stdout.write(traceback.format_exc())
            self.stdout.write(self.style.WARNING("\nSuggestions:"))
            self.stdout.write("1. Check if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD are correct in .env")
            self.stdout.write("2. If using Gmail, ensure 'Less Secure Apps' is on or use an 'App Password'")
            self.stdout.write("3. Verify that your server can connect to the SMTP port (is the port blocked by a firewall?)")

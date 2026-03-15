import logging
import threading
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_async(subject, body, recipient, html_message=None):
        """
        Sends an email asynchronously in a background thread.
        centralized to handle logging and safety.
        """
        if not recipient:
            logger.warning("Attempted to send email with no recipient (Subject: %s)", subject)
            return

        def dispatch():
            try:
                logger.info("Dispatching email to: %s", recipient)
                send_mail(
                    subject=subject,
                    message=body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient],
                    fail_silently=False,
                    html_message=html_message
                )
                logger.info("Successfully sent email to: %s", recipient)
            except Exception as e:
                logger.error("Failed to dispatch email to %s: %s", recipient, str(e), exc_info=True)

        thread = threading.Thread(target=dispatch, daemon=True)
        thread.start()
        return thread

    @staticmethod
    def send_sync(subject, body, recipient, html_message=None):
        """
        Sends an email synchronously. Use sparingly (e.g., in management commands).
        """
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
                html_message=html_message
            )
            return True, "Email sent successfully"
        except Exception as e:
            logger.error("Sync email failure to %s: %s", recipient, str(e))
            return False, str(e)

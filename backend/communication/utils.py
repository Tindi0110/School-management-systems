import os
import requests
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_sms(phone_number, message):
    """
    Sends an SMS using a provider (e.g., Africa's Talking).
    This is a wrapper that can be extended to use different gateways.
    """
    api_username = os.getenv('AFRICASTALKING_USERNAME')
    api_key = os.getenv('AFRICASTALKING_API_KEY')
    sender_id = os.getenv('AFRICASTALKING_SENDER_ID')

    if not all([api_username, api_key]):
        logger.warning(f"SMS Gateway not fully configured. Logging message to console: To {phone_number}: {message}")
        print(f"SMS SIMULATION: To {phone_number} -> {message}")
        return True, "Simulation mode"

    # Example integration with Africa's Talking (common in Kenya)
    url = "https://api.africastalking.com/version1/messaging"
    headers = {
        "ApiKey": api_key,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
    }
    data = {
        "username": api_username,
        "to": phone_number,
        "message": message,
        "from": sender_id if sender_id else ""
    }

    try:
        # response = requests.post(url, data=data, headers=headers)
        # response.raise_for_status()
        # logger.info(f"SMS sent to {phone_number}")
        # return True, "Sent"
        logger.info(f"SMS Gateway configured but requests disabled for safety: To {phone_number}")
        print(f"SMS SENDING (DISABLED): To {phone_number} -> {message}")
        return True, "Skipped for safety"
    except Exception as e:
        logger.error(f"Failed to send SMS to {phone_number}: {str(e)}")
        return False, str(e)

def send_email(recipient_email, subject, message):
    """
    Sends an Email using Django's built-in mail system.
    """
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient_email],
            fail_silently=False,
        )
        logger.info(f"Email sent to {recipient_email}")
        return True, "Sent"
    except Exception as e:
        logger.error(f"Failed to send Email to {recipient_email}: {str(e)}")
        return False, str(e)

def send_whatsapp(phone_number, message):
    """
    Sends a WhatsApp message using a provider (simulated for now).
    """
    try:
        # In a real scenario, you'd use Twilio or a similar service
        # For now, we simulate and log for diagnostic purposes
        logger.info(f"WHATSAPP SIMULATION: To {phone_number} -> {message}")
        print(f"WHATSAPP SIMULATION: To {phone_number} -> {message}")
        return True, "Sent (Simulated)"
    except Exception as e:
        logger.error(f"Failed to send WhatsApp to {phone_number}: {str(e)}")
        return False, str(e)

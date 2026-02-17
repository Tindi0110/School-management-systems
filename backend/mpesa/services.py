import requests
import base64
from datetime import datetime
from django.conf import settings
import os

class MpesaService:
    @staticmethod
    def get_access_token():
        consumer_key = os.getenv('MPESA_CONSUMER_KEY')
        consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
        api_url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        
        response = requests.get(api_url, auth=(consumer_key, consumer_secret))
        if response.status_code == 200:
            return response.json()['access_token']
        return None

    @staticmethod
    def initiate_stk_push(phone_number, amount, admission_number):
        access_token = MpesaService.get_access_token()
        if not access_token:
            return None

        business_short_code = os.getenv('MPESA_SHORTCODE')
        passkey = os.getenv('MPESA_PASSKEY')
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        
        password_str = business_short_code + passkey + timestamp
        password = base64.b64encode(password_str.encode()).decode()

        api_url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        payload = {
            "BusinessShortCode": business_short_code,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": business_short_code,
            "PhoneNumber": phone_number,
            "CallBackURL": os.getenv('MPESA_CALLBACK_URL'),
            "AccountReference": admission_number,
            "TransactionDesc": f"Fees payment for {admission_number}"
        }

        response = requests.post(api_url, json=payload, headers=headers)
        return response.json()

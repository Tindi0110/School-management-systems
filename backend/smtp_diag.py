import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
from pathlib import Path

# Load env from the backend directory
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

def test_smtp():
    host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
    port = int(os.getenv('EMAIL_PORT', 587))
    user = os.getenv('MAIL_USERNAME') or os.getenv('EMAIL_HOST_USER')
    password = os.getenv('MAIL_PASSWORD') or os.getenv('EMAIL_HOST_PASSWORD')
    sender = os.getenv('MAIL_DEFAULT_SENDER') or os.getenv('DEFAULT_FROM_EMAIL', 'noreply@school.com')
    
    print(f"Testing SMTP with Host: {host}, Port: {port}, User: {user}")
    
    if not user or not password:
        print("ERROR: Credentials missing in .env")
        return

    msg = MIMEText("This is a test email from the School Management System diagnostic script.")
    msg['Subject'] = 'SMTP Diagnostic Test'
    msg['From'] = sender
    msg['To'] = user # Send to self for test

    try:
        print("Connecting to server...")
        server = smtplib.SMTP(host, port, timeout=10)
        server.set_debuglevel(1)
        print("Starting TLS...")
        server.starttls()
        print("Logging in...")
        server.login(user, password)
        print("Sending test email...")
        server.send_message(msg)
        server.quit()
        print("\nSUCCESS: SMTP is working correctly!")
    except Exception as e:
        print(f"\nFAILURE: {str(e)}")

if __name__ == "__main__":
    test_smtp()

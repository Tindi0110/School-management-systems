import os
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from sms.mail import EmailService

try:
    print("Testing send_async...")
    thread = EmailService.send_async(
        'Test Async Email',
        'Testing asynchronous delivery in Django.',
        'tinditechnologies@gmail.com'
    )
    if thread:
        print("Thread started, waiting to finish...")
        thread.join(timeout=10)
        print(f"Thread is_alive: {thread.is_alive()}")
    else:
        print(f"send_async returned no thread. It may have skipped sending.")
except Exception as e:
    print(f"Exception calling send_async: {e}")

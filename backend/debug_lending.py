
import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from library.models import BookCopy, BookLending
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def test_lending():
    print("--- Starting Lending Debug ---")
    try:
        # 1. Get a copy
        copy = BookCopy.objects.filter(status='AVAILABLE').first()
        if not copy:
            print("No available copies found. Creating one.")
            from library.models import Book
            book = Book.objects.first()
            if not book:
                book = Book.objects.create(title="Test", author="Test", isbn="123", category="Test")
            copy = BookCopy.objects.create(book=book, copy_number="DEBUG-1", status='AVAILABLE')
        
        print(f"Using Copy: {copy.id} ({copy})")

        # 2. Get a user
        user = User.objects.filter(role='STUDENT').first()
        if not user:
            print("No student user found. Creating one.")
            user = User.objects.create_user(username='debug_student', password='password', role='STUDENT')
        
        print(f"Using User: {user.id} ({user.username})")

        # 3. Create Lending
        print("Attempting to create Lending...")
        lending = BookLending.objects.create(
            copy=copy,
            user=user,
            due_date=timezone.now().date() + timedelta(days=7),
            remarks="Test remark" # Model doesn't have remarks, python would crash here if included.
        )
        print(f"Lending Created: {lending.id}")
        
        # 4. Simulate Serializer/View behavior (status update)
        copy.status = 'ISSUED'
        copy.save()
        print("Copy status updated to ISSUED")
        
    except Exception as e:
        print(f"CRASHED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_lending()

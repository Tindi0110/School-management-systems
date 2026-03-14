from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from library.models import Book, BookCopy, BookLending, LibraryFine

User = get_user_model()

class LibraryTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='borrower', password='password123')
        self.book = Book.objects.create(
            title='Clean Code',
            author='Robert C. Martin',
            category='CS'
        )
        self.copy = BookCopy.objects.create(
            book=self.book,
            copy_number='C001',
            status='AVAILABLE'
        )

    def test_book_copy_relationship(self):
        self.assertEqual(self.book.copies.count(), 1)
        self.assertEqual(self.copy.book.title, 'Clean Code')

    def test_lending_logic(self):
        due_date = timezone.now().date() + timezone.timedelta(days=14)
        lending = BookLending.objects.create(
            copy=self.copy,
            user=self.user,
            due_date=due_date
        )
        self.assertEqual(lending.copy.status, 'AVAILABLE') # Status usually updated via view/service logic
        
        # Simulate issue
        self.copy.status = 'ISSUED'
        self.copy.save()
        self.assertEqual(BookCopy.objects.get(id=self.copy.id).status, 'ISSUED')

    def test_fine_generation_stub(self):
        # Create a late lending
        due_date = timezone.now().date() - timezone.timedelta(days=5)
        lending = BookLending.objects.create(
            copy=self.copy,
            user=self.user,
            due_date=due_date
        )
        
        fine = LibraryFine.objects.create(
            lending=lending,
            user=self.user,
            amount=100.00,
            fine_type='LATE',
            status='PENDING'
        )
        self.assertEqual(fine.amount, 100.00)
        self.assertEqual(fine.status, 'PENDING')

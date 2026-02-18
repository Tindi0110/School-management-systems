from django.db import models
from django.conf import settings
from django.utils import timezone

class LibraryConfig(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    opening_hours = models.CharField(max_length=255)
    rules = models.TextField(blank=True)
    librarian = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='library_managed')
    fine_amount_per_day = models.DecimalField(max_digits=10, decimal_places=2, default=20.00)
    is_active = models.BooleanField(default=True)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    isbn = models.CharField(max_length=20, unique=True, null=True, blank=True)
    publisher = models.CharField(max_length=100, blank=True)
    edition = models.CharField(max_length=50, blank=True)
    year = models.IntegerField(null=True, blank=True)
    category = models.CharField(max_length=100) # e.g. Mathematics, Fiction
    language = models.CharField(max_length=50, default='English')
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.title

class BookCopy(models.Model):
    STATUS_CHOICES = (
        ('AVAILABLE', 'Available'),
        ('ISSUED', 'Issued'),
        ('RESERVED', 'Reserved'),
        ('LOST', 'Lost'),
        ('DAMAGED', 'Damaged'),
        ('WRITTEN_OFF', 'Written Off')
    )
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='copies')
    copy_number = models.CharField(max_length=50) # e.g. C001
    barcode = models.CharField(max_length=50, unique=True, null=True, blank=True)
    shelf_location = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='AVAILABLE')
    condition = models.CharField(max_length=50, default='New') # New, Good, Fair, Poor
    purchase_date = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.book.title} (Copy: {self.copy_number})"

class BookLending(models.Model):
    copy = models.ForeignKey(BookCopy, on_delete=models.CASCADE, related_name='lendings')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='borrowed_books')
    date_issued = models.DateField(default=timezone.now)
    due_date = models.DateField()
    date_returned = models.DateField(null=True, blank=True)
    renewal_count = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.copy} borrowed by {self.user}"

class LibraryFine(models.Model):
    TYPE_CHOICES = (('LATE', 'Late Return'), ('LOST', 'Lost Book'), ('DAMAGE', 'Damage Penalty'))
    STATUS_CHOICES = (('PENDING', 'Pending'), ('PAID', 'Paid'), ('WAIVED', 'Waived'))
    
    lending = models.OneToOneField(BookLending, on_delete=models.CASCADE, related_name='fine', null=True, blank=True)
    adjustment = models.OneToOneField('finance.Adjustment', on_delete=models.SET_NULL, null=True, blank=True, related_name='library_fine')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    fine_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    reason = models.TextField(blank=True, default='')
    date_issued = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

class BookReservation(models.Model):
    STATUS_CHOICES = (('PENDING', 'Pending'), ('READY', 'Ready for Pickup'), ('COMPLETED', 'Completed'), ('EXPIRED', 'Expired'))
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date_reserved = models.DateField(auto_now_add=True)
    expiry_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')

from rest_framework import serializers
from .models import (
    LibraryConfig, Book, BookCopy, BookLending, 
    LibraryFine, BookReservation
)

class LibraryConfigSerializer(serializers.ModelSerializer):
    librarian_name = serializers.CharField(source='librarian.get_full_name', read_only=True)
    class Meta:
        model = LibraryConfig
        fields = '__all__'

class BookCopySerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    class Meta:
        model = BookCopy
        fields = '__all__'

class BookSerializer(serializers.ModelSerializer):
    copies = BookCopySerializer(many=True, read_only=True)
    available_copies_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Book
        fields = '__all__'
    
    def get_available_copies_count(self, obj):
        return obj.copies.filter(status='AVAILABLE').count()

class BookLendingSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='copy.book.title', read_only=True)
    copy_number = serializers.CharField(source='copy.copy_number', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = BookLending
        fields = '__all__'
        
    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.date_returned:
            return False
        return timezone.now().date() > obj.due_date

class LibraryFineSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    class Meta:
        model = LibraryFine
        fields = '__all__'

class BookReservationSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    class Meta:
        model = BookReservation
        fields = '__all__'

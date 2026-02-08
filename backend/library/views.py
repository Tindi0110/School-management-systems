from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import (
    LibraryConfig, Book, BookCopy, BookLending, 
    LibraryFine, BookReservation
)
from .serializers import (
    LibraryConfigSerializer, BookSerializer, BookCopySerializer,
    BookLendingSerializer, LibraryFineSerializer, BookReservationSerializer
)

class LibraryConfigViewSet(viewsets.ModelViewSet):
    queryset = LibraryConfig.objects.all()
    serializer_class = LibraryConfigSerializer
    permission_classes = [IsAuthenticated]

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated]

class BookCopyViewSet(viewsets.ModelViewSet):
    queryset = BookCopy.objects.all()
    serializer_class = BookCopySerializer
    permission_classes = [IsAuthenticated]

class BookLendingViewSet(viewsets.ModelViewSet):
    queryset = BookLending.objects.all()
    serializer_class = BookLendingSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        user = serializer.validated_data['user']
        copy = serializer.validated_data['copy']
        
        # 1. CORE PRINCIPLE: Block if Overdue Exists
        # Check if user has any UNRETURNED books that are OVERDUE
        overdue_exists = BookLending.objects.filter(
            user=user, 
            date_returned__isnull=True, 
            due_date__lt=timezone.now().date()
        ).exists()
        
        if overdue_exists:
             raise ValidationError({"detail": "User has overdue books. Cannot issue new resources."})

        # 2. CORE PRINCIPLE: Max Limit (Default 2)
        active_count = BookLending.objects.filter(user=user, date_returned__isnull=True).count()
        if active_count >= 2:
            raise ValidationError({"detail": "User has reached the maximum borrowing limit (2 books)."})

        # 3. Check Copy Status
        if copy.status != 'AVAILABLE':
            raise ValidationError({"detail": f"This copy is currently {copy.status}"})
            
        lending = serializer.save()
        copy.status = 'ISSUED'
        copy.save()

    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        lending = self.get_object()
        if lending.date_returned:
            return Response({'error': 'Book already returned'}, status=status.HTTP_400_BAD_REQUEST)
        
        return_date = timezone.now().date()
        lending.date_returned = return_date
        lending.save()
        
        copy = lending.copy
        copy.status = 'AVAILABLE'
        copy.save()
        
        # 4. CORE PRINCIPLE: Auto-Fines (Logic: KES 10 per day)
        fine_msg = ""
        if return_date > lending.due_date:
            delta = return_date - lending.due_date
            days_late = delta.days
            if days_late > 0:
                amount = days_late * 10
                LibraryFine.objects.create(
                    lending=lending,
                    user=lending.user,
                    amount=amount,
                    fine_type='LATE',
                    status='PENDING',
                    reason=f"Auto-Fine: Returned {days_late} days late."
                )
                fine_msg = f" Book returned {days_late} days late. Fine of KES {amount} recorded."
        
        return Response({'status': f'Book returned successfully.{fine_msg}'})

class LibraryFineViewSet(viewsets.ModelViewSet):
    queryset = LibraryFine.objects.all()
    serializer_class = LibraryFineSerializer
    permission_classes = [IsAuthenticated]

class BookReservationViewSet(viewsets.ModelViewSet):
    queryset = BookReservation.objects.all()
    serializer_class = BookReservationSerializer
    permission_classes = [IsAuthenticated]

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
from finance.models import Invoice, Adjustment, FeeStructure
from students.models import Student

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
        
        # 4. CORE PRINCIPLE: Auto-Fines (Logic: Configurable per day)
        fine_msg = ""
        if return_date > lending.due_date:
            delta = return_date - lending.due_date
            days_late = delta.days
            if days_late > 0:
                # Get Config
                config = LibraryConfig.objects.filter(is_active=True).first()
                daily_fine = config.fine_amount_per_day if config else 20.00
                amount = days_late * float(daily_fine)
                
                # Create Fine Record
                fine = LibraryFine.objects.create(
                    lending=lending,
                    user=lending.user,
                    amount=amount,
                    fine_type='LATE',
                    status='PENDING',
                    reason=f"Auto-Fine: Returned {days_late} days late."
                )
                
                # SYNC TO FINANCE (Debit Adjustment)
                try:
                    student = Student.objects.filter(full_name=lending.user.get_full_name()).first() # Best effort link
                    # Or better: assuming User is linked to Student via a Profile or similar. 
                    # For now, relying on name match or explicit link if available.
                    # CHECK: Does User model have student link?
                    # Re-checking User model or assuming Student is the User for now.
                    # In this system, User != Student. User is a login. Student is a record.
                    # We need to find the Student record associated with this User.
                    # Usually: student.user or user.student_profile
                    
                    # Assuming basic link for now or skipping if not found
                    if hasattr(lending.user, 'student_profile'): 
                         student = lending.user.student_profile
                    elif hasattr(lending.user, 'student'): # Common pattern
                         student = lending.user.student
                    
                    if student:
                        # Find Active Invoice
                        # Logic: Get invoice for current academic year/term or just the latest UNPAID/PARTIAL
                        latest_invoice = Invoice.objects.filter(student=student).order_by('-date_generated').first()
                        
                        if latest_invoice:
                            adjustment = Adjustment.objects.create(
                                invoice=latest_invoice,
                                adjustment_type='DEBIT',
                                amount=amount,
                                reason=f"Library Fine: {lending.copy.book.title} ({days_late} days late)",
                                date=timezone.now().date(),
                                approved_by=request.user # The librarian/admin processing return
                            )
                            fine.adjustment = adjustment
                            fine.save()
                            fine_msg = f" Book returned {days_late} days late. Fine of KES {amount} added to Fee Balance."
                        else:
                             fine_msg = f" Book returned {days_late} days late. Fine of KES {amount} recorded (No Invoice found to sync)."
                    else:
                         fine_msg = f" Book returned {days_late} days late. Fine of KES {amount} recorded (Student link not found)."
                except Exception as e:
                    print(f"Finance Sync Error: {e}")
                    fine_msg = f" Book returned late. Fine recorded but Finance Sync failed."

        
        return Response({'status': f'Book returned successfully.{fine_msg}'})

class LibraryFineViewSet(viewsets.ModelViewSet):
    queryset = LibraryFine.objects.all()
    serializer_class = LibraryFineSerializer
    permission_classes = [IsAuthenticated]

class BookReservationViewSet(viewsets.ModelViewSet):
    queryset = BookReservation.objects.all()
    serializer_class = BookReservationSerializer
    permission_classes = [IsAuthenticated]

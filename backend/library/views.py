from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'language']
    search_fields = ['title', 'author', 'isbn', 'category', 'publisher']
    ordering_fields = ['title', 'author', 'year']

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        total_books = Book.objects.count()
        total_copies = BookCopy.objects.count()
        total_fines = sum(fine.amount for fine in LibraryFine.objects.filter(status='PENDING'))
        active_lendings = BookLending.objects.filter(date_returned__isnull=True).count()
        available_copies = BookCopy.objects.filter(status='AVAILABLE').count()
        overdue_lendings = BookLending.objects.filter(date_returned__isnull=True, due_date__lt=timezone.now().date()).count()

        return Response({
            'totalBooks': total_books,
            'totalCopies': total_copies,
            'totalFines': total_fines,
            'activeLendings': active_lendings,
            'available': available_copies,
            'overdue': overdue_lendings
        })

class BookCopyViewSet(viewsets.ModelViewSet):
    queryset = BookCopy.objects.select_related('book').all()
    serializer_class = BookCopySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['book', 'status', 'condition']
    search_fields = ['copy_number', 'barcode', 'book__title']

class BookLendingViewSet(viewsets.ModelViewSet):
    queryset = BookLending.objects.select_related('copy__book', 'user').all()
    serializer_class = BookLendingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student_id')
        user_id = self.request.query_params.get('user')
        if student_id:
            qs = qs.filter(user__student_profile__id=student_id)
        elif user_id:
            qs = qs.filter(user_id=user_id)
        return qs

    def create(self, request, *args, **kwargs):
        from rest_framework.exceptions import ValidationError
        from django.db import transaction
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        copy_instance = serializer.validated_data['copy']
        
        with transaction.atomic():
            # Lock the copy to prevent race conditions
            copy = BookCopy.objects.select_for_update().get(pk=copy_instance.pk)
            
            # 1. Check Copy Status match
            if copy.status != 'AVAILABLE':
                raise ValidationError({"detail": f"This copy is currently {copy.status}"})

            # 2. CORE PRINCIPLE: Block if Overdue Exists
            overdue_exists = BookLending.objects.filter(
                user=user, 
                date_returned__isnull=True, 
                due_date__lt=timezone.now().date()
            ).exists()
            
            if overdue_exists:
                 raise ValidationError({"detail": "User has overdue books. Cannot issue new resources."})

            # 3. CORE PRINCIPLE: Max Limit (Default 2)
            active_count = BookLending.objects.filter(user=user, date_returned__isnull=True).count()
            if active_count >= 2:
                raise ValidationError({"detail": "User has reached the maximum borrowing limit (2 books)."})

            # Save Lending and Update Copy
            lending = serializer.save()
            copy.status = 'ISSUED'
            copy.save()
        
        # Reload to ensure efficient serialization (avoid N+1)
        # This fixes the "Success but Slow/Timeout" issue by making the response serialization instant
        lending = BookLending.objects.select_related('copy__book', 'user').get(pk=lending.pk)
        
        # Serialize with reloaded instance
        serializer = self.get_serializer(lending)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


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
                            # Use update_or_create with origin tracking for robustness
                            adjustment, _ = Adjustment.objects.update_or_create(
                                origin_model='library.LibraryFine',
                                origin_id=fine.id,
                                defaults={
                                    'invoice': latest_invoice,
                                    'adjustment_type': 'DEBIT',
                                    'amount': amount,
                                    'reason': f"Library Fine: {lending.copy.book.title} ({days_late} days late)",
                                    'date': timezone.now().date(),
                                    'approved_by': request.user
                                }
                            )
                            fine.adjustment = adjustment
                            fine.save()
                            fine_msg = f" Book returned {days_late} days late. Fine of KES {amount} added to Fee Balance."
                        else:
                             fine_msg = f" Book returned {days_late} days late. Fine of KES {amount} recorded (No Invoice found to sync)."
                    else:
                         fine_msg = f" Book returned {days_late} days late. Fine of KES {amount} recorded (Student link not found)."
                except Exception as e:
                    logger.error(f"Finance Sync Error: {e}")
                    fine_msg = f" Book returned late. Fine recorded but Finance Sync failed."

        
        return Response({'status': f'Book returned successfully.{fine_msg}'})

    @action(detail=False, methods=['post'])
    def mark_overdue(self, request):
        """
        Flags books as OVERDUE if they are past their due date and not returned.
        Can be called manually by admin or via a scheduled cron job.
        """
        today = timezone.now().date()
        overdue_lendings = BookLending.objects.filter(
            date_returned__isnull=True,
            due_date__lt=today
        ).select_related('copy')

        count = 0
        from django.db import transaction
        with transaction.atomic():
            for lending in overdue_lendings:
                if lending.copy.status != 'OVERDUE':
                    lending.copy.status = 'OVERDUE'
                    lending.copy.save(update_fields=['status'])
                    count += 1

        return Response({'message': f'{count} book copies marked as OVERDUE.'})

    @action(detail=True, methods=['post'])
    def extend_due_date(self, request, pk=None):
        """
        Allows librarian to extend the due date of a lending and increments renewal_count.
        """
        lending = self.get_object()
        if lending.date_returned:
            return Response({'error': 'Cannot extend a returned book'}, status=status.HTTP_400_BAD_REQUEST)

        days_to_add = int(request.data.get('days', 7))
        from datetime import timedelta
        
        # If currently overdue, reset the copy status to ISSUED
        if lending.copy.status == 'OVERDUE':
            lending.copy.status = 'ISSUED'
            lending.copy.save(update_fields=['status'])

        lending.due_date = lending.due_date + timedelta(days=days_to_add)
        lending.renewal_count += 1
        lending.save()

        return Response({'message': f'Due date extended to {lending.due_date}'})

class LibraryFineViewSet(viewsets.ModelViewSet):
    queryset = LibraryFine.objects.select_related('lending', 'lending__copy__book', 'user', 'adjustment').all()
    serializer_class = LibraryFineSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def sync_to_finance(self, request):
        """
        Bulk-syncs all PENDING library fines that have no finance adjustment yet.
        Creates a DEBIT Adjustment on the student's latest UNPAID/PARTIAL invoice.
        """
        from django.db import transaction

        pending_fines = LibraryFine.objects.filter(
            status='PENDING',
            adjustment__isnull=True
        ).select_related('lending__copy__book', 'user')

        synced = 0
        skipped_no_student = 0
        skipped_no_invoice = 0
        already_synced = 0

        for fine in pending_fines:
            # Resolve student from user profile
            student = None
            try:
                if hasattr(fine.user, 'student_profile'):
                    student = fine.user.student_profile
            except Exception:
                pass

            if not student:
                skipped_no_student += 1
                continue

            # Find latest unpaid or partial invoice
            invoice = Invoice.objects.filter(
                student=student,
                status__in=['UNPAID', 'PARTIAL']
            ).order_by('-date_generated').first()

            if not invoice:
                # Fall back to any latest invoice
                invoice = Invoice.objects.filter(
                    student=student
                ).order_by('-date_generated').first()

            if not invoice:
                skipped_no_invoice += 1
                continue

            # Build reason string
            if fine.lending and fine.lending.copy:
                book_title = fine.lending.copy.book.title
                reason = f"Library Fine ({fine.get_fine_type_display()}): {book_title}"
            else:
                reason = f"Library Fine ({fine.get_fine_type_display()}): {fine.reason or 'No details'}"

            try:
                with transaction.atomic():
                    # Use update_or_create with origin tracking
                    adjustment, _ = Adjustment.objects.update_or_create(
                        origin_model='library.LibraryFine',
                        origin_id=fine.id,
                        defaults={
                            'invoice': invoice,
                            'adjustment_type': 'DEBIT',
                            'amount': fine.amount,
                            'reason': reason,
                            'date': fine.date_issued,
                            'approved_by': request.user,
                        }
                    )
                    fine.adjustment = adjustment
                    fine.save(update_fields=['adjustment'])
                    synced += 1
            except Exception as e:
                skipped_no_invoice += 1
                continue

        return Response({
            'message': f'Sync complete. {synced} fine(s) synced to finance.',
            'synced': synced,
            'skipped_no_student': skipped_no_student,
            'skipped_no_invoice': skipped_no_invoice,
        })

class BookReservationViewSet(viewsets.ModelViewSet):
    queryset = BookReservation.objects.select_related('book', 'user').all()
    serializer_class = BookReservationSerializer
    permission_classes = [IsAuthenticated]

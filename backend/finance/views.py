from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import FeeStructure, Invoice, InvoiceItem, Payment, Adjustment, Expense
from .serializers import (
    FeeStructureSerializer, InvoiceSerializer, PaymentSerializer, 
    AdjustmentSerializer, ExpenseSerializer
)
from students.models import Student
from academics.models import Class
from communication.utils import send_sms, send_email, send_whatsapp
from django.db.models import Sum, Q
from django.utils import timezone
import threading

from .permissions import IsAdminToDelete

class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.select_related('academic_year', 'class_level').all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated, IsAdminToDelete]

from django_filters.rest_framework import DjangoFilterBackend

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related(
        'student', 'student__current_class', 'academic_year'
    ).prefetch_related('items', 'payments', 'payments__received_by', 'adjustments')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, IsAdminToDelete]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'student__current_class', 'student__current_class__stream', 'academic_year', 'term', 'status']
    search_fields = ['student__first_name', 'student__last_name', 'student__admission_number']
    ordering_fields = ['date_generated', 'total_amount', 'balance']

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Returns calculated stats and recent invoices for the dashboard.
        Avoids fetching all records to the frontend.
        """
        # Calculate totals efficiently
        stats = Invoice.objects.aggregate(
            total_invoiced=Sum('total_amount'),
            total_collected=Sum('paid_amount'),
            total_outstanding=Sum('balance')
        )
        
        total_invoiced = stats['total_invoiced'] or 0
        total_collected = stats['total_collected'] or 0
        total_outstanding = stats['total_outstanding'] or 0
        
        today = timezone.now().date()
        daily_collection = Payment.objects.filter(date_received=today).aggregate(sum=Sum('amount'))['sum'] or 0
        
        # Get 5 recent invoices with optimized prefetching to avoid N+1 queries
        recent_invoices = Invoice.objects.select_related(
            'student', 'student__current_class', 'academic_year'
        ).prefetch_related(
            'items', 'payments', 'adjustments', 'payments__received_by'
        ).order_by('-date_generated', '-id')[:5]
        
        recent_data = InvoiceSerializer(recent_invoices, many=True).data
        
        # Capacity metrics
        total_capacity = Class.objects.aggregate(cap=Sum('capacity'))['cap'] or 0
        enrolled_students = Student.objects.filter(status='ACTIVE').count()
        revenue_per_seat = round(float(total_collected) / total_capacity, 2) if total_capacity > 0 else 0
        collection_rate = round((float(total_collected) / float(total_invoiced) * 100), 1) if total_invoiced > 0 else 0

        return Response({
            'totalInvoiced': total_invoiced,
            'totalCollected': total_collected,
            'totalOutstanding': total_outstanding,
            'dailyCollection': daily_collection,
            'totalCapacity': total_capacity,
            'enrolledStudents': enrolled_students,
            'revenuePerSeat': revenue_per_seat,
            'collectionRate': collection_rate,
            'recentInvoices': recent_data
        })

    @action(detail=False, methods=['post'])
    def generate_batch(self, request):
        """
        Generates invoices for a specific class/term based on FeeStructures.
        """
        class_id = request.data.get('class_id')
        term = request.data.get('term')
        year_id = request.data.get('year_id') # Academic Year ID

        if not all([class_id, term, year_id]):
            return Response({'error': 'Missing required fields (class_id, term, year_id)'}, status=400)

        # 1. Get Active Fee Structures for this Class/Term (including 'All Levels')
        fees = FeeStructure.objects.filter(
            term=term, 
            academic_year_id=year_id
        ).filter(Q(class_level_id=class_id) | Q(class_level__isnull=True))
        if not fees.exists():
            return Response({'error': 'No Fee Structures defined for this Class/Term'}, status=404)

        # 2. Get Students in Class
        students = Student.objects.filter(current_class_id=class_id, is_active=True)
        created_count = 0

        with transaction.atomic():
            for student in students:
                # Check if invoice already exists
                if Invoice.objects.filter(student=student, term=term, academic_year_id=year_id).exists():
                    continue

                # Create Invoice
                inv = Invoice.objects.create(
                    student=student,
                    academic_year_id=year_id,
                    term=term,
                    status='UNPAID'
                )

                # Add Items and Calculate Total
                total = 0
                for fee in fees:
                    InvoiceItem.objects.create(
                        invoice=inv,
                        fee_structure=fee,
                        description=fee.name,
                        amount=fee.amount
                    )
                    total += fee.amount

                inv.total_amount = total
                inv.update_balance() # Sets initial balance
                created_count += 1

        return Response({'message': f'Generated {created_count} invoices successfully.'})

    @action(detail=False, methods=['post'])
    def sync_all(self, request):
        """
        Recalculates totals and balances for ALL invoices.
        Ensures student balances are accurately reflected.
        """
        invoices = Invoice.objects.all()
        updated_count = 0
        
        with transaction.atomic():
            for inv in invoices:
                inv.recalculate_totals()
                inv.recalculate_pricing()
                updated_count += 1
                
        return Response({'message': f'Synchronized {updated_count} invoices successfully.'})

    @action(detail=False, methods=['post'])
    def send_reminders(self, request):
        """
        Sends fee reminders via SMS and Email to selected students.
        Processes in the background to avoid network timeouts.
        """
        selected_ids = request.data.get('selected_ids', [])
        message_template = request.data.get('message_template', '')
        send_sms_flag = request.data.get('send_sms', True)
        send_email_flag = request.data.get('send_email', True)

        if not selected_ids:
            return Response({'error': 'No students selected'}, status=400)

        # 1. Define the background task
        def run_sending():
            from django.db import connection
            try:
                invoices = Invoice.objects.filter(id__in=selected_ids).select_related('student')
                for inv in invoices:
                    try:
                        student = inv.student
                        phone = student.guardian_phone
                        email = None
                        
                        primary_parent = student.parents.first()
                        if primary_parent:
                            phone = primary_parent.phone or phone
                            email = primary_parent.email
                        
                        fullname = student.full_name
                        balance = inv.balance
                        
                        msg = message_template.replace('{student_name}', fullname).replace('{balance}', str(balance))
                        if not msg:
                            msg = f"Dear Parent, this is a reminder regarding {fullname}'s outstanding fee balance of KES {balance}. Please settle as soon as possible."

                        if send_sms_flag and phone:
                            send_sms(phone, msg)
                            # Also send WhatsApp if requested (or default to sending both if same flag)
                            # The user asked to make sending DM and WhatsApp catching phone from parent
                            send_whatsapp(phone, msg)
                        
                        if send_email_flag and email:
                            send_email(email, f"Fee Reminder: {fullname}", msg)
                    except Exception as e:
                        logger.error(f"Error sending reminder to student {inv.student_name}: {str(e)}")
                        continue
            except Exception as e:
                logger.critical(f"Critical error in fee reminder background thread: {str(e)}")
            finally:
                # CRITICAL: Close the database connection to prevent connection pool exhaustion
                connection.close()

        # 2. Trigger thread and return immediately
        thread = threading.Thread(target=run_sending)
        thread.daemon = True
        thread.start()

        return Response({
            'message': f'Reminder process started for {len(selected_ids)} students. This may take a few minutes as messages are sent in the background.'
        })

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related(
        'invoice', 'invoice__student', 'received_by'
    ).all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsAdminToDelete]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['invoice__student', 'invoice', 'method']

    def create(self, request, *args, **kwargs):
        method = request.data.get('method')
        reference = request.data.get('reference_number')
        
        # 1. Handle empty strings as None
        if reference == "":
            reference = None
            request.data['reference_number'] = None

        # 2. Enforce uniqueness for MPESA and BANK only
        if method in ['MPESA', 'BANK'] and reference:
            if Payment.objects.filter(method=method, reference_number=reference).exists():
                return Response(
                    {'error': f'A payment with this {method} reference already exists.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        # Auto-set User
        serializer.save(received_by=self.request.user)

class AdjustmentViewSet(viewsets.ModelViewSet):
    queryset = Adjustment.objects.select_related('invoice__student', 'approved_by').all()
    serializer_class = AdjustmentSerializer
    permission_classes = [IsAuthenticated, IsAdminToDelete]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['invoice__student', 'invoice', 'adjustment_type']

    def perform_create(self, serializer):
        serializer.save(approved_by=self.request.user)

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related('approved_by').all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsAdminToDelete]

    def perform_create(self, serializer):
        serializer.save(approved_by=self.request.user)

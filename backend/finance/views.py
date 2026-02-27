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
from django.db import transaction
from django.utils import timezone
import threading

from .permissions import IsAdminToDelete

class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.select_related('academic_year', 'class_level').all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated, IsAdminToDelete]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'class_level__name']

from django_filters.rest_framework import DjangoFilterBackend

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related(
        'student', 'student__current_class', 'academic_year'
    ).prefetch_related('items', 'payments', 'payments__received_by', 'adjustments')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, IsAdminToDelete]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'student__current_class', 'student__current_class__stream', 'academic_year', 'term', 'status']
    search_fields = ['student__full_name', 'student__admission_number', 'student__user__username']
    ordering_fields = ['date_generated', 'total_amount', 'balance']

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Returns calculated stats and recent invoices for the dashboard.
        Prioritizes active academic year/term context for performance.
        Results cached for 5 minutes (300s) to avoid repeated heavy aggregation.
        """
        from academics.models import AcademicYear, Term
        from django.core.cache import cache

        all_time = request.query_params.get('all_time') == 'true'
        cache_key = f'finance_dashboard_stats_{"alltime" if all_time else "active"}'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        # Base QuerySets
        inv_qs = Invoice.objects.all()
        active_context = {"is_all_time": all_time}
        
        if not all_time:
            active_year = AcademicYear.objects.filter(is_active=True).first()
            active_term = Term.objects.filter(is_active=True).first()
            
            if active_year:
                inv_qs = inv_qs.filter(academic_year=active_year)
                active_context['year'] = active_year.name
                active_context['year_id'] = active_year.id
            
            if active_term:
                try:
                    term_num = int(''.join(filter(str.isdigit, active_term.name)))
                    inv_qs = inv_qs.filter(term=term_num)
                    active_context['term_id'] = active_term.id
                    active_context['term_num'] = term_num
                    active_context['term_name'] = active_term.name
                except (ValueError, TypeError):
                    pass

        # Calculate totals efficiently
        stats = inv_qs.aggregate(
            total_invoiced=Sum('total_amount'),
            total_collected=Sum('paid_amount'),
            total_outstanding=Sum('balance')
        )
        
        total_invoiced = stats['total_invoiced'] or 0
        total_collected = stats['total_collected'] or 0
        total_outstanding = stats['total_outstanding'] or 0
        
        today = timezone.now().date()
        daily_collection = Payment.objects.filter(date_received=today).aggregate(sum=Sum('amount'))['sum'] or 0
        
        # Get recent invoices from the SAME filtered context
        recent_invoices = inv_qs.select_related(
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

        result = {
            'totalInvoiced': total_invoiced,
            'totalCollected': total_collected,
            'totalOutstanding': total_outstanding,
            'dailyCollection': daily_collection,
            'totalCapacity': total_capacity,
            'enrolledStudents': enrolled_students,
            'revenuePerSeat': revenue_per_seat,
            'collectionRate': collection_rate,
            'recentInvoices': recent_data,
            'context': active_context
        }
        # Cache for 5 minutes
        cache.set(cache_key, result, 300)
        return Response(result)

    @action(detail=False, methods=['post'])
    def generate_batch(self, request):
        """
        Generates invoices for a specific class/term based on FeeStructures.
        Supports 'all' for class_id and level.
        """
        level = request.data.get('level') # e.g. "Grade 1" or "all"
        class_id = request.data.get('class_id') # e.g. 1 or "all"
        term = request.data.get('term')
        year_id = request.data.get('year_id')

        if not all([level, term, year_id]):
            return Response({'error': 'Missing required fields (level, term, year_id)'}, status=400)

        # Base filters for fee structures
        fee_filters = Q(term=term, academic_year_id=year_id)
        
        # Base filters for students
        student_filters = Q(is_active=True)

        if level != 'all':
            if class_id != 'all' and class_id:
                # Specific Class
                fee_filters &= (Q(class_level_id=class_id) | Q(class_level__isnull=True))
                student_filters &= Q(current_class_id=class_id)
            else:
                # All Streams in a Level
                fee_filters &= (Q(class_level__name=level) | Q(class_level__isnull=True))
                student_filters &= Q(current_class__name=level)
        else:
            # All Levels, All Streams
            # fee_filters remains as term/year only (catches all levels + null)
            pass

        try:
            # 1. Get Active Fee Structures
            fees = FeeStructure.objects.filter(fee_filters).distinct()
            if not fees.exists():
                return Response({'error': 'No Fee Structures defined for the selected criteria'}, status=404)

            # 2. Get Students
            students = Student.objects.filter(student_filters)
            created_count = 0

            with transaction.atomic():
                for student in students:
                    # Check if invoice already exists
                    if Invoice.objects.filter(student=student, term=term, academic_year_id=year_id).exists():
                        continue

                    # Filter fees relevant to THIS student's class or global fees
                    student_fees = fees.filter(Q(class_level=student.current_class) | Q(class_level__isnull=True))
                    if not student_fees.exists():
                        continue

                    # Create Invoice
                    inv = Invoice.objects.create(
                        student=student,
                        academic_year_id=year_id,
                        term=term,
                        status='UNPAID'
                    )

                    total = 0
                    
                    # --- BALANCE BROUGHT FORWARD LOGIC ---
                    # Find previous invoices for this student to check for arrears/overpayments
                    # We look for the most recent invoice BEFORE this one (different term or year)
                    prev_inv = Invoice.objects.filter(student=student).exclude(id=inv.id).order_by('-academic_year__name', '-term', '-id').first()
                    
                    if prev_inv and prev_inv.balance != 0:
                        desc = "Balance Brought Forward (Arrears)" if prev_inv.balance > 0 else "Overpayment Credit"
                        InvoiceItem.objects.create(
                            invoice=inv,
                            description=desc,
                            amount=prev_inv.balance, # Positive for debt, Negative for credit
                            fee_structure=None
                        )
                        total += prev_inv.balance
                    # -------------------------------------

                    for fee in student_fees:
                        is_hostel_fee = 'board' in fee.name.lower() or 'hostel' in fee.name.lower()
                        if is_hostel_fee and student.category != 'BOARDING':
                            continue
                            
                        InvoiceItem.objects.create(
                            invoice=inv,
                            fee_structure=fee,
                            description=fee.name,
                            amount=fee.amount
                        )
                        total += fee.amount

                    inv.total_amount = total
                    inv.update_balance()
                    created_count += 1

                return Response({'message': f'Generated {created_count} invoices successfully.'})
            
        except Exception as e:
            return Response({'error': f"Failed to generate batch: {str(e)}"}, status=400)

    @action(detail=False, methods=['post'])
    def sync_all(self, request):
        """
        Recalculates totals and balances for ALL invoices in the background.
        """
        def run_sync():
            from django.db import connection
            try:
                invoices = Invoice.objects.all()
                for inv in invoices:
                    try:
                        inv.recalculate_totals()
                        inv.recalculate_pricing()
                    except Exception:
                        continue
            finally:
                connection.close()

        thread = threading.Thread(target=run_sync)
        thread.daemon = True
        thread.start()
        
        return Response({'message': 'Synchronization process started in the background.'})

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
    filterset_fields = ['invoice__student', 'invoice', 'method', 'invoice__term', 'invoice__academic_year']
    search_fields = ['invoice__student__full_name', 'invoice__student__admission_number', 'reference_number']

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
    filter_backends = [filters.SearchFilter]
    search_fields = ['category', 'description', 'paid_to']

    def perform_create(self, serializer):
        serializer.save(approved_by=self.request.user)

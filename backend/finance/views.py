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
from django.db import transaction

class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.select_related('academic_year', 'class_level').all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated]

from django_filters.rest_framework import DjangoFilterBackend

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related(
        'student', 'student__current_class', 'academic_year'
    ).prefetch_related('items', 'payments', 'payments__received_by', 'adjustments')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student__current_class', 'student__current_class__stream', 'academic_year', 'term', 'status']
    search_fields = ['student__first_name', 'student__last_name', 'student__admission_number']
    ordering_fields = ['date_generated', 'total_amount', 'balance']

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Returns calculated stats and recent invoices for the dashboard.
        Avoids fetching all records to the frontend.
        """
        from django.db.models import Sum
        from django.utils import timezone
        
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
        
        # Get 5 recent invoices
        recent_invoices = Invoice.objects.select_related(
            'student', 'student__current_class', 'academic_year'
        ).order_by('-date_generated', '-id')[:5]
        
        recent_data = InvoiceSerializer(recent_invoices, many=True).data
        
        return Response({
            'totalInvoiced': total_invoiced,
            'totalCollected': total_collected,
            'totalOutstanding': total_outstanding,
            'dailyCollection': daily_collection,
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
        from django.db.models import Q
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

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related(
        'invoice', 'invoice__student', 'received_by'
    ).all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(approved_by=self.request.user)

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related('approved_by').all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(approved_by=self.request.user)

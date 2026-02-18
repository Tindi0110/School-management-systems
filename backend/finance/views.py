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
    queryset = FeeStructure.objects.all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated]

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related(
        'student', 'student__current_class', 'student__current_stream', 'academic_year'
    ).prefetch_related('items', 'payments', 'payments__received_by')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student__first_name', 'student__last_name', 'student__admission_number']

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
    queryset = Adjustment.objects.all()
    serializer_class = AdjustmentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(approved_by=self.request.user)

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(approved_by=self.request.user)

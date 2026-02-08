from rest_framework import serializers
from .models import FeeStructure, Invoice, InvoiceItem, Payment, Adjustment, Expense

class FeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructure
        fields = '__all__'

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'amount']

class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='invoice.student.full_name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.id', read_only=True)
    received_by_name = serializers.CharField(source='received_by.get_full_name', read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['received_by']

class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    class_name = serializers.CharField(source='student.current_class.name', read_only=True)
    stream_name = serializers.CharField(source='student.current_stream.name', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['total_amount', 'paid_amount', 'balance', 'status', 'items', 'is_finalized']

class AdjustmentSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = Adjustment
        fields = '__all__'
        read_only_fields = ['date', 'approved_by']

class ExpenseSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['approved_by']

from rest_framework import serializers
from .models import FeeStructure, Invoice, InvoiceItem, Payment, Adjustment, Expense

class FeeStructureSerializer(serializers.ModelSerializer):
    class_level_name = serializers.SerializerMethodField()
    academic_year_name = serializers.SerializerMethodField()

    class Meta:
        model = FeeStructure
        fields = '__all__'

    def get_class_level_name(self, obj):
        return obj.class_level.name if obj.class_level else 'All Levels'

    def get_academic_year_name(self, obj):
        return obj.academic_year.name if obj.academic_year else 'N/A'

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'amount', 'created_at']

class PaymentListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='invoice.student.full_name', read_only=True)
    admission_number = serializers.CharField(source='invoice.student.admission_number', read_only=True)
    invoice_number = serializers.CharField(source='invoice.id', read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'invoice', 'invoice_number', 'student_name', 'admission_number', 'amount', 'method', 'reference_number', 'date_received', 'created_at']

class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='invoice.student.full_name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.id', read_only=True)
    received_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['received_by']

    def get_received_by_name(self, obj):
        return obj.received_by.get_full_name() if obj.received_by else 'System'

class AdjustmentSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Adjustment
        fields = '__all__'
        read_only_fields = ['date', 'approved_by']

    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else 'System'

class InvoiceListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    class_name = serializers.SerializerMethodField()
    stream_name = serializers.SerializerMethodField()
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'student', 'student_name', 'admission_number', 
            'class_name', 'stream_name', 'academic_year', 'academic_year_name', 
            'term', 'total_amount', 'paid_amount', 'balance', 'status', 'date_generated', 'created_at'
        ]

    def get_class_name(self, obj):
        if obj.student and obj.student.current_class:
            return obj.student.current_class.name
        return 'General'

    def get_stream_name(self, obj):
        if obj.student and obj.student.current_class:
            return obj.student.current_class.stream
        return ''

class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    class_name = serializers.SerializerMethodField()
    stream_name = serializers.SerializerMethodField()
    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    adjustments = AdjustmentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['total_amount', 'paid_amount', 'balance', 'status', 'items', 'is_finalized', 'adjustments']

    def get_class_name(self, obj):
        if obj.student and obj.student.current_class:
            return obj.student.current_class.name
        return 'General'

    def get_stream_name(self, obj):
        if obj.student and obj.student.current_class:
            return obj.student.current_class.stream
        return ''

class ExpenseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'category', 'amount', 'description', 'paid_to', 'date_occurred', 'status']

class ExpenseSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['approved_by']

    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else 'System'

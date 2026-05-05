from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum

class FeeStructure(models.Model):
    """
    Defines the standard fees for a class/term.
    These are the templates used to generate Invoices.
    """
    TERM_CHOICES = (
        (1, 'Term 1'),
        (2, 'Term 2'),
        (3, 'Term 3'),
    )
    
    name = models.CharField(max_length=100) # e.g. "Tuition Fee", "Lunch", "Transport Zone A"
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, null=True, blank=True)
    term = models.IntegerField(choices=TERM_CHOICES)
    class_level = models.ForeignKey('academics.Class', on_delete=models.CASCADE, null=True, blank=True) # If null, applies to all
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.amount} ({self.academic_year} T{self.term})"

class Invoice(models.Model):
    """
    The Master Bill for a student for a specific term.
    Immutable: Once finalized, amount_due should not change directly.
    """
    STATUS_CHOICES = (
        ('UNPAID', 'Unpaid'),
        ('PARTIAL', 'Partially Paid'),
        ('PAID', 'Fully Paid'),
        ('OVERPAID', 'Overpaid'),
    )

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='invoices')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.PROTECT, db_index=True)
    term = models.IntegerField(db_index=True)
    
    # Financials
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, db_index=True)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, db_index=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0, db_index=True)
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='UNPAID', db_index=True)
    date_generated = models.DateField(default=timezone.now, db_index=True)
    due_date = models.DateField(null=True, blank=True)
    
    is_finalized = models.BooleanField(default=True) # If False, can still add items. If True, locked.

    class Meta:
        unique_together = ('student', 'academic_year', 'term')
        ordering = ['-date_generated']

    def __str__(self):
        return f"INV-{self.id} | {self.student} | {self.status}"
    
    def recalculate_totals(self):
        """Recalculate paid_amount and balance from actual payments"""
        total_paid = self.payments.aggregate(sum=Sum('amount'))['sum'] or 0
        self.paid_amount = total_paid
        self.update_balance()

    def recalculate_pricing(self):
        """Recalculate total_amount from Items + Adjustments"""
        # 1. Base Items
        item_total = self.items.aggregate(sum=Sum('amount'))['sum'] or 0
        
        # 2. Adjustments
        credits = self.adjustments.filter(adjustment_type='CREDIT').aggregate(sum=Sum('amount'))['sum'] or 0
        debits = self.adjustments.filter(adjustment_type='DEBIT').aggregate(sum=Sum('amount'))['sum'] or 0
        
        self.total_amount = item_total + debits - credits
        self.update_balance()

    def update_balance(self):
        """Recalculate status based on payment vs total"""
        self.balance = self.total_amount - self.paid_amount
        if self.balance <= 0 and self.paid_amount > 0:
            if self.balance < 0: self.status = 'OVERPAID'
            else: self.status = 'PAID'
        elif self.paid_amount > 0:
            self.status = 'PARTIAL'
        else:
            self.status = 'UNPAID'
        self.save()

class InvoiceItem(models.Model):
    """
    Individual line items that make up an Invoice.
    Snapshot of the FeeStructure at the time of generation.
    """
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.SET_NULL, null=True)
    description = models.CharField(max_length=150) # Snapshot of name
    amount = models.DecimalField(max_digits=10, decimal_places=2) # Snapshot of amount
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.invoice.recalculate_pricing()

    def delete(self, *args, **kwargs):
        invoice = self.invoice
        super().delete(*args, **kwargs)
        invoice.recalculate_pricing()

    def __str__(self):
        return f"{self.description}: {self.amount}"

class Payment(models.Model):
    """
    Incoming money transaction.
    """
    METHOD_CHOICES = (
        ('CASH', 'Cash'),
        ('BANK', 'Bank Transfer'),
        ('MPESA', 'M-Pesa'),
        ('CHEQUE', 'Cheque'),
    )

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    reference_number = models.CharField(max_length=50, blank=True, null=True) # e.g. M-Pesa Code
    date_received = models.DateField(default=timezone.now, db_index=True)
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    
    notes = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update Invoice robustly
        self.invoice.recalculate_totals()
        
    def delete(self, *args, **kwargs):
        invoice = self.invoice
        super().delete(*args, **kwargs)
        invoice.recalculate_totals()

class Adjustment(models.Model):
    """
    Credit/Debit Notes to correct an Invoice.
    Admin Only.
    """
    TYPE_CHOICES = (
        ('CREDIT', 'Credit Note (Reduce Debt)'), # Waiver, Correction (Student owes LESS)
        ('DEBIT', 'Debit Note (Increase Debt)'), # Fine, Correction (Student owes MORE)
    )

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='adjustments')
    adjustment_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    # Origin Tracking (for Fraud Prevention/Auditing)
    origin_model = models.CharField(max_length=100, null=True, blank=True, db_index=True) # e.g. "library.LibraryFine"
    origin_id = models.PositiveIntegerField(null=True, blank=True, db_index=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.invoice.recalculate_pricing()

    def delete(self, *args, **kwargs):
        invoice = self.invoice
        super().delete(*args, **kwargs)
        invoice.recalculate_pricing()

class Expense(models.Model):
    """
    School Expenditures (independent of Students).
    """
    CATEGORY_CHOICES = (
        ('SALARY', 'Staff Salary'),
        ('UTILITIES', 'Utilities (Water/Power)'),
        ('MAINTENANCE', 'Repairs & Maintenance'),
        ('SUPPLIES', 'Office/Class Supplies'),
        ('FOOD', 'Food & Provisions'),
        ('OTHER', 'Other'),
    )

    STATUS_CHOICES = (
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('DECLINED', 'Declined'),
    )

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    paid_to = models.CharField(max_length=100, default='Unknown') # Vendor/Staff Name
    date_occurred = models.DateField(default=timezone.now)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    receipt_scan = models.FileField(upload_to='expenses/', null=True, blank=True)

    # Origin Tracking (for Fraud Prevention/Auditing)
    origin_model = models.CharField(max_length=100, null=True, blank=True, db_index=True) # e.g. "transport.FuelRecord"
    origin_id = models.PositiveIntegerField(null=True, blank=True, db_index=True)

    def __str__(self):
        return f"{self.category}: {self.amount} on {self.date_occurred}"

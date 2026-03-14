from django.test import TestCase
from academics.models import AcademicYear, Class
from students.models import Student
from .models import FeeStructure, Invoice, InvoiceItem, Payment
import datetime

class FinanceModelTest(TestCase):
    def setUp(self):
        self.year = AcademicYear.objects.create(name="2026", is_active=True)
        self.cls = Class.objects.create(name="Form 1", level="1")
        self.student = Student.objects.create(
            full_name="Cash Flow",
            gender="M",
            date_of_birth=datetime.date(2010, 1, 1),
            current_class=self.cls
        )
        self.fee = FeeStructure.objects.create(
            name="Tuition",
            amount=5000.00,
            academic_year=self.year,
            term=1,
            class_level=self.cls
        )

    def test_invoice_creation_and_totals(self):
        """Test that adding items to an invoice updates the total_amount"""
        invoice = Invoice.objects.create(
            student=self.student,
            academic_year=self.year,
            term=1
        )
        InvoiceItem.objects.create(
            invoice=invoice,
            fee_structure=self.fee,
            description=self.fee.name,
            amount=self.fee.amount
        )
        
        invoice.refresh_from_db()
        self.assertEqual(invoice.total_amount, 5000.00)
        self.assertEqual(invoice.status, "UNPAID")

    def test_payment_updates_balance_and_status(self):
        """Test that payments update the balance and status of an invoice"""
        invoice = Invoice.objects.create(
            student=self.student,
            academic_year=self.year,
            term=1
        )
        InvoiceItem.objects.create(
            invoice=invoice,
            fee_structure=self.fee,
            description=self.fee.name,
            amount=5000.00
        )

        # Partial Payment
        Payment.objects.create(
            invoice=invoice,
            amount=2000.00,
            method="CASH"
        )
        invoice.refresh_from_db()
        self.assertEqual(invoice.paid_amount, 2000.00)
        self.assertEqual(invoice.balance, 3000.00)
        self.assertEqual(invoice.status, "PARTIAL")

        # Full Payment
        Payment.objects.create(
            invoice=invoice,
            amount=3000.00,
            method="MPESA"
        )
        invoice.refresh_from_db()
        self.assertEqual(invoice.paid_amount, 5000.00)
        self.assertEqual(invoice.balance, 0.00)
        self.assertEqual(invoice.status, "PAID")

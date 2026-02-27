import logging
from django.utils import timezone
from django.db import models
from .models import Invoice, InvoiceItem, FeeStructure

logger = logging.getLogger(__name__)

def get_or_create_invoice(student, year_name=None, term_name=None):
    """
    Helper to get active academic year/term invoice or create one.
    Defaults to '2026' / 'Term 1' if not found dynamically.
    Fetches 'Active' year/term from academics app.
    """
    from academics.models import AcademicYear, Term
    
    # Try to find active year/term
    active_year = AcademicYear.objects.filter(is_active=True).first()
    if not active_year:
        active_year = AcademicYear.objects.first()
    if not active_year:
        active_year = AcademicYear.objects.create(name=year_name or '2026', is_active=True)

    active_term = Term.objects.filter(year=active_year, is_active=True).first()
    if not active_term:
        active_term = Term.objects.filter(year=active_year).first()
    if not active_term:
        active_term = Term.objects.create(
            name=term_name or 'Term 1', 
            year=active_year, 
            is_active=True,
            start_date=timezone.now().date(),
            # 3 months later
            end_date=timezone.now().date() + timezone.timedelta(days=90)
        )

    # Get/Create Invoice
    term_int = 1
    if '2' in active_term.name: term_int = 2
    elif '3' in active_term.name: term_int = 3

    # Create Invoice if not exists
    invoice, created = Invoice.objects.get_or_create(
        student=student,
        academic_year=active_year,
        term=term_int,
        defaults={
            'status': 'UNPAID',
            'date_generated': timezone.now().date(),
            'is_finalized': False
        }
    )

    # --- AUTO-APPLY STANDARD FEES (Tuition) ---
    std_fees = FeeStructure.objects.filter(
        is_active=True,
        term=term_int,
        academic_year=active_year
    ).filter(
        models.Q(class_level__isnull=True) | models.Q(class_level=student.current_class)
    )

    for fee in std_fees:
        exists = InvoiceItem.objects.filter(
            models.Q(invoice=invoice, fee_structure=fee) |
            models.Q(invoice=invoice, description=fee.name)
        ).exists()

        if not exists:
            InvoiceItem.objects.create(
                invoice=invoice,
                fee_structure=fee,
                description=fee.name,
                amount=fee.amount
            )
            
    # Explicitly trigger recalculation
    invoice.recalculate_pricing()
            
    return invoice

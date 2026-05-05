from django.core.management.base import BaseCommand
from students.models import Student
from finance.signals import get_or_create_invoice
from academics.models import AcademicYear, Term

class Command(BaseCommand):
    help = 'Ensures all active students have an invoice with tuition fees for the current term'

    def handle(self, *args, **options):
        self.stdout.write("Checking for missing term fees...")
        
        # Get Active Year/Term logic (similar to signals)
        active_year = AcademicYear.objects.filter(is_active=True).first()
        active_term = Term.objects.filter(is_active=True).first()
        
        if not active_year or not active_term:
            self.stdout.write(self.style.WARNING("No active Academic Year or Term found."))
            return

        students = Student.objects.filter(status='ACTIVE')
        count = 0
        for student in students:
            get_or_create_invoice(student)
            count += 1
            if count % 10 == 0:
                self.stdout.write(f"Processed {count} students...")

        self.stdout.write(self.style.SUCCESS(f"Successfully processed {count} students. Verified Invoices & Tuition."))

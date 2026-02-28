import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from library.models import LibraryFine
from finance.models import Invoice, Adjustment, InvoiceItem
from students.models import Student

print('Looking for student 648109...')
students = Student.objects.filter(admission_number='648109')
if not students.exists():
    print('Student not found.')
else:
    student = students.first()
    print(f'Found Student: {student.full_name} (ADM: {student.admission_number})')

    user = student.user
    if user:
        fines = LibraryFine.objects.filter(user=user)
        for fine in fines:
            print(f'Fine ID: {fine.id}, Amount: {fine.amount}, Reason: {fine.reason}, Date: {fine.date_issued}')
            adj = getattr(fine, 'adjustment', None)
            if adj:
                print(f'  --> Linked to Adjustment ID: {adj.id}, Invoice ID: {adj.invoice.id}')
                print(f'      Adjustment Date: {adj.date}, Reason: {adj.reason}')
            else:
                print('  --> No adjustment linked.')
        
    print('\nStudent Invoices:')
    for inv in student.invoices.all():
        print(f'Invoice ID: {inv.id}, Term: {inv.term}, Year: {inv.academic_year.name}, Status: {inv.status}, Generated: {inv.date_generated}')
        for item in inv.items.all():
            print(f'  Item: {item.description}, Amount: {item.amount}')
        for adj in inv.adjustments.all():
            print(f'  Adjustment [{adj.adjustment_type}]: {adj.reason}, Amount: {adj.amount}, Date: {adj.date}')


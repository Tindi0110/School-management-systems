import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student
from finance.models import Invoice, Payment
from academics.models import AcademicYear, Class

print(f"Students: {Student.objects.count()}")
print(f"Invoices: {Invoice.objects.count()}")
print(f"Payments: {Payment.objects.count()}")
print(f"Academic Years: {AcademicYear.objects.count()}")
print(f"Classes: {Class.objects.count()}")

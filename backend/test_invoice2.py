
from academics.models import AcademicYear, Term, Class
from students.models import Student
from finance.models import FeeStructure, Invoice, InvoiceItem

year = AcademicYear.objects.filter(is_active=True).first()
term = Term.objects.filter(is_active=True).first()
term_num = int(''.join(filter(str.isdigit, term.name)))

level = "Form 1"
class_id = "all"
term_id = term_num
year_id = year.id

from django.db.models import Q
fee_filters = Q(term=term_id, academic_year_id=year_id)
student_filters = Q(is_active=True) & Q(current_class__name=level)
fee_filters &= (Q(class_level__name=level) | Q(class_level__isnull=True))

fees = FeeStructure.objects.filter(fee_filters).distinct()
students = Student.objects.filter(student_filters)

created = 0
skipped_exists = 0
skipped_no_feed = 0

for student in students:
    if Invoice.objects.filter(student=student, term=term_id, academic_year_id=year_id).exists():
        skipped_exists += 1
        continue

    student_fees = fees.filter(Q(class_level=student.current_class) | Q(class_level__isnull=True))
    if not student_fees.exists():
        skipped_no_feed += 1
        continue

    created += 1

print(f"Created: {created}, Skipped (Already Exists): {skipped_exists}, Skipped (No Fees Match Class): {skipped_no_feed}")

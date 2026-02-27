
from academics.models import AcademicYear, Term, Class
from students.models import Student
from finance.models import FeeStructure, Invoice

year = AcademicYear.objects.filter(is_active=True).first()
if not year:
    print("No active year")
    exit()

term = Term.objects.filter(is_active=True).first()
if not term:
    print("No active term")
    exit()

term_num = int(''.join(filter(str.isdigit, term.name)))

# simulate the POST requested payload
level = "Form 1"
class_id = "all"
term_id = term_num
year_id = year.id

from django.db.models import Q
fee_filters = Q(term=term_id, academic_year_id=year_id)
student_filters = Q(is_active=True)

fee_filters &= (Q(class_level__name=level) | Q(class_level__isnull=True))
student_filters &= Q(current_class__name=level)

fees = FeeStructure.objects.filter(fee_filters).distinct()
print(f"Found {fees.count()} fee structures for {level}, term {term_id}, year {year_id}")
for f in fees:
    print(f"- {f.name} = {f.amount}")

students = Student.objects.filter(student_filters)
print(f"Found {students.count()} students for filter")


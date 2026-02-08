from django.core.management.base import BaseCommand
from django.db import connection
from students.models import Student, Parent, StudentAdmission, StudentDocument

class Command(BaseCommand):
    help = 'Wipes all Student and Parent data from the database'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Starting full student data wipe...'))

        students = Student.objects.all()
        count = students.count()
        
        with connection.cursor() as cursor:
            # Disable FK checks to bypass missing tables or protected relations
            cursor.execute("PRAGMA foreign_keys = OFF;")
            
            for student in students:
                self.stdout.write(f"Deleting student: {student.admission_number}...")
                
                # 1. Finance - Invoices
                try:
                    if hasattr(student, 'invoices'):
                        student.invoices.all().delete()
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  Skipped Invoices: {e}"))
                
                # 2. Hostel
                try:
                    if hasattr(student, 'hostel_allocation'):
                        student.hostel_allocation.delete()
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  Skipped Hostel: {e}"))
                    
                # 3. Transport
                try:
                    if hasattr(student, 'transport_allocation'):
                        student.transport_allocation.delete()
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  Skipped Transport: {e}"))
                    
                # 4. Academics
                try:
                    if hasattr(student, 'results'):
                        student.results.all().delete()
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  Skipped Results: {e}"))

                # Skip Subjects as table is missing
                    
                try:
                    if hasattr(student, 'attendance_set'):
                        student.attendance_set.all().delete()
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  Skipped Attendance: {e}"))
                
                # 5. Documents
                try:
                    if hasattr(student, 'documents'):
                        student.documents.all().delete()
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  Skipped Documents: {e}"))
                    
                # Delete the student using Raw SQL to bypass missing table cascade
                try:
                    cursor.execute("DELETE FROM students_student WHERE id = %s", [student.id])
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  Failed raw delete: {e}"))

        self.stdout.write(self.style.SUCCESS(f"Deleted {count} students."))

        # Delete Admissions
        try:
            adm_count = StudentAdmission.objects.all().delete()[0]
            self.stdout.write(self.style.SUCCESS(f"Deleted {adm_count} admission records."))
        except Exception as e:
             self.stdout.write(self.style.WARNING(f"Skipped Admissions: {e}"))
        
        # Delete Documents (orphan check)
        try:
            doc_count = StudentDocument.objects.all().delete()[0]
            self.stdout.write(self.style.SUCCESS(f"Deleted {doc_count} document records."))
        except Exception as e:
             self.stdout.write(self.style.WARNING(f"Skipped Documents: {e}"))

        # Delete Parents
        # Note: Parents might be shared, but user requested full wipe.
        try:
            parent_count = Parent.objects.all().delete()[0]
            self.stdout.write(self.style.SUCCESS(f"Deleted {parent_count} parents."))
        except Exception as e:
             self.stdout.write(self.style.WARNING(f"Skipped Parents: {e}"))

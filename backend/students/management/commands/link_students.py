from django.core.management.base import BaseCommand
from students.models import Student
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Links all current students to User accounts'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        students = Student.objects.all()
        count = 0
        updated = 0
        
        self.stdout.write("Starting Student-User Linking...")
        
        for student in students:
            try:
                # Logic mirrors the signal but forces check
                username = student.admission_number.strip().replace(" ", "")
                
                # Check if user exists independently or via link
                if not student.user:
                    user, created = User.objects.get_or_create(username=username)
                    if created:
                        user.set_password(username)
                        user.role = 'STUDENT'
                        self.stdout.write(f"Created User: {username}")
                    
                    user.first_name = student.full_name.split(" ")[0]
                    user.last_name = " ".join(student.full_name.split(" ")[1:])
                    user.save()
                    
                    student.user = user
                    student.save(update_fields=['user'])
                    count += 1
                
                # Sync Status
                inactive_statuses = ['WITHDRAWN', 'ALUMNI', 'SUSPENDED', 'TRANSFERRED']
                should_be_active = student.status not in inactive_statuses
                
                if student.user.is_active != should_be_active:
                    student.user.is_active = should_be_active
                    student.user.save()
                    updated += 1
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error processing {student.admission_number}: {e}"))
                
        self.stdout.write(self.style.SUCCESS(f"Done. Linked {count} new users. Updated status for {updated}."))

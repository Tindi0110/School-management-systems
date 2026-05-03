from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from students.models import Student
from django.db import transaction

class Command(BaseCommand):
    help = 'Automatically links existing Student profiles to User accounts based on admission number'

    def handle(self, *args, **options):
        User = get_user_model()
        students = Student.objects.filter(user__isnull=True)
        count = 0
        created_count = 0

        self.stdout.write(self.style.SUCCESS(f"Found {students.count()} unlinked students."))

        for student in students:
            if not student.admission_number:
                self.stdout.write(self.style.WARNING(f"Skipping student {student.full_name} (No admission number)"))
                continue

            username = student.admission_number.strip().replace(" ", "")
            user = User.objects.filter(username=username).first()

            if not user:
                # Create user if it doesn't exist
                email = f"{username}@placeholder.com"
                user = User.objects.create(
                    username=username,
                    email=email,
                    role='STUDENT',
                    is_approved=True,
                    is_email_verified=True
                )
                user.set_password(username)
                
                name_parts = student.full_name.split(" ", 1)
                user.first_name = name_parts[0]
                user.last_name = name_parts[1] if len(name_parts) > 1 else ""
                user.save()
                created_count += 1
                self.stdout.write(f"Created user for {student.admission_number}")

            # Link user
            student.user = user
            student.save(update_fields=['user'])
            count += 1
            self.stdout.write(f"Linked {student.admission_number} to user {user.username}")

        self.stdout.write(self.style.SUCCESS(f"Successfully linked {count} students ({created_count} users created)."))

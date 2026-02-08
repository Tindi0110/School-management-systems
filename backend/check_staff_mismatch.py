import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from academics.models import Class
from accounts.models import User
from staff.models import Staff

print("--- Staff & User Roles ---")
users = User.objects.all()
for u in users:
    if u.role != 'STUDENT' and u.role != 'PARENT':
        print(f"User: {u.get_full_name()} (ID: {u.username}, Role: {u.role})")

print("\n--- Classes & Assigned Teachers ---")
classes = Class.objects.select_related('class_teacher').all()
for c in classes:
    teacher_name = c.class_teacher.get_full_name() if c.class_teacher else "None"
    print(f"Class: {c.name} {c.stream}, Year: {c.year}, Teacher: {teacher_name}")

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("--- Recent Users ---")
for u in User.objects.all().order_by('-id')[:5]:
    try:
        staff_id = u.staff_profile.employee_id if hasattr(u, 'staff_profile') else "No Staff Profile"
    except:
        staff_id = "Error"
    print(f"ID: {u.id} | User: '{u.username}' | Email: '{u.email}' | Role: {u.role} | StaffID: {staff_id} | Active: {u.is_active}")

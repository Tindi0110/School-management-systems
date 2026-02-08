import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from academics.models import Class
from accounts.models import User

# The teacher is thesaline gatui ID:REF-006
# IVYTANIA WAMBUI is a nurse ID:REF-005

try:
    new_teacher = User.objects.get(username='Thesa')
    old_teacher = User.objects.get(username='Wambui')

    # Update all classes where Ivytania was mistakenly assigned
    classes_to_fix = Class.objects.filter(class_teacher=old_teacher)
    count = classes_to_fix.count()
    
    for cls in classes_to_fix:
        cls.class_teacher = new_teacher
        cls.save()
        print(f"Fixed Class: {cls.name} {cls.stream}")

    print(f"Successfully reassigned {count} classes from {old_teacher.get_full_name()} to {new_teacher.get_full_name()}.")

except User.DoesNotExist as e:
    print(f"Error: {e}")
except Exception as e:
    print(f"An error occurred: {e}")

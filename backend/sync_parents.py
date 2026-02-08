import os
import django
import sys
import random

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student, Parent

def run():
    print(f"Syncing Parents for {Student.objects.count()} students...")
    
    # 1. Ensure at least one parent exists
    parent = Parent.objects.first()
    if not parent:
        print("Creating default parent...")
        parent = Parent.objects.create(
            full_name="John Doe Parent",
            relationship="FATHER",
            phone="0700000000",
            occupation="Engineer"
        )
    
    # 2. Link all unlinked students to this parent (for demo purposes if real linking logic isn't present)
    # Or try to match by name if we had a legacy field.
    # Since we don't have legacy fields shown, we will just link random students to this parent
    # so the user can see the UI working.
    
    count = 0
    for student in Student.objects.all():
        if not student.parents.exists():
            print(f"Linking {student.full_name} to {parent.full_name}")
            student.parents.add(parent)
            count += 1
            
    print(f"Linked {count} students to parents.")

if __name__ == '__main__':
    run()

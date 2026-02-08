import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student, Parent
from django.db import transaction

def restore_parents():
    print("--- Starting Parent Restoration from Legacy Data ---")
    
    students = Student.objects.all()
    created_count = 0
    linked_count = 0
    
    for s in students:
        # Check if student has legacy guardian info
        if s.guardian_name:
            g_name = s.guardian_name.strip()
            g_phone = s.guardian_phone.strip() if s.guardian_phone else "N/A"
            
            if not g_name:
                continue

            with transaction.atomic():
                # Try to find existing parent by name
                # (Simple match - in prod might want more complex matching)
                parent, created = Parent.objects.get_or_create(
                    full_name=g_name,
                    defaults={
                        'phone': g_phone,
                        'relationship': 'GUARDIAN', # Default
                        'address': 'Restored from Student Profile'
                    }
                )

                if created:
                    print(f"[NEW] Created Parent '{g_name}' for Student '{s.full_name}'")
                    created_count += 1
                
                # Check link
                if not s.parents.filter(id=parent.id).exists():
                    s.parents.add(parent)
                    print(f" [LINK] Linked '{g_name}' to '{s.full_name}'")
                    linked_count += 1
                
    print(f"\n--- Restoration Complete ---")
    print(f"Parents Created: {created_count}")
    print(f"Links Established: {linked_count}")

if __name__ == '__main__':
    restore_parents()

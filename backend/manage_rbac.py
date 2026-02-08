import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from accounts.models import User

def setup_rbac():
    print("--- Starting RBAC Enforcement ---")

    # 1. Define Role Permissions (Golden Rules)
    # Format: 'ROLE': ['app.action', ...]
    
    # Common Read-Only for Staff
    common_read = [
        'sms.view_dashboard',
        'academics.view_academics', # Teachers need to see classes
    ]

    role_perms = {
        'ADMIN': [
            # Core Dashboard
            'sms.view_dashboard',
            'sms.view_finance', 'sms.view_students', 'sms.view_academics', 'sms.view_staff', 
            'sms.view_parents', 'sms.view_hostel', 'sms.view_library', 'sms.view_medical', 
            'sms.view_transport', 'sms.view_timetable',
            
            # Finance (READ ONLY)
            'finance.view_invoice', 'finance.view_payment', 
            'finance.view_expense', 'finance.view_feestructure',

            # Transport (FULL ACCESS)
            'transport.add_transportconfig', 'transport.change_transportconfig', 'transport.view_transportconfig',
            'transport.add_vehicle', 'transport.change_vehicle', 'transport.view_vehicle', 'transport.delete_vehicle',
            'transport.add_amount', 'transport.change_amount', 'transport.view_amount', # If applicable
            'transport.add_driverprofile', 'transport.change_driverprofile', 'transport.view_driverprofile', 'transport.delete_driverprofile',
            'transport.add_route', 'transport.change_route', 'transport.view_route', 'transport.delete_route',
            'transport.add_pickuppoint', 'transport.change_pickuppoint', 'transport.view_pickuppoint', 'transport.delete_pickuppoint',
            'transport.add_transportallocation', 'transport.change_transportallocation', 'transport.view_transportallocation', 'transport.delete_transportallocation',
            'transport.add_triplog', 'transport.change_triplog', 'transport.view_triplog', 'transport.delete_triplog',
            'transport.add_transportattendance', 'transport.change_transportattendance', 'transport.view_transportattendance',
            'transport.add_vehiclemaintenance', 'transport.change_vehiclemaintenance', 'transport.view_vehiclemaintenance', 'transport.delete_vehiclemaintenance',
            'transport.add_fuelrecord', 'transport.change_fuelrecord', 'transport.view_fuelrecord', 'transport.delete_fuelrecord',
            'transport.add_transportincident', 'transport.change_transportincident', 'transport.view_transportincident', 'transport.delete_transportincident',

            # Students (FULL ACCESS)
            'students.add_student', 'students.change_student', 'students.view_student', 'students.delete_student',
            'students.add_parent', 'students.change_parent', 'students.view_parent', 'students.delete_parent',
            'students.add_studentadmission', 'students.change_studentadmission', 'students.view_studentadmission', 'students.delete_studentadmission',
            'students.add_studentdocument', 'students.change_studentdocument', 'students.view_studentdocument', 'students.delete_studentdocument',
            
            # Academics (FULL ACCESS)
            'academics.add_academicyear', 'academics.change_academicyear', 'academics.view_academicyear', 'academics.delete_academicyear',
            'academics.add_term', 'academics.change_term', 'academics.view_term', 'academics.delete_term',
            'academics.add_class', 'academics.change_class', 'academics.view_class', 'academics.delete_class',
            'academics.add_subject', 'academics.change_subject', 'academics.view_subject', 'academics.delete_subject',
            'academics.add_exam', 'academics.change_exam', 'academics.view_exam', 'academics.delete_exam',
            'academics.add_studentresult', 'academics.change_studentresult', 'academics.view_studentresult', 'academics.delete_studentresult',
            'academics.add_timetable', 'academics.change_timetable', 'academics.view_timetable', 'academics.delete_timetable',
            
            # Hostel (FULL ACCESS)
            'hostel.add_hostel', 'hostel.change_hostel', 'hostel.view_hostel', 'hostel.delete_hostel',
            'hostel.add_room', 'hostel.change_room', 'hostel.view_room', 'hostel.delete_room',
            'hostel.add_bed', 'hostel.change_bed', 'hostel.view_bed', 'hostel.delete_bed',
            'hostel.add_hostelallocation', 'hostel.change_hostelallocation', 'hostel.view_hostelallocation', 'hostel.delete_hostelallocation',
            
            # Staff (FULL ACCESS)
            'staff.add_staff', 'staff.change_staff', 'staff.view_staff', 'staff.delete_staff',

            # Library (FULL ACCESS)
            'library.add_book', 'library.change_book', 'library.view_book', 'library.delete_book',
            'library.add_booklending', 'library.change_booklending', 'library.view_booklending', 'library.delete_booklending',
        ],
        'REGISTRAR': [
            'sms.view_dashboard',
            'students.add_student', 'students.change_student', 'students.view_student',
            'students.add_parent', 'students.change_parent', 'students.view_parent',
            'students.add_studentadmission', 'students.view_studentadmission',
            'students.add_studentdocument', 'students.view_studentdocument',
            'academics.view_academics', 
            'sms.view_students', 'sms.view_parents', 'sms.view_hostel', 'sms.view_transport', 'sms.view_staff',
            'finance.view_invoice', 
            # Staff Management
            'staff.add_staff', 'staff.change_staff', 'staff.view_staff',
            # Hostel Allocation
            'hostel.add_hostelallocation', 'hostel.change_hostelallocation', 'hostel.view_hostelallocation',
            'hostel.view_hostel', 'hostel.view_room', 
            # Transport Allocation
            'transport.add_transportallocation', 'transport.change_transportallocation', 'transport.view_transportallocation',
            'transport.view_vehicle', 'transport.view_route', 'transport.view_pickuppoint', 
        ],
        'DOS': [
            'sms.view_dashboard',
            'academics.view_academics', 'sms.view_academics', 'sms.view_timetable',
            'sms.view_students', 'sms.view_parents', 'sms.view_staff', 'sms.view_library',
            # Full Academics Control
            'academics.add_academicyear', 'academics.change_academicyear', 'academics.view_academicyear',
            'academics.add_term', 'academics.change_term', 'academics.view_term',
            'academics.add_class', 'academics.change_class', 'academics.view_class',
            'academics.add_subject', 'academics.change_subject', 'academics.view_subject',
            'academics.add_exam', 'academics.change_exam', 'academics.view_exam',
            'academics.add_timetable', 'academics.change_timetable', 'academics.view_timetable',
            'academics.add_timetableslot', 'academics.change_timetableslot', 'academics.view_timetableslot',
            # Teacher-like stuff
            'academics.add_syllabuscoverage', 'academics.change_syllabuscoverage', 'academics.view_syllabuscoverage',
            'academics.add_studentresult', 'academics.change_studentresult', 'academics.view_studentresult',
            # Staff View
            'staff.view_staff',
            # Student View
            'students.view_student', 'students.view_parent',
        ],
        'TEACHER': [
            'sms.view_dashboard',
            'academics.view_academics', 'sms.view_academics', 'sms.view_timetable',
            'students.view_student', 'sms.view_students', # View List of students
            # Write Access
            'academics.add_syllabuscoverage', 'academics.change_syllabuscoverage', 'academics.view_syllabuscoverage',
            # Results (Backend restricts to own class)
            'academics.add_studentresult', 'academics.change_studentresult', 'academics.view_studentresult',
            'academics.add_attendance', 'academics.view_attendance',
        ],
        'ACCOUNTANT': [
            'sms.view_dashboard',
            # Full Finance Access
            'finance.add_invoice', 'finance.change_invoice', 'finance.view_invoice', 'finance.delete_invoice',
            'finance.add_payment', 'finance.change_payment', 'finance.view_payment', 'finance.delete_payment',
            'finance.add_expense', 'finance.change_expense', 'finance.view_expense', 'finance.delete_expense',
            'finance.add_feestructure', 'finance.change_feestructure', 'finance.view_feestructure', 'finance.delete_feestructure',
            
            'sms.view_finance',
            'students.view_student', # Need to see students to invoice them
        ],
        'LIBRARIAN': [
            'sms.view_dashboard',
            'library.add_book', 'library.change_book', 'library.view_book',
            'library.add_booklending', 'library.change_booklending', 'library.view_booklending',
            'sms.view_library',
            'students.view_student',
        ],
        'WARDEN': [
            'sms.view_dashboard',
            'hostel.add_hostel', 'hostel.view_hostel',
            'hostel.add_room', 'hostel.view_room',
            'hostel.add_hostelallocation', 'hostel.change_hostelallocation', 'hostel.view_hostelallocation',
            'sms.view_hostel',
            'sms.view_transport',
            'students.view_student',
            # Transport Access
            'transport.add_transportallocation', 'transport.change_transportallocation', 'transport.view_transportallocation',
            'transport.view_vehicle', 'transport.view_route', 'transport.view_pickuppoint',
        ],
        'NURSE': [
            'sms.view_dashboard',
            'medical.add_medicalrecord', 'medical.change_medicalrecord', 'medical.view_medicalrecord',
            'sms.view_medical',
            'students.view_student',
        ],
        'STUDENT': [
             'sms.view_dashboard',
             # Add specific student perms if needed
        ]
    }

    # 2. Apply Permissions to Groups
    for role, perms_list in role_perms.items():
        group, _ = Group.objects.get_or_create(name=role)
        print(f"Processing Group: {role}")
        
        if perms_list == 'ALL':
             # Admin gets everything, typically handle via is_superuser, but for explicit groups:
             # Just giving basic app perms or leaving empty implies checking is_staff/is_superuser
             # for now, let's give Admin specific critical perms just in case
             pass 
        else:
            # Clear existing to enforce strict rules
            group.permissions.clear()
            
            for perm_str in perms_list:
                try:
                    app_label, codename = perm_str.split('.')
                    # Handle special 'sms' app label if it's not a real model perm
                    # For standard models:
                    if app_label in ['students', 'academics', 'finance', 'library', 'hostel', 'medical', 'transport', 'staff', 'timetable', 'sms']:
                         p = Permission.objects.filter(content_type__app_label=app_label, codename=codename).first()
                         if p:
                             group.permissions.add(p)
                         else:
                             # Create Custom Permission on the fly (attached to User model as generic placeholder OR ContentType of the specific app)
                             try:
                                 # Find a content type to attach to. For 'sms' perms, attach to User or a generic ContentType
                                 if app_label == 'sms':
                                     ct = ContentType.objects.get_for_model(User)
                                 else:
                                     # Try to get CT for the app
                                     ct = ContentType.objects.filter(app_label=app_label).first()
                                     if not ct:
                                         ct = ContentType.objects.get_for_model(User) # Fallback
                                 
                                 p, created = Permission.objects.get_or_create(
                                     codename=codename,
                                     content_type=ct,
                                     defaults={'name': f'Can {codename.replace("_", " ")}'}
                                 )
                                 group.permissions.add(p)
                                 print(f"  Created & Assigned custom perm: {perm_str}")
                             except Exception as e:
                                 print(f"  Failed to create custom perm {perm_str}: {e}")
                             
                    # Handle Custom Frontend Perms (created via ContentType logic usually, or just assume they exist if created manually)
                    # For now, we rely on standard model permissions mostly.
                    # If 'sms.view_dashboard' is a custom permission, we need to ensure it exists.
                except ValueError:
                    print(f"  Invalid perm format: {perm_str}")

            print(f"  assigned {group.permissions.count()} permissions.")


    # 3. Create Registrar User
    try:
        if not User.objects.filter(username='registra').exists():
            User.objects.create_user(
                username='registra',
                email='registrar@school.com',
                password='password123',
                role='REGISTRAR',
                is_staff=True
            )
            print("Created Default Registrar User: 'registra' (password123)")
        else:
            # Updates role if exists
            u = User.objects.get(username='registra')
            u.role = 'REGISTRAR'
            u.is_staff = True
            u.save()
            print("Updated existing 'registra' user.")
            
    except Exception as e:
        print(f"Error creating registrar: {e}")

    print("--- RBAC Enforcement Complete ---")

if __name__ == '__main__':
    setup_rbac()

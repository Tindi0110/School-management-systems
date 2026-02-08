"""
Script to create test data for the School Management System
Run this with: python create_test_data.py
"""

import os
import django
import sys

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model
from students.models import Student
from staff.models import Staff
from academics.models import Class, Subject
from finance.models import FeeStructure, StudentFeeRecord, Payment
from hostel.models import (
    Hostel, Room, Bed, HostelAllocation, HostelAttendance, 
    HostelAsset, HostelMaintenance
)
from library.models import Book, BookCopy, BookLending, LibraryFine
from medical.models import MedicalRecord
from transport.models import (
    Vehicle, Route, PickupPoint, TransportAllocation, 
    TripLog, DriverProfile
)
from datetime import date, timedelta
from decimal import Decimal

User = get_user_model()

def create_test_data():
    print("Creating test data...")
    
    # Create admin user
    admin, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@school.com',
            'role': 'ADMIN',
            'first_name': 'Admin',
            'last_name': 'User',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin.set_password('admin123')
        admin.save()
        print("[OK] Created admin user (username: admin, password: admin123)")
    
    # Create teacher user
    teacher_user, created = User.objects.get_or_create(
        username='teacher1',
        defaults={
            'email': 'teacher@school.com',
            'role': 'TEACHER',
            'first_name': 'John',
            'last_name': 'Doe'
        }
    )
    if created:
        teacher_user.set_password('teacher123')
        teacher_user.save()
        print("[OK] Created teacher user")
    
    # Create subjects
    subjects_data = [
        {'name': 'Mathematics', 'code': 'MATH101'},
        {'name': 'English', 'code': 'ENG101'},
        {'name': 'Kiswahili', 'code': 'KIS101'},
        {'name': 'Science', 'code': 'SCI101'},
        {'name': 'History', 'code': 'HIS101'},
    ]
    
    subjects = []
    for subj_data in subjects_data:
        subj, created = Subject.objects.get_or_create(**subj_data)
        subjects.append(subj)
    print(f"[OK] Created {len(subjects)} subjects")
    
    # Create classes
    classes_data = [
        {'name': 'Form 1', 'stream': 'North', 'year': 2026, 'class_teacher': teacher_user},
        {'name': 'Form 1', 'stream': 'South', 'year': 2026, 'class_teacher': teacher_user},
        {'name': 'Form 2', 'stream': 'North', 'year': 2026, 'class_teacher': teacher_user},
    ]
    
    classes = []
    for cls_data in classes_data:
        cls, created = Class.objects.get_or_create(
            name=cls_data['name'],
            stream=cls_data['stream'],
            year=cls_data['year'],
            defaults={'class_teacher': cls_data['class_teacher']}
        )
        if created:
            cls.subjects.set(subjects)
        classes.append(cls)
    print(f"[OK] Created {len(classes)} classes")
    
    # Create students
    students_data = [
        {'admission_number': 'STD001', 'full_name': 'Alice Wanjiku', 'gender': 'F', 'date_of_birth': date(2010, 5, 15), 'current_class': classes[0], 'guardian_name': 'Mary Wanjiku', 'guardian_phone': '+254712345678'},
        {'admission_number': 'STD002', 'full_name': 'Brian Omondi', 'gender': 'M', 'date_of_birth': date(2010, 8, 22), 'current_class': classes[0], 'guardian_name': 'Peter Omondi', 'guardian_phone': '+254723456789'},
        {'admission_number': 'STD003', 'full_name': 'Catherine Njeri', 'gender': 'F', 'date_of_birth': date(2010, 3, 10), 'current_class': classes[1], 'guardian_name': 'Jane Njeri', 'guardian_phone': '+254734567890'},
        {'admission_number': 'STD004', 'full_name': 'David Kamau', 'gender': 'M', 'date_of_birth': date(2009, 11, 5), 'current_class': classes[2], 'guardian_name': 'John Kamau', 'guardian_phone': '+254745678901'},
        {'admission_number': 'STD005', 'full_name': 'Emma Akinyi', 'gender': 'F', 'date_of_birth': date(2010, 1, 18), 'current_class': classes[2], 'guardian_name': 'Grace Akinyi', 'guardian_phone': '+254756789012'},
    ]
    
    students = []
    for std_data in students_data:
        student, created = Student.objects.get_or_create(
            admission_number=std_data['admission_number'],
            defaults=std_data
        )
        students.append(student)
    print(f"[OK] Created {len(students)} students")
    
    # Create fee structures
    for cls in classes:
        FeeStructure.objects.get_or_create(
            current_class=cls,
            term=1,
            year=2026,
            defaults={
                'name': f'{cls.name} {cls.stream} Term 1 Fees',
                'total_amount': Decimal('50000.00'),
                'is_active': True
            }
        )
    print("[OK] Created fee structures")
    
    # Create fee records for students
    for student in students:
        StudentFeeRecord.objects.get_or_create(
            student=student,
            defaults={
                'total_billed': Decimal('50000.00'),
                'total_paid': Decimal('30000.00'),
                'balance': Decimal('20000.00')
            }
        )
    print("[OK] Created fee records")
    
    # Create hostels
    hostels_data = [
        {'name': 'Boys Hostel A', 'gender_allowed': 'M', 'hostel_type': 'BOARDING', 'capacity': 100},
        {'name': 'Girls Hostel A', 'gender_allowed': 'F', 'hostel_type': 'BOARDING', 'capacity': 100},
    ]
    
    hostels = []
    for hostel_data in hostels_data:
        hostel, created = Hostel.objects.get_or_create(**hostel_data)
        hostels.append(hostel)
    print(f"[OK] Created {len(hostels)} hostels")
    
    # Create rooms & Beds
    for hostel in hostels:
        for i in range(1, 6):
            room, created = Room.objects.get_or_create(
                hostel=hostel,
                room_number=f'{i:02d}',
                defaults={'capacity': 4, 'room_type': 'DORM', 'floor': 'Ground', 'status': 'AVAILABLE'}
            )
            if created:
                for b_idx in range(1, 5):
                    Bed.objects.create(room=room, bed_number=f'B{b_idx}', status='AVAILABLE')
    print("[OK] Created hostel rooms and beds")
    
    # Create books & Copies
    books_data = [
        {'title': 'Things Fall Apart', 'author': 'Chinua Achebe', 'isbn': '978-0385474542', 'category': 'Literature', 'publisher': 'Heinemann'},
        {'title': 'The River and the Source', 'author': 'Margaret Ogola', 'isbn': '978-9966468109', 'category': 'Literature', 'publisher': 'Focus Publishers'},
        {'title': 'Blossoms of the Savannah', 'author': 'Henry Ole Kulet', 'isbn': '978-9966251701', 'category': 'Literature', 'publisher': 'Longhorn'},
    ]
    
    books = []
    for book_data in books_data:
        book, created = Book.objects.get_or_create(
            isbn=book_data['isbn'],
            defaults=book_data
        )
        if created:
            for c_idx in range(1, 6):
                BookCopy.objects.create(
                    book=book, 
                    copy_number=f'C{c_idx:03d}', 
                    barcode=f'BC-{book.isbn}-{c_idx}',
                    status='AVAILABLE',
                    condition='New'
                )
        books.append(book)
    print(f"[OK] Created {len(books)} books with 5 copies each")
    
    # Create vehicles
    vehicles_data = [
        {'registration_number': 'KCB 123A', 'seating_capacity': 50, 'vehicle_type': 'BUS', 'make_model': 'Isuzu FRR'},
        {'registration_number': 'KCD 456B', 'seating_capacity': 33, 'vehicle_type': 'MINIBUS', 'make_model': 'Toyota Coaster'},
    ]
    
    vehicles = []
    for v_data in vehicles_data:
        vehicle, created = Vehicle.objects.get_or_create(
            registration_number=v_data['registration_number'],
            defaults=v_data
        )
        vehicles.append(vehicle)
    print(f"[OK] Created {len(vehicles)} vehicles")

    # Create Drivers (linked to staff)
    staff_member = Staff.objects.first()
    if staff_member:
        DriverProfile.objects.get_or_create(
            staff=staff_member,
            license_number='DL-998877',
            license_expiry=date(2030, 1, 1),
            assigned_vehicle=vehicles[0]
        )
        print(f"[OK] Assigned {staff_member.full_name} as Driver")
    
    # Create routes & PickupPoints
    routes_data = [
        {'name': 'Route 01 - East Side', 'route_code': 'R01', 'distance_km': 15.5, 'base_cost': Decimal('5000.00')},
        {'name': 'Route 02 - West Side', 'route_code': 'R02', 'distance_km': 12.0, 'base_cost': Decimal('4500.00')},
    ]
    
    routes = []
    for r_data in routes_data:
        route, created = Route.objects.get_or_create(
            route_code=r_data['route_code'],
            defaults=r_data
        )
        if created:
            # Add some pickup points
            PickupPoint.objects.create(
                route=route, point_name="Central Station", 
                pickup_time="06:30", dropoff_time="17:30"
            )
            PickupPoint.objects.create(
                route=route, point_name="Market Square", 
                pickup_time="06:45", dropoff_time="17:15"
            )
        routes.append(route)
    print(f"[OK] Created {len(routes)} routes with pickup points")
    
    print("\n[SUCCESS] Test data created successfully!")
    print("\nLogin credentials:")
    print("  Admin - username: admin, password: admin123")
    print("  Teacher - username: teacher1, password: teacher123")

if __name__ == '__main__':
    create_test_data()

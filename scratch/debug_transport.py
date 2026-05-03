import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from transport.models import TransportAllocation, Route, PickupPoint
from students.models import Student
from django.contrib.auth import get_user_model

def debug_enrollment():
    print("--- Debugging Transport Enrollment ---")
    
    student = Student.objects.first()
    route = Route.objects.first()
    point = PickupPoint.objects.filter(route=route).first()
    
    if not student or not route:
        print("Missing student or route for test.")
        return

    print(f"Testing with Student: {student.full_name}, Route: {route.name}")
    
    # Check if student is already enrolled
    existing = TransportAllocation.objects.filter(student=student).first()
    if existing:
        print(f"Student is already enrolled in {existing.route.name}. Enrollment ID: {existing.id}")
        # Try to enroll again (should fail)
        print("Attempting duplicate enrollment...")
        try:
            TransportAllocation.objects.create(
                student=student,
                route=route,
                pickup_point=point
            )
            print("SUCCESS (Wait, it should have failed due to OneToOneField!)")
        except Exception as e:
            print(f"CAUGHT EXPECTED ERROR: {e}")
    else:
        print("Student not enrolled. Attempting enrollment...")
        try:
            alloc = TransportAllocation.objects.create(
                student=student,
                route=route,
                pickup_point=point
            )
            print(f"SUCCESS: Enrollment ID {alloc.id}")
        except Exception as e:
            print(f"FAILURE: {e}")

if __name__ == "__main__":
    debug_enrollment()

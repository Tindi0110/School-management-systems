from django.core.management.base import BaseCommand
from students.models import Student, Parent
from hostel.models import Bed, HostelAllocation, Room
from django.db import transaction

class Command(BaseCommand):
    help = 'Syncs missing Parent profiles and Hostel Allocations for existing students'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting Data Sync...")
        
        # 1. Sync Parents
        students_without_parents = Student.objects.filter(parents__isnull=True).exclude(guardian_name='')
        self.stdout.write(f"Found {students_without_parents.count()} students with missing Parent profiles.")
        
        for student in students_without_parents:
            self.stdout.write(f"  - Creating parent for {student.full_name}...")
            parent = Parent.objects.create(
                full_name=student.guardian_name,
                phone=student.guardian_phone or 'N/A',
                relationship='GUARDIAN'
            )
            student.parents.add(parent)
            
        # 2. Sync Hostel Allocations
        boarding_students = Student.objects.filter(category='BOARDING', hostel_allocation__isnull=True)
        self.stdout.write(f"Found {boarding_students.count()} BOARDING students without rooms.")
        
        for student in boarding_students:
            self.stdout.write(f"  - Allocating room for {student.full_name} ({student.gender})...")
            
            # Find appropriate bed
            # Filter beds where Room's Hostel matches student gender (or is MIXED)
            # AND Bed is AVAILABLE
            available_bed = Bed.objects.filter(
                status='AVAILABLE',
                room__hostel__gender_allowed__in=[student.gender, 'MIXED'],
                room__status='AVAILABLE'
            ).first()
            
            if available_bed:
                HostelAllocation.objects.create(
                    student=student,
                    bed=available_bed,
                    room=available_bed.room,
                    status='ACTIVE'
                )
                # Mark bed as occupied
                available_bed.status = 'OCCUPIED'
                available_bed.save()
                
                # Update room occupancy
                room = available_bed.room
                room.current_occupancy += 1
                if room.current_occupancy >= room.capacity:
                    room.status = 'FULL'
                room.save()
                
                self.stdout.write(self.style.SUCCESS(f"    -> Assigned to {available_bed}"))
            else:
                self.stdout.write(self.style.WARNING(f"    -> NO BED FOUND for {student.full_name}"))

        self.stdout.write(self.style.SUCCESS("Sync Complete!"))

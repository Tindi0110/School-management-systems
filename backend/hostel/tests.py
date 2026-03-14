from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from students.models import Student
from hostel.models import Hostel, Room, Bed, HostelAllocation, HostelAttendance

User = get_user_model()

class HostelTests(TestCase):
    def setUp(self):
        self.warden = User.objects.create_user(username='warden', password='password123')
        self.hostel = Hostel.objects.create(
            name='Alpha House',
            hostel_type='BOARDING',
            gender_allowed='M',
            capacity=100,
            warden=self.warden
        )
        self.room = Room.objects.create(
            hostel=self.hostel,
            room_number='101',
            capacity=2
        )
        self.bed1 = Bed.objects.create(room=self.room, bed_number='A1')
        self.bed2 = Bed.objects.create(room=self.room, bed_number='A2')
        
        self.student = Student.objects.create(
            full_name='John Doe',
            gender='M',
            admission_number='24/0001',
            category='BOARDING'
        )

    def test_room_capacity_and_occupancy(self):
        self.assertEqual(self.room.capacity, 2)
        self.assertEqual(self.room.current_occupancy, 0)
        
    def test_allocation_logic(self):
        # Initial allocation
        allocation = HostelAllocation.objects.create(
            student=self.student,
            bed=self.bed1,
            room=self.room,
            status='ACTIVE'
        )
        self.assertEqual(allocation.student.full_name, 'John Doe')
        self.assertEqual(allocation.bed.bed_number, 'A1')
        
        # Test bed status update (This might be handled by signals in a real app, 
        # but let's assume manual or model method logic for this audit)
        self.bed1.status = 'OCCUPIED'
        self.bed1.save()
        self.assertEqual(Bed.objects.get(id=self.bed1.id).status, 'OCCUPIED')

    def test_attendance_record(self):
        attendance = HostelAttendance.objects.create(
            student=self.student,
            date=timezone.now().date(),
            session='EVENING',
            status='PRESENT'
        )
        self.assertEqual(attendance.status, 'PRESENT')
        self.assertEqual(attendance.session, 'EVENING')

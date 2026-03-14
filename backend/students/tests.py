from django.test import TestCase
from django.core.exceptions import ValidationError
from academics.models import AcademicYear, Class
from accounts.models import User
from .models import Student, Parent
import datetime

class StudentModelTest(TestCase):
    def setUp(self):
        self.year = AcademicYear.objects.create(name="2026", is_active=True)
        self.cls = Class.objects.create(name="Form 1", level="1")

    def test_admission_number_generation(self):
        """Test that admission numbers are generated in the format YY/XXXX"""
        student = Student.objects.create(
            full_name="John Doe",
            gender="M",
            date_of_birth=datetime.date(2010, 1, 1),
            current_class=self.cls
        )
        # 2026 -> 26/0001
        self.assertEqual(student.admission_number, "26/0001")

        student2 = Student.objects.create(
            full_name="Jane Doe",
            gender="F",
            date_of_birth=datetime.date(2011, 2, 2),
            current_class=self.cls
        )
        self.assertEqual(student2.admission_number, "26/0002")

class ParentModelTest(TestCase):
    def setUp(self):
        self.parent = Parent.objects.create(
            full_name="Peter Parent",
            relationship="FATHER",
            phone="0712345678"
        )
        self.year = AcademicYear.objects.create(name="2026", is_active=True)
        self.cls = Class.objects.create(name="Form 1", level="1")
        self.student = Student.objects.create(
            full_name="Junior Peter",
            gender="M",
            date_of_birth=datetime.date(2015, 1, 1),
            current_class=self.cls
        )
        self.student.parents.add(self.parent)

    def test_parent_deletion_constraint(self):
        """Test that a parent cannot be deleted if linked to a student"""
        with self.assertRaises(ValidationError):
            self.parent.delete()
        
        self.assertEqual(Parent.objects.count(), 1)

    def test_parent_deletion_after_unlink(self):
        """Test that a parent can be deleted after being unlinked from students"""
        self.student.parents.remove(self.parent)
        self.parent.delete()
        self.assertEqual(Parent.objects.count(), 0)

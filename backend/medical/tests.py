from django.test import TestCase
from django.utils import timezone
from students.models import Student
from medical.models import MedicalRecord

class MedicalTests(TestCase):
    def setUp(self):
        self.student = Student.objects.create(
            full_name='Jane Doe',
            gender='F',
            admission_number='24/0002'
        )

    def test_medical_record_linking(self):
        record = MedicalRecord.objects.create(
            student=self.student,
            diagnosis='Fever',
            treatment_given='Paracetamol'
        )
        self.assertEqual(record.student.full_name, 'Jane Doe')
        self.assertEqual(self.student.medical_records.count(), 1)
        self.assertEqual(record.diagnosis, 'Fever')

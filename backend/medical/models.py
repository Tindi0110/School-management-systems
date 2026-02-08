from django.db import models

class MedicalRecord(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='medical_records')
    date = models.DateTimeField(auto_now_add=True)
    nurse = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True)
    diagnosis = models.CharField(max_length=255)
    treatment_given = models.TextField()
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.student} - {self.diagnosis}"

from django.db import models

class TimetableSlot(models.Model):
    DAYS = (
        ('MON', 'Monday'), ('TUE', 'Tuesday'), ('WED', 'Wednesday'),
        ('THU', 'Thursday'), ('FRI', 'Friday'), ('SAT', 'Saturday')
    )
    
    class_assigned = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='timetable_slots')
    day = models.CharField(max_length=3, choices=DAYS)
    start_time = models.TimeField()
    end_time = models.TimeField()
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE)
    teacher = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['day', 'start_time']

    def __str__(self):
        return f"{self.class_assigned} - {self.day} {self.start_time}"

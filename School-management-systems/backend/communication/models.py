from django.db import models
from django.conf import settings

class Notification(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='sent_notifications')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=100)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"To {self.recipient}: {self.title}"

class SystemAlert(models.Model):
    SEVERITY_CHOICES = (('INFO', 'Info'), ('WARNING', 'Warning'), ('CRITICAL', 'Critical'), ('SUCCESS', 'Success'))
    title = models.CharField(max_length=100)
    message = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='INFO')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self): return self.title

class SchoolEvent(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    location = models.CharField(max_length=100, blank=True)
    event_type = models.CharField(max_length=50, default='GENERAL') # Academic, Sports, Holiday
    
    def __str__(self): return f"{self.title} on {self.date}"

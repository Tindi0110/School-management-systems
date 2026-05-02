from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import MedicalRecord
from students.models import HealthRecord

@receiver(post_save, sender=MedicalRecord)
def sync_vitals_to_health_record(sender, instance, created, **kwargs):
    """
    When a medical record is saved (e.g. from infirmary visit),
    auto-update the student's main HealthRecord vitals if they are provided.
    """
    if kwargs.get('raw'):
        return

    student = instance.student
    
    # Get or create the HealthRecord for the student
    health_record, _ = HealthRecord.objects.get_or_create(
        student=student,
        defaults={
            'emergency_contact_name': 'Pending',
            'emergency_contact_phone': 'Pending'
        }
    )

    # Update vitals only if they are provided in the medical visit
    updated_fields = []
    
    if instance.height:
        health_record.height = instance.height
        updated_fields.append('height')
        
    if instance.weight:
        health_record.weight = instance.weight
        updated_fields.append('weight')
        
    if instance.temperature:
        health_record.temperature = instance.temperature
        updated_fields.append('temperature')
        
    if instance.blood_pressure:
        health_record.blood_pressure = instance.blood_pressure
        updated_fields.append('blood_pressure')

    if updated_fields:
        health_record.save(update_fields=updated_fields)

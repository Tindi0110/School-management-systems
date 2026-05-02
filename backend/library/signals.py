from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import LibraryFine
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=LibraryFine)
def auto_sync_fine_to_finance(sender, instance, created, **kwargs):
    """
    Ensures LibraryFine is always synced to Finance regardless of how it was created.
    """
    if instance.status == 'PENDING' and not instance.adjustment:
        from .views import sync_fine_to_finance
        # We need a user to 'approve' the adjustment. 
        # For auto-generated fines, we can use a system user or the librarian who processed it.
        # Since we don't have request context here, we might need to handle this carefully.
        # But for now, we'll try to find an admin or leave as None if the model allows.
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        system_user = User.objects.filter(is_superuser=True).first()
        
        success, msg = sync_fine_to_finance(instance, system_user)
        if success:
            logger.info(f"Auto-synced fine {instance.id} to Finance.")
        else:
            logger.error(f"Failed to auto-sync fine {instance.id}: {msg}")

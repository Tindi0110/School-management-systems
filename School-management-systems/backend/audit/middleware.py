import json
import logging
from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog

logger = logging.getLogger('django')

class AuditMiddleware(MiddlewareMixin):
    """
    Middleware to automatically log all mutations (POST, PUT, PATCH, DELETE)
    to the AuditLog model.
    """
    def process_response(self, request, response):
        # Only log mutations and successful/safe-ish responses (exclude 401/403 often as they aren't data changes)
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            if response.status_code < 400 or response.status_code == 400: # Log 400s as they represent attempted changes
                try:
                    user = request.user if request.user.is_authenticated else None
                    
                    # Extract entity from path (e.g., /api/students/ -> Students)
                    path_parts = request.path.strip('/').split('/')
                    entity = path_parts[1].capitalize() if len(path_parts) > 1 else "Unknown"
                    
                    action = request.method
                    ip_address = self.get_client_ip(request)
                    path = request.path

                    # Perform the creation in a background thread
                    import threading
                    def log_change():
                        try:
                            AuditLog.objects.create(
                                user=user,
                                action=action,
                                entity=entity,
                                details=f"Path: {path}",
                                ip_address=ip_address
                            )
                        except Exception as e:
                            logger.error(f"Async Audit Logging Error: {str(e)}")

                    threading.Thread(target=log_change, daemon=True).start()
                except Exception as e:
                    logger.error(f"AuditMiddleware Setup Error: {str(e)}")
        
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

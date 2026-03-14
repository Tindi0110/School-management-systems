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
                    
                    # details = {}
                    # if request.body:
                    #     try:
                    #         details = json.loads(request.body)
                    #     except:
                    #         details = {"error": "Could not parse request body"}
                    
                    AuditLog.objects.create(
                        user=user,
                        action=action,
                        entity=entity,
                        details=f"Path: {request.path}", # Keep it simple for now to avoid large blobs
                        ip_address=self.get_client_ip(request)
                    )
                except Exception as e:
                    logger.error(f"AuditMiddleware Login Error: {str(e)}")
        
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

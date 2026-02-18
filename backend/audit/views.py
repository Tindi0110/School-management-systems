from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.utils import timezone
import os

from rest_framework.permissions import IsAuthenticated, IsAdminUser

class HealthCheckView(APIView):
    """
    API endpoint that returns the health status of the system.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from accounts.models import User
        from students.models import Student
        from staff.models import Staff
        from academics.models import Class
        
        health_data = {
            "status": "healthy",
            "timestamp": timezone.now(),
            "services": {
                "backend": {
                    "status": "up",
                    "environment": "production" if not os.environ.get('DEBUG', 'True') == 'True' else "development",
                    "version": "1.1.0"
                },
                "database": {
                    "status": "unknown",
                    "stats": {}
                }
            }
        }
        
        # Check database connection and get some stats
        try:
            connection.ensure_connection()
            health_data["services"]["database"]["status"] = "connected"
            health_data["services"]["database"]["stats"] = {
                "users": User.objects.count(),
                "students": Student.objects.count(),
                "staff": Staff.objects.count(),
                "classes": Class.objects.count()
            }
        except Exception as e:
            health_data["services"]["database"]["status"] = "error"
            health_data["services"]["database"]["message"] = str(e)
            health_data["status"] = "degraded"
            
        return Response(health_data, status=status.HTTP_200_OK)

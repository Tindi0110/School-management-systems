from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.utils import timezone
import os

class HealthCheckView(APIView):
    """
    API endpoint that returns the health status of the system.
    """
    def get(self, request):
        health_data = {
            "status": "healthy",
            "timestamp": timezone.now(),
            "services": {
                "backend": {
                    "status": "up",
                    "environment": "production" if not os.environ.get('DEBUG', 'True') == 'True' else "development"
                },
                "database": {
                    "status": "unknown"
                }
            }
        }
        
        # Check database connection
        try:
            connection.ensure_connection()
            health_data["services"]["database"]["status"] = "connected"
        except Exception as e:
            health_data["services"]["database"]["status"] = "error"
            health_data["services"]["database"]["message"] = str(e)
            health_data["status"] = "degraded"
            
        return Response(health_data, status=status.HTTP_200_OK if health_data["status"] == "healthy" else status.HTTP_200_OK) # Always return 200 for health checks usually, or 503 if down. For now 200.

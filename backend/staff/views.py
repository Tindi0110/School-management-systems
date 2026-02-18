from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Staff
from .serializers import StaffSerializer

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.select_related('user', 'department', 'current_class').all()
    serializer_class = StaffSerializer
    permission_classes = [IsAuthenticated]

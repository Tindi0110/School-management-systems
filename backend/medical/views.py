from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import MedicalRecord
from .serializers import MedicalRecordSerializer

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Try to find the staff profile of the logged in user
        staff_profile = getattr(self.request.user, 'staff_profile', None)
        if staff_profile:
            serializer.save(nurse=staff_profile)
        else:
            serializer.save()

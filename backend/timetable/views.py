from rest_framework import viewsets, permissions
from .models import TimetableSlot
from .serializers import TimetableSlotSerializer

class TimetableSlotViewSet(viewsets.ModelViewSet):
    queryset = TimetableSlot.objects.all().select_related('class_assigned', 'subject', 'teacher')
    serializer_class = TimetableSlotSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['class_assigned']

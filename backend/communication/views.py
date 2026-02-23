from rest_framework import viewsets, permissions
from .models import Notification, SystemAlert, SchoolEvent
from .serializers import NotificationSerializer, SystemAlertSerializer, SchoolEventSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(recipient=self.request.user)

class SystemAlertViewSet(viewsets.ModelViewSet):
    queryset = SystemAlert.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = SystemAlertSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class SchoolEventViewSet(viewsets.ModelViewSet):
    queryset = SchoolEvent.objects.order_by('date')
    serializer_class = SchoolEventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['event_type']

    def get_queryset(self):
        qs = super().get_queryset()
        start_date = self.request.query_params.get('start_date')
        if start_date:
            qs = qs.filter(date__gte=start_date)
        return qs

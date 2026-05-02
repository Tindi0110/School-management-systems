from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification, SystemAlert, SchoolEvent
from .serializers import NotificationSerializer, SystemAlertSerializer, SchoolEventSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(recipient=self.request.user).order_by('-timestamp')

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'notifications marked as read'}, status=status.HTTP_200_OK)

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

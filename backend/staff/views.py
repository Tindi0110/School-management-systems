from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from .models import Staff
from .serializers import StaffSerializer

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.select_related('user').all()
    serializer_class = StaffSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'user__role']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'user__role', 'department']

    @action(detail=False, methods=['post'])
    def sync_staff(self, request):
        """
        Creates Staff profiles for all Users with staff roles if they don't exist.
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()
        staff_roles = ['ADMIN', 'PRINCIPAL', 'DEPUTY', 'DOS', 'REGISTRAR', 'TEACHER', 'WARDEN', 'NURSE', 'ACCOUNTANT', 'LIBRARIAN', 'DRIVER']
        
        users_without_profile = User.objects.filter(role__in=staff_roles).exclude(staff_profile__isnull=False)
        created_count = 0
        for user in users_without_profile:
            Staff.objects.create(
                user=user,
                employee_id=user.username,
                date_joined=user.date_joined.date()
            )
            created_count += 1
            
        return Response({"detail": f"Successfully synced {created_count} staff members."}, status=status.HTTP_200_OK)

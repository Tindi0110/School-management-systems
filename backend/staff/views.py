from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from .models import Staff, Department
from .serializers import StaffSerializer, DepartmentSerializer

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.select_related('user').all()
    serializer_class = StaffSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'user__role']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'user__role', 'department']

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response(
                {"detail": "Only System Admins can delete staff members."},
                status=status.HTTP_403_FORBIDDEN
            )
        instance = self.get_object()
        user = instance.user
        response = super().destroy(request, *args, **kwargs)
        if user:
            user.delete() # Persistent deletion — removes User record so sync_staff won't bring it back
        return response

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
        errors = []
        
        for user in users_without_profile:
            try:
                Staff.objects.create(
                    user=user,
                    employee_id=f"EMP-{user.id:04d}", # Consistent with signal logic
                    date_joined=user.date_joined.date()
                )
                created_count += 1
            except Exception as e:
                errors.append(f"{user.email}: {str(e)}")
        
        if errors:
            return Response({
                "detail": f"Synced {created_count} members, but {len(errors)} failed.",
                "errors": errors
            }, status=status.HTTP_207_MULTI_STATUS)
            
        return Response({"detail": f"Successfully synced {created_count} staff members."}, status=status.HTTP_200_OK)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

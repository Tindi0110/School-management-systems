from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, OuterRef, Subquery, F, Value
from django.db.models.functions import Concat
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Vehicle, Route, PickupPoint, TransportAllocation, 
    TripLog, TransportAttendance, VehicleMaintenance, 
    FuelRecord, TransportIncident, DriverProfile, TransportConfig
)
from .serializers import (
    VehicleSerializer, RouteSerializer, PickupPointSerializer, 
    TransportAllocationSerializer, TripLogSerializer, 
    TransportAttendanceSerializer, VehicleMaintenanceSerializer, 
    FuelRecordSerializer, TransportIncidentSerializer, 
    DriverProfileSerializer, TransportConfigSerializer
)

class TransportConfigViewSet(viewsets.ModelViewSet):
    queryset = TransportConfig.objects.all()
    serializer_class = TransportConfigSerializer
    permission_classes = [IsAuthenticated]

class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'vehicle_type', 'current_condition']
    search_fields = ['registration_number', 'make_model', 'logbook_number']
    ordering_fields = ['registration_number', 'seating_capacity', 'insurance_expiry']

    def get_queryset(self):
        # Annotate with the full name of the assigned driver to avoid N+1 in serializer
        driver_name_subquery = DriverProfile.objects.filter(
            assigned_vehicle=OuterRef('pk')
        ).annotate(
            full_name=Concat('staff__user__first_name', Value(' '), 'staff__user__last_name')
        ).values('full_name')[:1]
        
        return Vehicle.objects.annotate(
            assigned_driver_name_annotated=Subquery(driver_name_subquery)
        ).all()

    @action(detail=True, methods=['get'])
    def maintenance_history(self, request, pk=None):
        vehicle = self.get_object()
        logs = vehicle.maintenance_logs.all().order_by('-service_date')
        serializer = VehicleMaintenanceSerializer(logs, many=True)
        return Response(serializer.data)

class DriverProfileViewSet(viewsets.ModelViewSet):
    queryset = DriverProfile.objects.select_related('staff__user', 'assigned_vehicle').all()
    serializer_class = DriverProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['assigned_vehicle']
    search_fields = ['staff__user__first_name', 'staff__user__last_name', 'license_number']

class RouteViewSet(viewsets.ModelViewSet):
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'route_code']
    ordering_fields = ['name', 'distance_km', 'base_cost']

    def get_queryset(self):
        return Route.objects.prefetch_related('pickup_points').annotate(
            occupancy_count=Count('allocations', filter=Q(allocations__status='ACTIVE'))
        ).all()

class PickupPointViewSet(viewsets.ModelViewSet):
    queryset = PickupPoint.objects.select_related('route').all()
    serializer_class = PickupPointSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['route']
    search_fields = ['point_name']

class TransportAllocationViewSet(viewsets.ModelViewSet):
    queryset = TransportAllocation.objects.select_related('student', 'route', 'pickup_point').all()
    serializer_class = TransportAllocationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['route', 'pickup_point', 'status', 'student']
    search_fields = ['student__full_name', 'student__admission_number', 'seat_number']
    ordering_fields = ['start_date', 'student__full_name']

    def perform_create(self, serializer):
        # Logic to check route capacity before allocation
        route = serializer.validated_data['route']
        active_allocations = TransportAllocation.objects.filter(route=route, status='ACTIVE').count()
        
        # Cross reference with vehicle capacity assigned to this route if applicable
        # (Simplified: check against route_capacity if added to model, or just allow and report)
        serializer.save()

class TripLogViewSet(viewsets.ModelViewSet):
    queryset = TripLog.objects.select_related('vehicle', 'route', 'driver__staff__user').prefetch_related('attendance__student').all()
    serializer_class = TripLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['vehicle', 'route', 'trip_type', 'date', 'status']
    search_fields = ['attendant', 'vehicle__registration_number', 'route__name']
    ordering_fields = ['date', 'trip_type', 'departure_time']
    ordering = ['-date']

    @action(detail=True, methods=['post'])
    def mark_attendance(self, request, pk=None):
        trip = self.get_object()
        student_id = request.data.get('student_id')
        is_present = request.data.get('is_present', True)
        
        attendance, created = TransportAttendance.objects.update_or_create(
            trip=trip, student_id=student_id,
            defaults={'is_present': is_present}
        )
        return Response({'status': 'attendance updated'})

class TransportAttendanceViewSet(viewsets.ModelViewSet):
    queryset = TransportAttendance.objects.select_related('student', 'trip').all()
    serializer_class = TransportAttendanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['trip', 'student', 'is_present']
    search_fields = ['student__full_name', 'student__admission_number']

class VehicleMaintenanceViewSet(viewsets.ModelViewSet):
    queryset = VehicleMaintenance.objects.select_related('vehicle').all()
    serializer_class = VehicleMaintenanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['vehicle', 'status']
    search_fields = ['description', 'performed_by', 'vehicle__registration_number']
    ordering_fields = ['service_date', 'cost']

class FuelRecordViewSet(viewsets.ModelViewSet):
    queryset = FuelRecord.objects.select_related('vehicle').all()
    serializer_class = FuelRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['vehicle', 'date']
    search_fields = ['receipt_no', 'vehicle__registration_number']
    ordering_fields = ['date', 'amount', 'liters']

class TransportIncidentViewSet(viewsets.ModelViewSet):
    queryset = TransportIncident.objects.select_related('vehicle', 'reported_by').all()
    serializer_class = TransportIncidentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['vehicle', 'severity', 'incident_type', 'date']
    search_fields = ['description', 'action_taken', 'vehicle__registration_number']
    ordering_fields = ['date', 'severity']

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)

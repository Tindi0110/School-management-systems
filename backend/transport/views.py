from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
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

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer

    @action(detail=True, methods=['get'])
    def maintenance_history(self, request, pk=None):
        vehicle = self.get_object()
        logs = vehicle.maintenance_logs.all().order_by('-service_date')
        serializer = VehicleMaintenanceSerializer(logs, many=True)
        return Response(serializer.data)

class DriverProfileViewSet(viewsets.ModelViewSet):
    queryset = DriverProfile.objects.all()
    serializer_class = DriverProfileSerializer

class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer

class PickupPointViewSet(viewsets.ModelViewSet):
    queryset = PickupPoint.objects.all()
    serializer_class = PickupPointSerializer

class TransportAllocationViewSet(viewsets.ModelViewSet):
    queryset = TransportAllocation.objects.all()
    serializer_class = TransportAllocationSerializer

    def perform_create(self, serializer):
        # Logic to check route capacity before allocation
        route = serializer.validated_data['route']
        active_allocations = TransportAllocation.objects.filter(route=route, status='ACTIVE').count()
        
        # Cross reference with vehicle capacity assigned to this route if applicable
        # (Simplified: check against route_capacity if added to model, or just allow and report)
        serializer.save()

class TripLogViewSet(viewsets.ModelViewSet):
    queryset = TripLog.objects.all()
    serializer_class = TripLogSerializer

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
    queryset = TransportAttendance.objects.all()
    serializer_class = TransportAttendanceSerializer

class VehicleMaintenanceViewSet(viewsets.ModelViewSet):
    queryset = VehicleMaintenance.objects.all()
    serializer_class = VehicleMaintenanceSerializer

class FuelRecordViewSet(viewsets.ModelViewSet):
    queryset = FuelRecord.objects.all()
    serializer_class = FuelRecordSerializer

class TransportIncidentViewSet(viewsets.ModelViewSet):
    queryset = TransportIncident.objects.all()
    serializer_class = TransportIncidentSerializer

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from .models import (
    Hostel, Room, Bed, HostelAllocation, HostelAttendance, 
    HostelDiscipline, HostelAsset, GuestLog, HostelMaintenance
)
from .serializers import (
    HostelSerializer, RoomSerializer, BedSerializer, 
    HostelAllocationSerializer, HostelAttendanceSerializer,
    HostelDisciplineSerializer, HostelAssetSerializer,
    GuestLogSerializer, HostelMaintenanceSerializer
)

class HostelViewSet(viewsets.ModelViewSet):
    queryset = Hostel.objects.all()
    serializer_class = HostelSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        hostels = Hostel.objects.all()
        total_hostels = hostels.count()
        total_capacity = sum(h.capacity for h in hostels)
        total_residents = HostelAllocation.objects.all().count()
        
        # Maintenance issues (Pending + In Progress)
        maintenance_issues = HostelMaintenance.objects.exclude(status='COMPLETED').count()
        
        return Response({
            'totalHostels': total_hostels,
            'totalCapacity': total_capacity,
            'totalResidents': total_residents,
            'maintenanceIssues': maintenance_issues
        })

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related('hostel').prefetch_related('beds').all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        room = serializer.save()
        # Auto-generate beds
        for i in range(1, room.capacity + 1):
            Bed.objects.create(
                room=room,
                bed_number=f"{i}",
                status='AVAILABLE'
            )

class BedViewSet(viewsets.ModelViewSet):
    queryset = Bed.objects.select_related('room__hostel').all()
    serializer_class = BedSerializer
    permission_classes = [IsAuthenticated]

class HostelAllocationViewSet(viewsets.ModelViewSet):
    queryset = HostelAllocation.objects.select_related('student', 'room__hostel', 'bed').all()
    serializer_class = HostelAllocationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        student = serializer.validated_data.get('student')
        if student and student.category != 'BOARDING':
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "Student is not a boarder."})

        bed = serializer.validated_data.get('bed')
        if bed:
            room = bed.room
            # Strict Capacity Check
            if room.current_occupancy >= room.capacity:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"room": f"Room {room.room_number} is already at full capacity ({room.capacity})."})

            bed.status = 'OCCUPIED'
            bed.save()
            # Update room occupancy
            room.current_occupancy += 1
            if room.current_occupancy >= room.capacity:
                room.status = 'FULL'
            room.save()
            
            # Fix: Cleanup Zombie Allocations (Bed is AVAILABLE but still linked)
            if hasattr(bed, 'allocation'):
                 old_alloc = bed.allocation
                 # If we are here, serializer validated bed.status == 'AVAILABLE'
                 # So this link is stale.
                 old_alloc.bed = None
                 old_alloc.save()
        try:
            serializer.save()
        except Exception as e:
            from django.db import IntegrityError
            from rest_framework.exceptions import ValidationError
            if "UNIQUE constraint failed" in str(e):
                raise ValidationError({"detail": "This student already has a hostel record. Please use 'Transfer' to move them."})
            raise e

    @action(detail=True, methods=['post'])
    def transfer(self, request, pk=None):
        allocation = self.get_object()
        new_bed_id = request.data.get('new_bed_id')
        
        if not new_bed_id:
            return Response({'error': 'New bed ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            with transaction.atomic():
                new_bed = Bed.objects.select_for_update().get(id=new_bed_id)
                
                # 1. Validation
                if new_bed.status != 'AVAILABLE':
                    return Response({'error': f'Bed {new_bed.bed_number} is not available (Status: {new_bed.status})'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Fix: Cleanup Zombie Allocations on New Bed
                if hasattr(new_bed, 'allocation'):
                     old_alloc = new_bed.allocation
                     old_alloc.bed = None
                     old_alloc.save()
                
                hostel = new_bed.room.hostel
                student = allocation.student
                if hostel.gender_allowed != 'MIXED' and student.gender != hostel.gender_allowed:
                     return Response({'error': f'Gender mismatch. Hostel is {hostel.gender_allowed} only.'}, status=status.HTTP_400_BAD_REQUEST)

                # 2. Release Old Bed
                old_bed = allocation.bed
                if old_bed:
                    old_bed.status = 'AVAILABLE'
                    old_bed.save()
                    
                    old_room = old_bed.room
                    old_room.current_occupancy = max(0, old_room.current_occupancy - 1)
                    old_room.status = 'AVAILABLE'
                    old_room.save()
                
                # 3. Update Existing Allocation (Student is OneToOne, so we move the pointer)
                allocation.bed = new_bed
                allocation.room = new_bed.room
                allocation.save()
                
                # 4. Update New Bed
                new_bed.status = 'OCCUPIED'
                new_bed.save()
                
                new_room = new_bed.room
                new_room.current_occupancy += 1
                if new_room.current_occupancy >= new_room.capacity:
                    new_room.status = 'FULL'
                new_room.save()
                
                return Response(HostelAllocationSerializer(allocation).data)
                
        except Bed.DoesNotExist:
            return Response({'error': 'Bed ID not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class HostelAttendanceViewSet(viewsets.ModelViewSet):
    queryset = HostelAttendance.objects.all()
    serializer_class = HostelAttendanceSerializer
    permission_classes = [IsAuthenticated]

class HostelDisciplineViewSet(viewsets.ModelViewSet):
    queryset = HostelDiscipline.objects.all()
    serializer_class = HostelDisciplineSerializer
    permission_classes = [IsAuthenticated]

class HostelAssetViewSet(viewsets.ModelViewSet):
    queryset = HostelAsset.objects.all()
    serializer_class = HostelAssetSerializer
    permission_classes = [IsAuthenticated]

class GuestLogViewSet(viewsets.ModelViewSet):
    queryset = GuestLog.objects.all()
    serializer_class = GuestLogSerializer
    permission_classes = [IsAuthenticated]

class HostelMaintenanceViewSet(viewsets.ModelViewSet):
    queryset = HostelMaintenance.objects.all()
    serializer_class = HostelMaintenanceSerializer
    permission_classes = [IsAuthenticated]

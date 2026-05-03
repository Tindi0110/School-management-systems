from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .models import (
    Hostel, Room, Bed, HostelAllocation, HostelAttendance, 
    HostelDiscipline, HostelAsset, GuestLog, HostelMaintenance
)
from .serializers import (
    HostelSerializer, HostelListSerializer, RoomSerializer, BedSerializer, 
    HostelAllocationSerializer, AllocationListSerializer, HostelAttendanceSerializer,
    HostelDisciplineSerializer, HostelAssetSerializer,
    GuestLogSerializer, HostelMaintenanceSerializer
)

class HostelViewSet(viewsets.ModelViewSet):
    queryset = Hostel.objects.all()
    serializer_class = HostelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Count, Q
        return Hostel.objects.annotate(
            total_beds_count=Count('rooms__beds'),
            occupied_beds_count=Count('rooms__beds', filter=Q(rooms__beds__status='OCCUPIED'))
        ).prefetch_related('rooms').all()

    def get_serializer_class(self):
        if self.action == 'list':
            return HostelListSerializer
        return HostelSerializer

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        try:
            hostels = Hostel.objects.all()
            total_hostels = hostels.count()
            total_capacity = sum(h.capacity for h in hostels)
            total_residents = HostelAllocation.objects.filter(status='ACTIVE').count()
            
            # Maintenance issues (Pending + In Progress)
            maintenance_issues = HostelMaintenance.objects.exclude(status='COMPLETED').count()
            
            return Response({
                'totalHostels': total_hostels,
                'totalCapacity': total_capacity,
                'totalResidents': total_residents,
                'maintenanceIssues': maintenance_issues
            })
        except Exception as e:
            print(f"Hostel Stats Error: {str(e)}")
            return Response({"error": str(e)}, status=500)

    def retrieve(self, request, *args, **kwargs):
        """Diagnostic override for Hostel detail 500 errors."""
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            import traceback
            print(f"CRITICAL: Hostel Retrieval Error: {str(e)}")
            traceback.print_exc()
            return Response({"detail": "Server error while processing hostel data.", "error": str(e)}, status=500)

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related('hostel').all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Count, Q
        return Room.objects.select_related('hostel').annotate(
            available_beds_count=Count('beds', filter=Q(beds__status='AVAILABLE'))
        ).all()

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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'room__hostel', 'student']
    search_fields = ['student__full_name', 'student__admission_number']

    def get_serializer_class(self):
        if self.action == 'list':
            return AllocationListSerializer
        return HostelAllocationSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
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
                     old_alloc.bed = None
                     old_alloc.save()
            try:
                serializer.save()
            except Exception as e:
                from rest_framework.exceptions import ValidationError
                if "UNIQUE constraint failed" in str(e):
                    raise ValidationError({"detail": "This student already has a hostel record. Please use 'Transfer' to move them."})
                raise e

    def perform_update(self, serializer):
        with transaction.atomic():
            old_instance = self.get_object()
            old_bed = old_instance.bed
            new_status = serializer.validated_data.get('status', old_instance.status)
            new_bed = serializer.validated_data.get('bed')
            
            # Case 1: Bed changed
            if new_bed and old_bed != new_bed:
                # 1. Release Old Bed
                if old_bed:
                    old_bed.status = 'AVAILABLE'
                    old_bed.save()
                    old_room = old_bed.room
                    old_room.current_occupancy = max(0, old_room.current_occupancy - 1)
                    old_room.status = 'AVAILABLE'
                    old_room.save()
                
                # 2. Occupy New Bed (if the new allocation is ACTIVE)
                if new_status == 'ACTIVE':
                    new_bed.status = 'OCCUPIED'
                    new_bed.save()
                    new_room = new_bed.room
                    new_room.current_occupancy += 1
                    if new_room.current_occupancy >= new_room.capacity:
                        new_room.status = 'FULL'
                    new_room.save()
            
            # Case 2: Status changed to non-ACTIVE (Bed stayed same)
            elif old_instance.status == 'ACTIVE' and new_status != 'ACTIVE':
                if old_bed:
                    old_bed.status = 'AVAILABLE'
                    old_bed.save()
                    old_room = old_bed.room
                    old_room.current_occupancy = max(0, old_room.current_occupancy - 1)
                    old_room.status = 'AVAILABLE'
                    old_room.save()
            
            # Case 3: Status changed back to ACTIVE (Bed stayed same)
            elif old_instance.status != 'ACTIVE' and new_status == 'ACTIVE':
                if old_bed:
                    old_bed.status = 'OCCUPIED'
                    old_bed.save()
                    old_room = old_bed.room
                    old_room.current_occupancy += 1
                    if old_room.current_occupancy >= old_room.capacity:
                        old_room.status = 'FULL'
                    old_room.save()

            serializer.save()

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

    def perform_destroy(self, instance):
        with transaction.atomic():
            bed = instance.bed
            if bed:
                bed.status = 'AVAILABLE'
                bed.save()
                
                room = bed.room
                room.current_occupancy = max(0, room.current_occupancy - 1)
                room.status = 'AVAILABLE'
                room.save()
            instance.delete()

class HostelAttendanceViewSet(viewsets.ModelViewSet):
    queryset = HostelAttendance.objects.select_related('student').order_by('-date')
    serializer_class = HostelAttendanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'session', 'status', 'date']
    search_fields = ['student__full_name', 'student__admission_number']
    ordering_fields = ['date', 'session', 'status']

    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        """
        Marks attendance for multiple students at once.
        Supports both legacy 'records' key and new 'attendance_data' key.
        """
        attendance_data = request.data.get('attendance_data') or request.data.get('records', [])
        date = request.data.get('date', timezone.now().date())
        session = request.data.get('session')

        if not attendance_data:
            return Response({'error': 'No attendance records provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_count = 0
        updated_count = 0
        
        with transaction.atomic():
            for record in attendance_data:
                # Support both 'student' and 'student_id'
                student_id = record.get('student') or record.get('student_id')
                # Use shared date/session if not in record
                rec_date = record.get('date', date)
                rec_session = record.get('session', session)
                status_val = record.get('status')
                # Support both 'remarks' and 'warden_remark'
                remark = record.get('warden_remark') or record.get('remarks', '')

                if not all([student_id, rec_session, status_val]):
                    continue

                obj, created = HostelAttendance.objects.update_or_create(
                    student_id=student_id,
                    date=rec_date,
                    session=rec_session,
                    defaults={'status': status_val, 'warden_remark': remark}
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1
                    
        return Response({
            'message': f'Bulk attendance processed. {created_count} created, {updated_count} updated.',
            'created': created_count,
            'updated': updated_count
        })

class HostelDisciplineViewSet(viewsets.ModelViewSet):
    queryset = HostelDiscipline.objects.select_related('student', 'reported_by').all()
    serializer_class = HostelDisciplineSerializer
    permission_classes = [IsAuthenticated]

class HostelAssetViewSet(viewsets.ModelViewSet):
    queryset = HostelAsset.objects.select_related('hostel', 'room').all()
    serializer_class = HostelAssetSerializer
    permission_classes = [IsAuthenticated]

class GuestLogViewSet(viewsets.ModelViewSet):
    queryset = GuestLog.objects.select_related('student_visited').all()
    serializer_class = GuestLogSerializer
    permission_classes = [IsAuthenticated]

class HostelMaintenanceViewSet(viewsets.ModelViewSet):
    queryset = HostelMaintenance.objects.select_related('hostel', 'room', 'reported_by').all()
    serializer_class = HostelMaintenanceSerializer
    permission_classes = [IsAuthenticated]

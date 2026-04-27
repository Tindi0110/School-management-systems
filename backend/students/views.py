from rest_framework import viewsets, permissions, filters, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Student, Parent, StudentAdmission, StudentDocument,
    DisciplineRecord, HealthRecord, ActivityRecord
)
from django.db import transaction
from django.db.models import Sum, Value, DecimalField, Count, Q, Avg, OuterRef, Subquery
from django.db.models.functions import Coalesce
from finance.models import Invoice
from .serializers import (
    StudentSerializer, StudentListSerializer, ParentSerializer, StudentAdmissionSerializer,
    StudentDocumentSerializer, DisciplineRecordSerializer,
    HealthRecordSerializer, ActivityRecordSerializer
)

from accounts.permissions import IsAdminOrRegistrar, IsAdminUser

class StudentViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        """
        Optimized queryset based on action to prevent heavy join overhead on list views.
        List view (Registry) only needs class and basic user/parent info.
        Detail view needs full profile including hostels, health, and documents.
        """
        if self.action == 'list':
            return Student.objects.select_related(
                'current_class', 'user'
            ).prefetch_related(
                'parents'
            ).annotate(
                avg_score=Avg('results__score'),
                attendance_total=Count('attendance', distinct=True),
                attendance_present=Count('attendance', filter=Q(attendance__status='PRESENT'), distinct=True)
            ).order_by('admission_number')
            
        return Student.objects.select_related(
            'current_class', 'user',
            'hostel_allocation__room__hostel',
            'hostel_allocation__bed',
            'admission_details',
            'health_record',
        ).prefetch_related(
            'parents',
            'documents',
        ).annotate(
            avg_score=Avg('results__score'),
            attendance_total=Count('attendance', distinct=True),
            attendance_present=Count('attendance', filter=Q(attendance__status='PRESENT'), distinct=True)
        ).order_by('admission_number')

    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        return StudentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['current_class', 'status', 'category', 'gender']
    search_fields = ['full_name', 'admission_number', 'current_class__name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'link_user', 'link_parent', 'unlink_parent']:
            return [IsAdminOrRegistrar()]
        if self.action in ['destroy', 'force_delete']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def minimal_search(self, request):
        """Ultra-lightweight endpoint for dropdowns/selectors with optional debt filtering"""
        search = request.query_params.get('search', '')
        has_debt = request.query_params.get('has_debt', 'false').lower() == 'true'
        
        # Use de-normalized fee_balance
        qs = Student.objects.filter(status='ACTIVE')

        if has_debt:
            qs = qs.filter(fee_balance__gt=0)

        # Handle wildcard '*' as 'show all'
        if search and search != '*':
            qs = qs.filter(Q(full_name__icontains=search) | Q(admission_number__icontains=search))
        
        # Optimize query by only fetching needed fields
        qs = qs.select_related('current_class').values(
            'id', 'full_name', 'admission_number', 'current_class__name', 'current_class__stream', 'fee_balance', 'user'
        )[:50]
        
        data = [
            {
                'id': s['id'],
                'full_name': s['full_name'] or 'N/A',
                'admission_number': s['admission_number'] or 'N/A',
                'class_name': s['current_class__name'] or 'General',
                'class_stream': s['current_class__stream'] or '',
                'fee_balance': float(s['fee_balance'] or 0),
                'user': s['user']
            }
            for s in qs
        ]
        return Response(data)

    @action(detail=False, methods=['post'])
    def sync_all_balances(self, request):
        """Mass syncs fee_balance for all active students from their invoices."""
        from django.db.models import Sum, OuterRef, Subquery, Value
        from django.db.models.functions import Coalesce
        from finance.models import Invoice

        # Subquery to calculate sum of invoice balances for each student
        balances = Invoice.objects.filter(student=OuterRef('pk')).values('student').annotate(
            total=Sum('balance')
        ).values('total')

        # Perform mass update efficiently
        updated_count = Student.objects.filter(status='ACTIVE').update(
            fee_balance=Coalesce(
                Subquery(balances), 
                Value(0), 
                output_field=DecimalField()
            )
        )

        return Response({
            'status': 'synced', 
            'updated_count': updated_count, 
            'total_active': Student.objects.filter(status='ACTIVE').count()
        })

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # 1. Create Student (and trigger Hostel Allocation signal if Boarding)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Extract guardian data
        guardian_data = self._get_guardian_data(serializer.validated_data)
        
        self.perform_create(serializer)
        student = serializer.instance
        
        # 2. Sync Parent Record
        self._sync_parent_data(student, guardian_data)
        
        # 3. Refresh and respond
        student.refresh_from_db()
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Extract guardian data
        guardian_data = self._get_guardian_data(serializer.validated_data)
        
        self.perform_update(serializer)
        student = serializer.instance
        
        # Sync Parent Record
        self._sync_parent_data(student, guardian_data)
        
        student.refresh_from_db()
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Diagnostic override to catch 500 errors during retrieval."""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            print(f"CRITICAL: Student Retrieval Error: {str(e)}")
            traceback.print_exc()
            return Response(
                {"detail": "Server error while processing student profile data.", "error": str(e)}, 
                status=500
            )

    def _get_guardian_data(self, validated_data):
        """Helper to safely extract guardian fields from validated_data."""
        return {
            'name': validated_data.pop('guardian_name', None),
            'phone': validated_data.pop('guardian_phone', None),
            'email': validated_data.pop('guardian_email', None),
            'relation': validated_data.pop('guardian_relation', 'GUARDIAN'),
            'address': validated_data.pop('guardian_address', ''),
            'is_primary': validated_data.pop('is_primary_guardian', True),
        }

    def _sync_parent_data(self, student, data):
        """Robustly creates/updates a Parent record and links it to the student."""
        if not data['name'] or not data['phone']:
            return

        try:
            # Check for existing parent by phone
            parent = Parent.objects.filter(phone=data['phone']).first()
            if not parent:
                parent = Parent.objects.create(
                    full_name=data['name'],
                    phone=data['phone'],
                    email=data['email'],
                    relationship=data['relation'],
                    address=data['address'],
                    is_primary=data['is_primary']
                )
            else:
                # Update essential fields if they were missing
                updated = False
                if data['email'] and not parent.email:
                    parent.email = data['email']
                    updated = True
                if data['address'] and not parent.address:
                    parent.address = data['address']
                    updated = True
                if updated:
                    parent.save()
            
            # Link to student if not already linked
            if parent and not student.parents.filter(id=parent.id).exists():
                student.parents.add(parent)
                
        except Exception as e:
            print(f"Parent sync failed: {str(e)}")


    @action(detail=True, methods=['post', 'delete'])
    def link_user(self, request, pk=None):
        student = self.get_object()
        student.save() # Trigger auto-link signal
        student.refresh_from_db()
        if student.user:
            return Response({'status': 'linked', 'user': student.user.username})
        return Response({'status': 'failed'}, status=400)

    @action(detail=True, methods=['delete'])
    def force_delete(self, request, pk=None):
        """
        Manually deletes a student and all related blocking records 
        strictly for ADMIN users only. This bypasses PROTECT constraints
        by systematically clearing all linked data first.
        """
        if request.user.role != 'ADMIN':
            return Response({'error': 'Only administrators can perform force deletion of students.'}, status=403)

        student = self.get_object()
        try:
            with transaction.atomic():
                # 1. Finance Data Cleanup
                # Invoices cascade to Items and Payments
                student.invoices.all().delete()
                
                # 2. Hostel & Housing Cleanup
                if hasattr(student, 'hostel_allocation'):
                    student.hostel_allocation.delete()
                # Use _set for models without explicit related_name
                student.hostelattendance_set.all().delete()
                student.hosteldiscipline_set.all().delete()
                student.guestlog_set.all().delete()
                
                # 3. Transport Cleanup
                if hasattr(student, 'transport_allocation'):
                    student.transport_allocation.delete()
                student.transportattendance_set.all().delete()

                # 4. Academic Data Cleanup
                student.results.all().delete()
                student.enrolled_subjects.all().delete()
                student.attendance_set.all().delete()

                # 5. Library Records (Linked via User)
                if student.user:
                    user = student.user
                    # Lending related_name='borrowed_books'
                    user.borrowed_books.all().delete()
                    user.bookreservation_set.all().delete()
                    user.libraryfine_set.all().delete()

                # 6. Final Deletion
                linked_user = student.user
                student.delete()
                
                # Optionally delete the user account if it was primarily for this student
                if linked_user:
                    linked_user.delete()
            
            return Response({
                'status': 'deleted', 
                'message': f'Student {student.full_name} and all related records (Finance, Hostel, Library, Academics) have been permanently removed.'
            })
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=400)

    @action(detail=True, methods=['post'])
    def link_parent(self, request, pk=None):
        student = self.get_object()
        phone = request.data.get('phone')
        parent_id = request.data.get('parent_id')
        
        try:
            if parent_id:
                parent = Parent.objects.get(id=parent_id)
            elif phone:
                parent = Parent.objects.get(phone=phone)
            else:
                return Response({'error': 'Provide phone or parent_id'}, status=400)
            
            student.parents.add(parent)
            return Response({'status': 'success', 'parent': ParentSerializer(parent).data})
        except Parent.DoesNotExist:
            return Response({'error': 'Parent not found'}, status=404)

    @action(detail=True, methods=['post'])
    def unlink_parent(self, request, pk=None):
        student = self.get_object()
        parent_id = request.data.get('parent_id')
        
        try:
            parent = Parent.objects.get(id=parent_id)
            student.parents.remove(parent)
            return Response({'status': 'success'})
        except Parent.DoesNotExist:
            return Response({'error': 'Parent not found'}, status=404)

class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.all()
    serializer_class = ParentSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrRegistrar()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        # Optimized query with prefetch_related to resolve N+1 issue
        queryset = Parent.objects.all().prefetch_related('students', 'students__current_class')
        student_id = self.request.query_params.get('student_id')
        if student_id:
            # Filter parents who are linked to this student
            queryset = queryset.filter(students__id=student_id)
        return queryset

    def perform_create(self, serializer):
        parent = serializer.save()
        # Check if student_id is provided in the request body to link immediately
        student_id = self.request.data.get('student')
        if student_id:
            try:
                student = Student.objects.get(id=student_id)
                student.parents.add(parent)
            except Student.DoesNotExist:
                pass

class StudentAdmissionViewSet(viewsets.ModelViewSet):
    queryset = StudentAdmission.objects.all()
    serializer_class = StudentAdmissionSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrRegistrar()]
        return [permissions.IsAuthenticated()]

class StudentDocumentViewSet(viewsets.ModelViewSet):
    queryset = StudentDocument.objects.select_related('student').all()
    serializer_class = StudentDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = StudentDocument.objects.select_related('student').all()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset

class DisciplineRecordViewSet(viewsets.ModelViewSet):
    queryset = DisciplineRecord.objects.select_related('student').all()
    serializer_class = DisciplineRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = DisciplineRecord.objects.select_related('student').all()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset

class HealthRecordViewSet(viewsets.ModelViewSet):
    queryset = HealthRecord.objects.select_related('student').all()
    serializer_class = HealthRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = HealthRecord.objects.select_related('student').all()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset

    def create(self, request, *args, **kwargs):
        """Handle 1-to-1 update_or_create logic to prevent integrity errors"""
        student_id = request.data.get('student')
        if not student_id:
            return Response({'error': 'Student ID is required'}, status=400)
            
        instance, created = HealthRecord.objects.update_or_create(
            student_id=student_id,
            defaults=request.data
        )
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class ActivityRecordViewSet(viewsets.ModelViewSet):
    queryset = ActivityRecord.objects.select_related('student').all()
    serializer_class = ActivityRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ActivityRecord.objects.select_related('student').all()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset

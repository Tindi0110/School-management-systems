from rest_framework import viewsets, permissions, filters
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
from academics.models import Attendance, StudentResult, AcademicYear, Term
from finance.models import Invoice
from .serializers import (
    StudentSerializer, ParentSerializer, StudentAdmissionSerializer,
    StudentDocumentSerializer, DisciplineRecordSerializer,
    HealthRecordSerializer, ActivityRecordSerializer
)

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related(
        'current_class', 'user',
        'hostel_allocation__room__hostel',
        'hostel_allocation__bed',
        'admission_details',
        'health_record',
    ).prefetch_related(
        'parents',
        'documents',
    ).annotate(
        fee_balance=Coalesce(
            Subquery(
                Invoice.objects.filter(student=OuterRef('pk')).values('student').annotate(
                    total_balance=Sum('balance')
                ).values('total_balance')
            ),
            Value(0, output_field=DecimalField())
        ),
        # Lighter attendance counts
        attendance_total=Count('attendance', distinct=True),
        attendance_present=Count('attendance', filter=Q(attendance__status='PRESENT'), distinct=True),
        avg_score=Avg('results__score'),
    ).order_by('admission_number')
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['current_class', 'status', 'category', 'gender']
    search_fields = ['full_name', 'admission_number', 'current_class__name']

    @action(detail=False, methods=['get'])
    def minimal_search(self, request):
        """Ultra-lightweight endpoint for dropdowns/selectors with optional debt filtering"""
        search = request.query_params.get('search', '')
        has_debt = request.query_params.get('has_debt', 'false').lower() == 'true'
        
        from finance.models import Invoice
        from django.db.models.functions import Coalesce
        from django.db.models import Sum, DecimalField, Value, OuterRef, Subquery

        qs = Student.objects.filter(status='ACTIVE')
        
        # Annotate with fee_balance for filtering/display
        qs = qs.annotate(
            fee_balance=Coalesce(
                Subquery(
                    Invoice.objects.filter(student=OuterRef('pk')).values('student').annotate(
                        total_balance=Sum('balance')
                    ).values('total_balance')
                ),
                Value(0, output_field=DecimalField())
            )
        )

        if has_debt:
            qs = qs.filter(fee_balance__gt=0)

        if search:
            qs = qs.filter(Q(full_name__icontains=search) | Q(admission_number__icontains=search))
        
        # Optimize query by only fetching needed fields
        # Note: values() on annotated QS works fine
        qs = qs.select_related('current_class').values(
            'id', 'full_name', 'admission_number', 'current_class__name', 'current_class__stream', 'fee_balance'
        )[:50]
        
        data = [
            {
                'id': s['id'],
                'full_name': s['full_name'],
                'admission_number': s['admission_number'],
                'class_name': s['current_class__name'],
                'class_stream': s['current_class__stream'],
                'fee_balance': float(s['fee_balance'])
            }
            for s in qs
        ]
        return Response(data)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # 1. Create Student (and trigger Hostel Allocation signal if Boarding)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Extract guardian data before saving
        g_name = serializer.validated_data.pop('guardian_name', None)
        g_phone = serializer.validated_data.pop('guardian_phone', None)
        g_email = serializer.validated_data.pop('guardian_email', None)
        g_relation = serializer.validated_data.pop('guardian_relation', 'GUARDIAN')
        g_address = serializer.validated_data.pop('guardian_address', '')
        g_is_primary = serializer.validated_data.pop('is_primary_guardian', True)
        
        self.perform_create(serializer)
        student = serializer.instance
        
        # 2. Create/Link Parent (Optimization)
        if g_name:
            try:
                # Check for existing parent by phone to avoid duplicates
                parent, created = Parent.objects.get_or_create(
                    phone=g_phone,
                    defaults={
                        'full_name': g_name,
                        'email': g_email,
                        'relationship': g_relation,
                        'address': g_address,
                        'is_primary': g_is_primary
                    }
                )
                student.parents.add(parent)
            except Exception:
                pass
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

    @action(detail=False, methods=['get'])
    def minimal_search(self, request):
        """
        Lightweight search for dropdowns and selectors.
        Returns only ID, name, admission number, and class.
        """
        from .serializers import SimpleStudentSerializer
        queryset = self.get_queryset().select_related('current_class').only(
            'id', 'full_name', 'admission_number', 'current_class__name', 'current_class__stream'
        )
        
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) | 
                Q(admission_number__icontains=search)
            )
            
        # Limit to 100 results for a balance between responsiveness and visibility
        queryset = queryset[:100]
        serializer = SimpleStudentSerializer(queryset, many=True)
        return Response(serializer.data)

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
    permission_classes = [permissions.IsAuthenticated]

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
    permission_classes = [permissions.IsAuthenticated]

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

from rest_framework import viewsets, permissions
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
        'parents__students',
        'invoices',
    ).annotate(
        fee_balance=Coalesce(
            Subquery(
                Invoice.objects.filter(student=OuterRef('pk')).values('student').annotate(
                    total_balance=Sum('balance')
                ).values('total_balance')
            ),
            Value(0, output_field=DecimalField())
        ),
        # Attendance annotations using subqueries for precise counts
        attendance_total=Coalesce(
            Subquery(
                Attendance.objects.filter(student=OuterRef('pk')).values('student').annotate(
                    cnt=Count('pk')
                ).values('cnt')
            ), 
            Value(0)
        ),
        attendance_present=Coalesce(
            Subquery(
                Attendance.objects.filter(student=OuterRef('pk'), status='PRESENT').values('student').annotate(
                    cnt=Count('pk')
                ).values('cnt')
            ),
            Value(0)
        ),
        # Grade annotation
        avg_score=Avg('results__score'),
    ).order_by('admission_number')
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['full_name', 'admission_number', 'current_class__name']

    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['full_name', 'admission_number', 'current_class__name']

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
                        'address': g_address
                    }
                )
                student.parents.add(parent)
            except Exception:
                pass
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

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
        (Invoices, Allocations, Results) to bypass PROTECT constraints.
        Use with caution.
        """
        student = self.get_object()
        try:
            # 1. Unlink/Delete Finance Data
            # Invoices are typically PROTECT'd by Year not Student, but Payments might be Issue.
            # We want to CASCADE delete invoices.
            student.invoices.all().delete() # This cascades to Payments/Items
            
            # 2. Unlink/Delete Hostel Allocations
            if hasattr(student, 'hostel_allocation'):
                student.hostel_allocation.delete()
            
            # 3. Unlink/Delete Transport Allocations
            if hasattr(student, 'transport_allocation'):
                student.transport_allocation.delete()

            # 4. Unlink/Delete Academic Results/Subjects
            student.results.all().delete()
            student.enrolled_subjects.all().delete()
            student.attendance_set.all().delete()

            # 5. Delete Student (and cascaded profile data)
            student.delete()
            
            return Response({'status': 'deleted', 'message': 'Student and all related records permanently removed.'})
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=400)

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
    queryset = StudentDocument.objects.all()
    serializer_class = StudentDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = StudentDocument.objects.all()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset

class DisciplineRecordViewSet(viewsets.ModelViewSet):
    queryset = DisciplineRecord.objects.all()
    serializer_class = DisciplineRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = DisciplineRecord.objects.all()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset

class HealthRecordViewSet(viewsets.ModelViewSet):
    queryset = HealthRecord.objects.all()
    serializer_class = HealthRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = HealthRecord.objects.all()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset

class ActivityRecordViewSet(viewsets.ModelViewSet):
    queryset = ActivityRecord.objects.all()
    serializer_class = ActivityRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ActivityRecord.objects.all()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset

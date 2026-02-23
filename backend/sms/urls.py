from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from accounts.views import RegisterView, CustomAuthToken
from .views import (
    health_check, UserViewSet,
    dashboard_stats
)
from staff.views import StaffViewSet
from finance.views import (
    FeeStructureViewSet, InvoiceViewSet, PaymentViewSet, 
    AdjustmentViewSet, ExpenseViewSet
)
from academics.views import (
    AcademicYearViewSet, TermViewSet, SubjectGroupViewSet,
    GradeSystemViewSet, GradeBoundaryViewSet, AttendanceViewSet,
    LearningResourceViewSet, SyllabusCoverageViewSet,
    ClassSubjectViewSet, StudentSubjectViewSet,
    ClassViewSet, SubjectViewSet, ExamViewSet, StudentResultViewSet
)
from timetable.views import TimetableSlotViewSet
from students.views import (
    StudentViewSet, ParentViewSet, StudentAdmissionViewSet,
    StudentDocumentViewSet, DisciplineRecordViewSet,
    HealthRecordViewSet, ActivityRecordViewSet
)
from hostel.views import (
    HostelViewSet, RoomViewSet, BedViewSet, HostelAllocationViewSet,
    HostelAttendanceViewSet, HostelDisciplineViewSet, HostelAssetViewSet,
    GuestLogViewSet, HostelMaintenanceViewSet
)
from library.views import (
    LibraryConfigViewSet, BookViewSet, BookCopyViewSet, BookLendingViewSet,
    LibraryFineViewSet, BookReservationViewSet
)
from medical.views import MedicalRecordViewSet
from transport.views import (
    VehicleViewSet, RouteViewSet, TransportAllocationViewSet,
    PickupPointViewSet, TripLogViewSet, TransportAttendanceViewSet,
    VehicleMaintenanceViewSet, FuelRecordViewSet, TransportIncidentViewSet,
    DriverProfileViewSet, TransportConfigViewSet
)
from communication.views import (
    NotificationViewSet, SystemAlertViewSet, SchoolEventViewSet
)

router = DefaultRouter()
# Core
router.register(r'users', UserViewSet)
router.register(r'staff', StaffViewSet)
router.register(r'classes', ClassViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'exams', ExamViewSet)
router.register(r'student-results', StudentResultViewSet)
router.register(r'timetable', TimetableSlotViewSet)

# SIS (Students)
router.register(r'students', StudentViewSet)
router.register(r'parents', ParentViewSet)
router.register(r'admissions', StudentAdmissionViewSet)
router.register(r'student-documents', StudentDocumentViewSet)
router.register(r'discipline', DisciplineRecordViewSet)
router.register(r'health', HealthRecordViewSet)
router.register(r'activities', ActivityRecordViewSet)

# Academics Suite
router.register(r'academic-years', AcademicYearViewSet)
router.register(r'terms', TermViewSet)
router.register(r'subject-groups', SubjectGroupViewSet)
router.register(r'grade-systems', GradeSystemViewSet)
router.register(r'grade-boundaries', GradeBoundaryViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'learning-resources', LearningResourceViewSet)
router.register(r'syllabus-coverage', SyllabusCoverageViewSet)
router.register(r'class-subjects', ClassSubjectViewSet)
router.register(r'student-subjects', StudentSubjectViewSet)

# Finance Suite
router.register(r'fee-structures', FeeStructureViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'adjustments', AdjustmentViewSet)
router.register(r'expenses', ExpenseViewSet)

# Hostel
router.register(r'hostels', HostelViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'beds', BedViewSet)
router.register(r'hostel-allocations', HostelAllocationViewSet)
router.register(r'hostel-attendance', HostelAttendanceViewSet)
router.register(r'hostel-discipline', HostelDisciplineViewSet)
router.register(r'hostel-assets', HostelAssetViewSet)
router.register(r'hostel-guests', GuestLogViewSet)
router.register(r'hostel-maintenance', HostelMaintenanceViewSet)

# Library
router.register(r'library-config', LibraryConfigViewSet)
router.register(r'books', BookViewSet)
router.register(r'book-copies', BookCopyViewSet)
router.register(r'book-lendings', BookLendingViewSet)
router.register(r'library-fines', LibraryFineViewSet)
router.register(r'book-reservations', BookReservationViewSet)
# Medical
router.register(r'medical-records', MedicalRecordViewSet)
# Transport
router.register(r'transport-config', TransportConfigViewSet)
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'routes', RouteViewSet, basename='route')
router.register(r'pickup-points', PickupPointViewSet)
router.register(r'transport-allocations', TransportAllocationViewSet)
router.register(r'trip-logs', TripLogViewSet)
router.register(r'transport-attendance', TransportAttendanceViewSet)
router.register(r'vehicle-maintenance', VehicleMaintenanceViewSet)
router.register(r'fuel-records', FuelRecordViewSet)
router.register(r'transport-incidents', TransportIncidentViewSet)
router.register(r'driver-profiles', DriverProfileViewSet)

# Communication
router.register(r'notifications', NotificationViewSet)
router.register(r'alerts', SystemAlertViewSet, basename='alerts')
router.register(r'school-events', SchoolEventViewSet, basename='school-events')

urlpatterns = [
    path('', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/mpesa/', include('mpesa.urls')),
    path('api/', include(router.urls)),
    path('api/audit/', include('audit.urls')),
    path('api/stats/', dashboard_stats, name='dashboard_stats'),
    # Catch-all for SPA handling (Must be last)
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]

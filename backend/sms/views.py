from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from accounts.models import User
from students.models import Student
from academics.models import Class, AcademicYear, Term
from staff.models import Staff
from communication.models import SystemAlert, SchoolEvent
from communication.serializers import SystemAlertSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        "status": "online",
        "message": "School Management System API is running",
        "version": "1.0.0"
    })

# Redundant viewsets removed as they are already defined in their respective app views.py 
# and registered in urls.py using the correct imports.

class UserViewSet(viewsets.ModelViewSet):
    from accounts.serializers import UserSerializer
    queryset = User.objects.all()
    serializer_class = UserSerializer
    from rest_framework.permissions import IsAdminUser
    permission_classes = [IsAdminUser]

from django.core.cache import cache

DASHBOARD_CACHE_KEY = 'dashboard_stats_data'

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Consolidated endpoint that returns all data needed for the initial dashboard load.
    Reduces network round-trips significantly by combining counts, active context, 
    live alerts, and upcoming events into a single response.
    """
    cached_data = cache.get(DASHBOARD_CACHE_KEY)
    if cached_data:
        return Response(cached_data)

    from finance.models import Invoice
    from academics.models import Exam
    today = timezone.now().date()
    
    # 1. Basic Counts (Aggregated in one query)
    from django.db.models import Count, Q
    from staff.models import Department
    from students.models import Parent
    counts_agg = Student.objects.aggregate(
        total_students=Count('id'),
        active_students=Count('id', filter=Q(status='ACTIVE')),
        suspended_students=Count('id', filter=Q(status='SUSPENDED')),
        boarder_count=Count('id', filter=Q(status='ACTIVE', category='BOARDING')),
        day_scholar_count=Count('id', filter=Q(status='ACTIVE', category='DAY'))
    )
    
    counts = {
        **counts_agg,
        'total_staff': Staff.objects.count(),
        'teacher_count': Staff.objects.filter(user__role='TEACHER').count(),
        'support_staff_count': Staff.objects.exclude(user__role__in=['TEACHER', 'ADMIN', 'PRINCIPAL']).count(),
        'total_parents': Parent.objects.count(),
        'total_departments': Department.objects.count(),
        'total_classes': Class.objects.count(),
        'pending_invoices': Invoice.objects.filter(balance__gt=0).count(),
    }
    
    # 2. Active Academic Context
    active_year = AcademicYear.objects.filter(is_active=True).first()
    active_term = Term.objects.filter(is_active=True).first()
    
    # 3. Active Alerts
    active_alerts = SystemAlert.objects.filter(is_active=True).order_by('-created_at')[:2]
    alerts_data = SystemAlertSerializer(active_alerts, many=True).data
    
    # 4. Upcoming Events & Exams
    upcoming_events = SchoolEvent.objects.filter(date__gte=today).order_by('date')[:5]
    upcoming_exams = Exam.objects.filter(date_started__gte=today).select_related('term').order_by('date_started')[:5]
    
    events_data = []
    for event in upcoming_events:
        events_data.append({
            'id': f'event-{event.id}',
            'title': event.title,
            'date': event.date,
            'start_time': event.start_time.strftime('%H:%M') if event.start_time else '08:00',
            'location': event.location or 'School Precincts',
            'event_type': 'EVENT'
        })
    
    for exam in upcoming_exams:
        events_data.append({
            'id': f'exam-{exam.id}',
            'title': f"{exam.name} ({exam.exam_type})",
            'date': exam.date_started,
            'start_time': '08:00',
            'location': 'Main Hall',
            'event_type': 'EXAM'
        })
    
    # Sort combined list by date
    events_data.sort(key=lambda x: str(x['date']))
    
    response_data = {
        'counts': counts,
        'active_context': {
            'year': active_year.name if active_year else 'N/A',
            'term': active_term.name if active_term else 'N/A'
        },
        'alerts': alerts_data,
        'events': events_data[:5] # Return top 5 combined
    }
    
    # Cache for 1 minute (reduced from 15m to avoid stale data perception)
    cache.set(DASHBOARD_CACHE_KEY, response_data, 60)
    
    return Response(response_data)

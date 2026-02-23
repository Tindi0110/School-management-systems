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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Consolidated endpoint that returns all data needed for the initial dashboard load.
    Reduces network round-trips significantly by combining counts, active context, 
    live alerts, and upcoming events into a single response.
    """
    from django.db.models import Sum
    from finance.models import Invoice
    from academics.models import Exam
    today = timezone.now().date()
    
    # 1. Basic Counts (Aggregated)
    # total_students now shows all students in registry (not just active) for complete visibility
    counts = {
        'total_students': Student.objects.count(), 
        'total_staff': Staff.objects.count(),
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
    
    return Response({
        'counts': counts,
        'active_context': {
            'year': active_year.name if active_year else 'N/A',
            'term': active_term.name if active_term else 'N/A'
        },
        'alerts': alerts_data,
        'events': events_data[:5] # Return top 5 combined
    })

from django.utils import timezone
from django.db import transaction
from .models import AcademicYear, Term, Class
from students.models import Student

def sync_academic_statuses():
    """
    Checks active term and year dates.
    Closes expired terms/years and opens new ones if applicable.
    Should be called periodically or on dashboard access.
    """
    today = timezone.now().date()
    active_term = Term.objects.filter(is_active=True).first()
    
    if active_term and today > active_term.end_date:
        # Term has ended.
        with transaction.atomic():
            active_term.is_active = False
            active_term.save()
            print(f"Term {active_term.name} closed automatically.")
            
            if active_term.is_final_term:
                # End of Year!
                transition_to_new_year(active_term.year)
                promote_students()
            else:
                # Open next term in the same year
                open_next_term(active_term)

def open_next_term(closed_term):
    """
    Finds the next term in the same year and activates it.
    """
    next_term = Term.objects.filter(
        year=closed_term.year,
        start_date__gte=closed_term.end_date
    ).exclude(pk=closed_term.pk).order_by('start_date').first()
    
    if next_term:
        next_term.is_active = True
        next_term.save()
        print(f"Next Term {next_term.name} opened automatically.")

def transition_to_new_year(old_year):
    """
    Creates/Activates the next Academic Year and its first term.
    """
    try:
        current_year_int = int(old_year.name)
        next_year_name = str(current_year_int + 1)
    except ValueError:
        # Fallback if name isn't a simple year
        next_year_name = f"{old_year.name}_Next"

    next_year, _ = AcademicYear.objects.get_or_create(
        name=next_year_name,
        defaults={'is_active': True}
    )
    if not next_year.is_active:
        next_year.is_active = True
        next_year.save()
        
    # Create Term 1 for the new year
    term1_start = timezone.now().date()
    # If we want to be precise, we'd look at the old year's schedule, 
    # but for now let's set a sensible default or lookup if exists.
    term1, created = Term.objects.get_or_create(
        year=next_year,
        name='Term 1',
        defaults={
            'start_date': term1_start,
            'end_date': term1_start + timezone.timedelta(days=90),
            'is_active': True
        }
    )
    if not term1.is_active:
        term1.is_active = True
        term1.save()
    
    # Clone existing class structures to the new year
    # This ensures promoted students have destination classes
    old_classes = Class.objects.filter(year=int(old_year.name))
    for c in old_classes:
        # Find numeric level part (e.g. "Form 1" -> "Form 2")
        # However, we have the 'level' field now.
        next_level = c.level + 1
        if next_level <= 4:
            next_name = f"Form {next_level}" # Simplified naming
            # Check if this class already exists in the new year
            Class.objects.get_or_create(
                name=next_name,
                stream=c.stream,
                year=int(next_year.name),
                defaults={
                    'level': next_level,
                    'capacity': c.capacity,
                    'class_teacher': c.class_teacher
                }
            )

def promote_students():
    """
    Iterates through all active students and promotes them.
    Stream-aware: Preserves stream during promotion.
    Form 4 (Level 4) -> Alumni
    """
    students = Student.objects.filter(status='ACTIVE')
    active_year = AcademicYear.objects.filter(is_active=True).first()
    if not active_year:
        return

    year_int = int(active_year.name)
    
    with transaction.atomic():
        for s in students:
            if not s.current_class:
                continue
                
            current_level = s.current_class.level
            current_stream = s.current_class.stream
            
            if current_level >= 4:
                # Graduation!
                s.status = 'ALUMNI'
                s.is_active = False
                s.save(update_fields=['status', 'is_active'])
            else:
                # Promotion
                next_level = current_level + 1
                next_name = f"Form {next_level}"
                
                # Find the class in the NEW year with the same stream
                next_class = Class.objects.filter(
                    level=next_level,
                    stream=current_stream,
                    year=year_int
                ).first()
                
                if next_class:
                    s.current_class = next_class
                    s.save(update_fields=['current_class'])
                else:
                    # Log or handle missing destination class
                    print(f"Warning: No destination class found for {s.full_name} ({next_name} {current_stream})")

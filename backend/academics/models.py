from django.db import models
from django.conf import settings

# 1. Academic Structure
class AcademicYear(models.Model):
    name = models.CharField(max_length=20, unique=True) # e.g. 2026
    is_active = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if self.is_active:
            AcademicYear.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self): return self.name

class Term(models.Model):
    year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(max_length=50) # Term 1, Term 2, Term 3
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.is_active:
            # Deactivate all other terms
            Term.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self): return f"{self.year} - {self.name}"

# 2. Subjects
class SubjectGroup(models.Model):
    name = models.CharField(max_length=100) # Sciences, Humanities, Languages
    def __str__(self): return self.name

class Subject(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    group = models.ForeignKey(SubjectGroup, on_delete=models.SET_NULL, null=True, blank=True)
    is_optional = models.BooleanField(default=False)
    
    def __str__(self): return f"{self.name} ({self.code})"

class Class(models.Model):
    name = models.CharField(max_length=50) 
    stream = models.CharField(max_length=50)
    year = models.IntegerField() # Deprecating in favor of AcademicYear relation soon
    class_teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='classes_managed')
    subjects = models.ManyToManyField(Subject, related_name='classes')
    capacity = models.IntegerField(default=40)
    
    class Meta:
        verbose_name_plural = "Classes"
        unique_together = ('name', 'stream', 'year')

class ClassSubject(models.Model):
    class_id = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='subject_allocations')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='class_allocations')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='subjects_taught')
    is_optional = models.BooleanField(default=False)

    class Meta:
        unique_together = ('class_id', 'subject')

class StudentSubject(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='enrolled_subjects')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('student', 'subject')

# 3. Grading System
class GradeSystem(models.Model):
    name = models.CharField(max_length=100) # KCSE Grading, Primary Grading
    is_default = models.BooleanField(default=False)
    def __str__(self): return self.name

class GradeBoundary(models.Model):
    system = models.ForeignKey(GradeSystem, on_delete=models.CASCADE, related_name='boundaries')
    grade = models.CharField(max_length=5) # A, B+, C
    min_score = models.IntegerField()
    max_score = models.IntegerField()
    points = models.IntegerField(default=0)
    remarks = models.CharField(max_length=200, blank=True)

# 4. Exams & Results
class Exam(models.Model):
    TYPES = (('CAT', 'CAT'), ('MID_TERM', 'Mid-Term'), ('END_TERM', 'End-Term'))
    name = models.CharField(max_length=100)
    exam_type = models.CharField(max_length=20, choices=TYPES, default='END_TERM')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='exams')
    weighting = models.IntegerField(default=100, help_text="Percentage contribution to final term grade")
    date_started = models.DateField()
    is_active = models.BooleanField(default=True)
    is_locked = models.BooleanField(default=False) # For marks entry lockdown

    def __str__(self): return f"{self.name} ({self.term})"

class StudentResult(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='results')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='results')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    score = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=5, blank=True)
    remarks = models.TextField(blank=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        unique_together = ('student', 'exam', 'subject')

    def save(self, *args, **kwargs):
        if not self.grade:
            self.calculate_grade()
        super().save(*args, **kwargs)

    def calculate_grade(self):
        # Find applicable grade system (e.g., from class or subject default)
        # For simplicity, picking the first active system or default
        # Ideally, link Class -> GradeSystem
        try:
            # Assuming GradeSystem linked to Class, but Class is on Student
            # Simple fallback: Get any GradeBoundary that matches score
            boundaries = GradeBoundary.objects.filter(min_score__lte=self.score, max_score__gte=self.score)
            if boundaries.exists():
                self.grade = boundaries.first().grade
            else:
                self.grade = 'N/A'
        except Exception:
            self.grade = 'E'

# 5. Attendance & Resources
from django.utils import timezone

class Attendance(models.Model):
    STATUS = (('PRESENT', 'Present'), ('ABSENT', 'Absent'), ('LATE', 'Late'))
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=10, choices=STATUS, default='PRESENT')
    remark = models.CharField(max_length=255, blank=True)

class LearningResource(models.Model):
    title = models.CharField(max_length=200)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    file_type = models.CharField(max_length=50, blank=True) # PDF, Video, Link
    url = models.URLField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

class SyllabusCoverage(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    class_grade = models.ForeignKey(Class, on_delete=models.CASCADE) # Renamed to avoid reserved word 'class' collision if using string reference, or use Class model
    coverage_percentage = models.IntegerField(default=0)
    last_updated = models.DateField(auto_now=True)

    class Meta:
        unique_together = ('subject', 'class_grade')

from rest_framework import permissions

class IsClassTeacherForSubject(permissions.BasePermission):
    """
    Custom permission to only allow class teachers to edit results for their own class/subject.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user (or restricted by view level perms)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed if the user is the teacher assigned to the subject
        # Assumes 'obj' is a StudentResult or similar that links to a Class/Subject
        
        # Check 1: Is user a staff member?
        if not hasattr(request.user, 'staff_profile'):
            return False
            
        staff_profile = request.user.staff_profile

        # Logic depends on the object type being accessed
        
        # Case A: StudentResult object
        if hasattr(obj, 'student') and hasattr(obj.student, 'current_class'):
            # Check if user is the class teacher of the student's class
            # Note: class_teacher is a Foreign Key to USER model (not Staff profile)
            current_class = obj.student.current_class
            if current_class and current_class.class_teacher == request.user:
                return True
                
        # Case B: Direct Class check (if applicable in future)
        if isinstance(obj, type(request.user)): # fallback or other checks
             pass

        # Allow Admin/Principal (superusers or specific roles) to override
        # We assume the ViewSet permissions list includes IsAuthenticated, so we are logged in.
        # But we might want to allow 'ADMIN' role to edit too.
        if request.user.role in ['ADMIN', 'PRINCIPAL', 'DEPUTY']:
            return True

        return False

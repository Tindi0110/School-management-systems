from rest_framework import permissions

class IsAdminToDelete(permissions.BasePermission):
    """
    Custom permission to only allow Admins to delete financial records.
    Other operations (GET, POST, PUT, PATCH) are allowed for any authenticated user.
    """

    def has_permission(self, request, view):
        # Allow any authenticated user for non-delete methods
        if request.method != 'DELETE':
            return request.user and request.user.is_authenticated
            
        # For DELETE, strictly check if user is an ADMIN
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'ADMIN'
        )

    def has_object_permission(self, request, view, obj):
        # Allow any authenticated user for non-delete methods
        if request.method != 'DELETE':
            return True
            
        # For DELETE, strictly check if user is an ADMIN
        return request.user and request.user.role == 'ADMIN'

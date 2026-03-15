from rest_framework import permissions

class IsAdminOrRegistrar(permissions.BasePermission):
    """
    Custom permission to only allow admins and registrars.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                   (request.user.role == 'ADMIN' or request.user.role == 'REGISTRAR'))

class IsAdminOrAccountant(permissions.BasePermission):
    """
    Custom permission to only allow admins and accountants.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                   (request.user.role == 'ADMIN' or request.user.role == 'ACCOUNTANT'))

class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admins.
    (Redundant if using DRF's IsAdminUser, but consistent with the role field)
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

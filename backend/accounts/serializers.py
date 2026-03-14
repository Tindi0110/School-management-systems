"""
accounts/serializers.py

Serializers for user registration, authentication, and profile data.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

# Roles that require admin approval before gaining system access
STAFF_ROLES = frozenset([
    'TEACHER', 'PRINCIPAL', 'DEPUTY', 'DOS',
    'REGISTRAR', 'ACCOUNTANT', 'NURSE', 'WARDEN', 'LIBRARIAN', 'ADMIN',
])

# Synthetic module-level permissions derived from each role
ROLE_PERMISSIONS: dict[str, list[str]] = {
    'ADMIN': [
        'view_dashboard', 'view_academics', 'view_student', 'view_parent',
        'view_staff', 'view_finance', 'view_hostel', 'view_library',
        'view_medical', 'view_transport', 'view_audit', 'view_school_events',
        'view_notifications', 'add_student', 'change_student', 'delete_student',
        'add_parent', 'change_parent', 'delete_parent',
        'add_timetable', 'change_timetable', 'delete_timetable',
    ],
    'PRINCIPAL': [
        'view_dashboard', 'view_academics', 'view_student', 'view_parent',
        'view_staff', 'view_finance', 'view_hostel', 'view_library',
        'view_medical', 'view_transport',
        'add_timetable', 'change_timetable', 'delete_timetable',
    ],
    'DEPUTY':     ['view_dashboard', 'view_academics', 'view_student', 'view_parent', 'view_staff'],
    'DOS':        ['view_dashboard', 'view_academics', 'view_staff', 'view_library', 'view_timetable', 'add_timetable', 'change_timetable', 'delete_timetable'],
    'REGISTRAR':  ['view_dashboard', 'view_student', 'add_student', 'change_student', 'view_parent', 'add_parent', 'change_parent', 'view_staff', 'view_hostel', 'view_transport'],
    'TEACHER':    ['view_dashboard', 'view_academics', 'view_timetable'],
    'ACCOUNTANT': ['view_dashboard', 'view_finance'],
    'WARDEN':     ['view_dashboard', 'view_hostel', 'view_transport'],
    'NURSE':      ['view_dashboard', 'view_medical'],
    'LIBRARIAN':  ['view_dashboard', 'view_library'],
    'STUDENT':    ['view_dashboard', 'view_timetable', 'view_academics'],
    'PARENT':     ['view_dashboard'],
    'ALUMNI':     ['view_dashboard'],
}


class UserSerializer(serializers.ModelSerializer):
    """Read-only serializer for authenticated user profile and permissions."""

    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role',
            'is_staff', 'is_approved', 'is_email_verified', 'permissions',
        ]

    def get_permissions(self, obj: User) -> list[str]:
        """Returns a deduplicated list of module permissions for the user's role."""
        return list(set(ROLE_PERMISSIONS.get(obj.role, [])))


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for new user registration."""

    password  = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'full_name']

    def create(self, validated_data: dict) -> User:
        full_name = validated_data.pop('full_name', '')
        role = validated_data.get('role', 'STUDENT')
        
        # Use email as username if not provided
        if not validated_data.get('username'):
            validated_data['username'] = validated_data.get('email')

        user = User.objects.create_user(**validated_data)

        # Staff roles require admin approval; all others are auto-approved
        user.is_approved = role not in STAFF_ROLES
        user.is_email_verified = False  # All accounts must verify email on registration

        if full_name:
            parts = full_name.split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''

        user.save()
        return user

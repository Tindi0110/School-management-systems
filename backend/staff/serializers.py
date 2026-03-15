"""
staff/serializers.py

Serializers for Staff and Department models.
Enforces unique email and phone constraints and keeps the linked
User record in sync on create/update.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.conf import settings
from sms.mail import EmailService
from .models import Staff, Department

User = get_user_model()


class DepartmentSerializer(serializers.ModelSerializer):
    """Department with staff head-count."""

    staff_count = serializers.IntegerField(source='staff_members.count', read_only=True)

    class Meta:
        model  = Department
        fields = ['id', 'name', 'description', 'staff_count', 'created_at']


class StaffSerializer(serializers.ModelSerializer):
    """
    Full staff profile serializer.
    Read-only computed fields: full_name, role, username.
    Write-only helper fields: write_full_name, write_role.
    """

    # Read fields derived from the linked User
    full_name       = serializers.SerializerMethodField()
    role            = serializers.SerializerMethodField()
    username        = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)

    # Write-only fields so callers can supply name and role without touching User directly
    write_full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    write_role      = serializers.CharField(write_only=True, required=False, default='TEACHER')
    employee_id     = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model  = Staff
        fields = [
            'id', 'user', 'employee_id', 'department', 'department_name',
            'email', 'phone', 'qualifications', 'date_joined',
            'full_name', 'role', 'username',
            'write_full_name', 'write_role',
        ]
        read_only_fields = ['user']

    # ── Validation ─────────────────────────────────────────────────────────

    def _check_unique_field(self, field: str, value: str, instance=None):
        """Check that a value is unique in the Staff table, excluding the current instance."""
        qs = Staff.objects.filter(**{field: value})
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                {field: f"A staff member with this {field} already exists."}
            )

    def validate(self, attrs):
        instance = self.instance  # None on create, Staff object on update

        email = attrs.get('email')
        phone = attrs.get('phone')

        if email:
            self._check_unique_field('email', email, instance)
        if phone:
            self._check_unique_field('phone', phone, instance)

        return attrs

    # ── Create / Update ────────────────────────────────────────────────────

    def to_internal_value(self, data):
        _data = data.copy() if hasattr(data, 'copy') else data
        import uuid
        if not _data.get('employee_id'):
            # Temp ID to bypass DRF validation. Will be replaced in create().
            _data['employee_id'] = f"TEMP-{uuid.uuid4().hex[:8].upper()}"
        return super().to_internal_value(_data)

    def create(self, validated_data: dict) -> Staff:
        full_name   = validated_data.pop('write_full_name', '')
        role        = validated_data.pop('write_role', 'TEACHER')
        employee_id = validated_data.get('employee_id')
        email       = validated_data.get('email', '')

        parts      = full_name.split(' ', 1)
        first_name = parts[0]
        last_name  = parts[1] if len(parts) > 1 else ''

        # Use email as base username to avoid collision since TEMP is random
        is_temp = employee_id.startswith('TEMP-')
        base_username = email if is_temp and email else employee_id

        # Admin-created staff should be automatically fully approved
        user, created = User.objects.get_or_create(
            username=base_username,
            defaults={
                'first_name': first_name,
                'last_name':  last_name,
                'role':       role,
                'email':      email,
                'is_approved': True,
                'is_email_verified': True,
            },
        )

        if created:
            if is_temp:
                employee_id = f"EMP-{user.id:04d}"
                validated_data['employee_id'] = employee_id
                user.username = employee_id

            temp_password = 'staff@123'
            user.set_password(temp_password)
            user.save()
            
            # Send welcome email with credentials
            if email:
                login_link = f"{settings.FRONTEND_URL}/login"
                body = (
                    f"Welcome {first_name}!\n\n"
                    f"An administrator has created a staff account for you on the School Management System.\n\n"
                    f"Your login credentials are:\n"
                    f"Username / Employee ID: {employee_id}\n"
                    f"Temporary Password: {temp_password}\n\n"
                    f"Please log in at {login_link} and change your password immediately.\n\n"
                    f"— School Management System"
                )
                EmailService.send_async('Welcome to the School Management System', body, email)

        validated_data['user'] = user
        
        # The accounts.signals post_save handler might have automatically created a Staff profile
        staff_profile = Staff.objects.filter(user=user).first()
        if staff_profile:
            for attr, value in validated_data.items():
                setattr(staff_profile, attr, value)
            staff_profile.save()
            return staff_profile

        return super().create(validated_data)

    def update(self, instance: Staff, validated_data: dict) -> Staff:
        full_name = validated_data.pop('write_full_name', None)
        role      = validated_data.pop('write_role', None)

        if full_name:
            parts = full_name.split(' ', 1)
            instance.user.first_name = parts[0]
            instance.user.last_name  = parts[1] if len(parts) > 1 else ''

        if role:
            # Only ADMIN can change roles
            request = self.context.get('request')
            if request and request.user.role == 'ADMIN':
                instance.user.role = role
            else:
                # Silently ignore or you could raise an error. User asked to "allow only system admin to change"
                pass

        instance.user.save()
        return super().update(instance, validated_data)

    # ── Computed getters ───────────────────────────────────────────────────

    def get_full_name(self, obj: Staff) -> str:
        if not obj.user:
            return 'Unknown'
        return obj.user.get_full_name().strip() or obj.user.username

    def get_role(self, obj: Staff) -> str:
        return obj.user.role if obj.user else 'N/A'

    def get_username(self, obj: Staff) -> str:
        return obj.user.username if obj.user else ''

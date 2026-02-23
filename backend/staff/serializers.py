from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Staff

User = get_user_model()

class StaffSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    
    # Write-only fields for creation/update
    write_full_name = serializers.CharField(write_only=True, required=False)
    write_role = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Staff
        fields = [
            'id', 'user', 'employee_id', 'department', 'qualifications', 
            'date_joined', 'full_name', 'role', 'email', 'username',
            'write_full_name', 'write_role'
        ]
        read_only_fields = ['user']

    def create(self, validated_data):
        full_name = validated_data.pop('write_full_name', '')
        role = validated_data.pop('write_role', 'TEACHER')
        employee_id = validated_data.get('employee_id')
        
        # Create user for the staff member
        # Split full_name into first and last
        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        user, created = User.objects.get_or_create(
            username=employee_id,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'role': role
            }
        )
        
        if created:
            user.set_password('staff@123') # Default password
            user.save()
            
        validated_data['user'] = user
        return super().create(validated_data)

    def get_full_name(self, obj):
        return obj.user.get_full_name() if obj.user else "Unknown Staff"

    def get_role(self, obj):
        return obj.user.role if obj.user else "N/A"

    def get_email(self, obj):
        return obj.user.email if obj.user else ""

    def get_username(self, obj):
        return obj.user.username if obj.user else ""

    def update(self, instance, validated_data):
        full_name = validated_data.pop('write_full_name', None)
        role = validated_data.pop('write_role', None)
        
        if full_name:
            name_parts = full_name.split(' ', 1)
            instance.user.first_name = name_parts[0]
            instance.user.last_name = name_parts[1] if len(name_parts) > 1 else ''
            
        if role:
            instance.user.role = role
            
        instance.user.save()
        return super().update(instance, validated_data)

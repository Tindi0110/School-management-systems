from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Staff

User = get_user_model()

class StaffSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    email = serializers.EmailField(source='user.email', required=False)
    username = serializers.CharField(source='user.username', read_only=True)
    
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

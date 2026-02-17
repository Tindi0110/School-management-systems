from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_staff', 'permissions']

    def get_permissions(self, obj):
        perms = obj.get_all_permissions()
        # Define Role-Based Permissions (Frontend Modules)
        role_permissions = {
            'ADMIN': ['view_dashboard', 'view_academics', 'view_student', 'view_parent', 'view_staff', 'view_finance', 'view_hostel', 'view_library', 'view_medical', 'view_transport', 'view_audit', 'view_school_events', 'view_notifications', 'add_student', 'change_student', 'delete_student', 'add_parent', 'change_parent', 'delete_parent', 'add_timetable', 'change_timetable', 'delete_timetable'],
            'PRINCIPAL': ['view_dashboard', 'view_academics', 'view_student', 'view_parent', 'view_staff', 'view_finance', 'view_hostel', 'view_library', 'view_medical', 'view_transport', 'add_timetable', 'change_timetable', 'delete_timetable'],
            'DEPUTY': ['view_dashboard', 'view_academics', 'view_student', 'view_parent', 'view_staff'],
            'DOS': ['view_dashboard', 'view_academics', 'view_staff', 'view_library', 'view_timetable', 'add_timetable', 'change_timetable', 'delete_timetable'], # Removed student/parent, Added Timetable R/W
            'REGISTRAR': ['view_dashboard', 'view_student', 'add_student', 'change_student', 'view_parent', 'add_parent', 'change_parent', 'view_staff', 'view_hostel', 'view_transport'], # Added R/W for Student/Parent
            'TEACHER': ['view_dashboard', 'view_academics', 'view_timetable'], # Timetable is R/W by default if not restricted in frontend, but permission is just 'view'
            'ACCOUNTANT': ['view_dashboard', 'view_finance'],
            'WARDEN': ['view_dashboard', 'view_hostel', 'view_transport'],
            'NURSE': ['view_dashboard', 'view_medical'],
            'LIBRARIAN': ['view_dashboard', 'view_library'],
            'ALUMNI': ['view_dashboard'],
            'STUDENT': ['view_dashboard', 'view_timetable', 'view_academics'],
            'PARENT': ['view_dashboard'],
        }

        # Get Django model permissions
        db_perms = [p for p in perms] 
        
        # Add synthetic permissions based on Role
        user_role = obj.role
        if user_role in role_permissions:
            db_perms.extend(role_permissions[user_role])
            
        return list(set(db_perms))

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'full_name']
    
    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '')
        user = User.objects.create_user(**validated_data)
        
        if full_name:
            names = full_name.split(' ', 1)
            user.first_name = names[0]
            if len(names) > 1:
                user.last_name = names[1]
            user.save()
            
        return user

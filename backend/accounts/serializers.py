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
        # Return as list of strings "action" (stripping app label)
        return [p for p in perms]

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

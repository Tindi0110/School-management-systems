import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Student, Parent
from students.serializers import StudentSerializer
import traceback

data = {
    'full_name': 'Test Guardian Child',
    'gender': 'M',
    'category': 'DAY',
    'status': 'ACTIVE',
    'date_of_birth': '2010-01-01',
    'guardian_name': 'Test Guardian Parent',
    'guardian_phone': '+254711111111',
    'guardian_email': 'parent@test.com'
}

serializer = StudentSerializer(data=data)
if serializer.is_valid():
    try:
        # Extract guardian data before saving
        g_name = serializer.validated_data.pop('guardian_name', None)
        g_phone = serializer.validated_data.pop('guardian_phone', None)
        g_email = serializer.validated_data.pop('guardian_email', None)
        g_relation = serializer.validated_data.pop('guardian_relation', 'GUARDIAN')
        g_address = serializer.validated_data.pop('guardian_address', '')
        g_is_primary = serializer.validated_data.pop('is_primary_guardian', True)
        
        print("Data Popped:", g_name, g_phone)
        
        student = serializer.save()
        print("Student Saved:", student.id)
        
        if g_name and g_phone:
            parent = Parent.objects.filter(phone=g_phone).first()
            if not parent:
                parent = Parent.objects.create(
                    full_name=g_name,
                    phone=g_phone,
                    email=g_email,
                    relationship=g_relation,
                    address=g_address,
                    is_primary=g_is_primary
                )
                print("Parent Created:", parent.id)
            else:
                print("Parent Found:", parent.id)
            if parent and not student.parents.filter(id=parent.id).exists():
                student.parents.add(parent)
                print("Parent Linked.")
                
    except Exception as e:
        print("Error during create:", e)
        traceback.print_exc()
else:
    print("Serializer Errors:", serializer.errors)

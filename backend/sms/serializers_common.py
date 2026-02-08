from rest_framework import serializers
from staff.models import Staff
from hostel.models import Hostel, Room, HostelAllocation
from finance.models import FeeStructure, Payment, StudentFeeRecord

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'

class HostelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hostel
        fields = '__all__'

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class HostelAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostelAllocation
        fields = '__all__'

class FeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructure
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class StudentFeeRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentFeeRecord
        fields = '__all__'

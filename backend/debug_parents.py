import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Parent
from students.serializers import ParentSerializer

print("--- Debugging Parents Data ---")

# 1. Count Parents
count = Parent.objects.count()
print(f"Total Parents in DB: {count}")

if count > 0:
    # 2. Try Serializing First Parent
    parent = Parent.objects.first()
    print(f"First Parent: {parent.full_name}")
    try:
        serializer = ParentSerializer(parent)
        data = serializer.data
        print("Serialization Successful!")
        print(json.dumps(data, indent=2, default=str))
    except Exception as e:
        print(f"Serialization FAILED: {e}")
        import traceback
        traceback.print_exc()

    # 3. Try Serializing All (simulating ViewSet)
    print("\nAttempting to serialize ALL parents (checking for bulk failure)...")
    try:
        parents = Parent.objects.all()
        serializer = ParentSerializer(parents, many=True)
        data = serializer.data
        print(f"Successfully serialized {len(data)} parents.")
    except Exception as e:
        print(f"Bulk Serialization FAILED: {e}")
        import traceback
        traceback.print_exc()
else:
    print("No parents found in database.")

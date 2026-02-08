import os
import django
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from students.models import Parent

def run():
    print(f"Parents in DB: {Parent.objects.count()}")
    for p in Parent.objects.all()[:5]:
        print(f" - {p.full_name} ({p.relationship})")

if __name__ == '__main__':
    run()

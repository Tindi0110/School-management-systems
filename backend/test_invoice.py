import os  
import django  
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')  
django.setup()  
from students.models import Student  
from finance.utils import get_or_create_invoice  
student = Student.objects.first()  
if student:  
    print('Testing invoice creation...')  
    try:  
        inv = get_or_create_invoice(student)  
        print('Success! Invoice:', inv)  
    except Exception as e:  
        print('Error:', type(e), e)  

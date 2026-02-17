import os
import django
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Setup Django to inspect models
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("--- Checking Django Users ---")
try:
    user_count = User.objects.count()
    print(f"Total Django Users: {user_count}")
    if user_count > 0:
        first_user = User.objects.first()
        print(f"Sample User: ID={first_user.id}, Username={first_user.username}, Role={first_user.role}, Email={first_user.email}")
except Exception as e:
    print(f"Error reading Django users: {e}")

print("\n--- Checking Supabase Auth Table Access ---")
DATABASE_URL = os.getenv('DATABASE_URL')
try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Try to read auth.users
    try:
        cur.execute("SELECT count(*) FROM auth.users;")
        auth_count = cur.fetchone()[0]
        print(f"Access granted to auth.users. Current Supabase Auth Users: {auth_count}")
    except Exception as e:
        print(f"Error accessing auth.users: {e}")
        print("Note: If this fails, we might need to use the Supabase Service Key API instead of direct SQL.")
        conn.rollback()

    cur.close()
    conn.close()
except Exception as e:
    print(f"Database connection failed: {e}")

import os
import sys
import django
import uuid
from dotenv import load_dotenv
import bcrypt
from datetime import datetime

load_dotenv()

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import connection

User = get_user_model()

def migrate_users():
    print("Starting migration to Supabase Auth...")
    
    # 1. Get all Django users
    django_users = User.objects.all()
    print(f"Found {django_users.count()} users to process.")
    
    # default password for migration
    DEFAULT_PASSWORD = "ChangeMe123!"
    hashed_password = bcrypt.hashpw(DEFAULT_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    migrated_count = 0
    updated_count = 0
    
    seen_emails = set()
    # Pre-fill seen emails from those already processed/linked
    for u in User.objects.exclude(supabase_id=None):
        seen_emails.add(u.email)

    with connection.cursor() as cursor:
        for user in django_users:
            if user.supabase_id:
                print(f"User {user.username} already linked (ID: {user.supabase_id}). Skipping.")
                continue

            current_email = user.email
            
            # Check if email is duplicate in our current run or generic
            # You might want to define "generic" logic, e.g. "test@test.com"
            if current_email in seen_emails:
                print(f"Duplicate email found for {user.username}: {current_email}")
                new_email = f"{user.username.lower().replace(' ', '')}@school.com"
                print(f"  -> Updating to unique email: {new_email}")
                user.email = new_email
                user.save()
                current_email = new_email
            
            seen_emails.add(current_email)

            # Check if email already exists in auth.users
            cursor.execute("SELECT id FROM auth.users WHERE email = %s", [current_email])
            existing = cursor.fetchone()
            
            if existing:
                supabase_uuid = existing[0]
                # Check if this UUID is already linked to another local user
                if User.objects.filter(supabase_id=supabase_uuid).exists():
                     print(f"CRITICAL: Auth User {supabase_uuid} ({current_email}) already linked to another local user!")
                     # Fallback: Generate unique email and create NEW auth user
                     new_email = f"{user.username.lower().replace(' ', '')}@school.com"
                     print(f"  -> Re-trying with unique email: {new_email}")
                     user.email = new_email
                     user.save()
                     current_email = new_email
                     seen_emails.add(current_email)
                     # Proceed to create new user below...
                     existing = None
                else:
                    print(f"User {current_email} already exists in Auth. Linking UUID: {supabase_uuid}")
                    user.supabase_id = supabase_uuid
                    user.save()
                    updated_count += 1
                    continue # Done with this user

            if not existing:
                # Create new user in auth.users
                new_uuid = str(uuid.uuid4())
                now = datetime.now()
                
                print(f"Migrating {user.username} ({user.email}) -> UUID: {new_uuid}")
                
                try:
                    cursor.execute("""
                        INSERT INTO auth.users (
                            instance_id,
                            id,
                            aud,
                            role,
                            email,
                            encrypted_password,
                            email_confirmed_at,
                            created_at,
                            updated_at,
                            raw_app_meta_data,
                            raw_user_meta_data,
                            is_super_admin
                        ) VALUES (
                            '00000000-0000-0000-0000-000000000000',
                            %s,
                            'authenticated',
                            'authenticated',
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            '{"provider": "email", "providers": ["email"]}',
                            %s,
                            false
                        )
                    """, [
                        new_uuid,
                        current_email,
                        hashed_password,
                        now,
                        now,
                        now,
                        f'{{"full_name": "{user.username}", "legacy_id": {user.id}}}'
                    ])
                    
                    # Update local model
                    user.supabase_id = new_uuid
                    user.save()
                    migrated_count += 1
                    
                except Exception as e:
                    print(f"Error migrating {user.email}: {e}")

    print(f"\nMigration Complete!")
    print(f"New Users Created: {migrated_count}")
    print(f"Existing Users Linked: {updated_count}")
    print(f"Total Processed: {migrated_count + updated_count}")

if __name__ == "__main__":
    migrate_users()

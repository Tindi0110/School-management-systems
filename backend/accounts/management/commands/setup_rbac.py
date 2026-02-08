from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from accounts.models import User

class Command(BaseCommand):
    help = 'Setup System Roles and Permissions'

    def handle(self, *args, **kwargs):
        self.stdout.write('Setting up RBAC...')

        # 1. Define Custom Permissions (Module Level)
        # We use a dummy content type for system-wide permissions
        ct, created = ContentType.objects.get_or_create(app_label='sms', model='system')
        
        permissions_map = {
            'view_dashboard': 'Can view dashboard',
            
            # Academics
            'view_academics': 'Can view academics module',
            'manage_academics': 'Can add/edit/delete academic records',
            
            # Students
            'view_students': 'Can view students module',
            'manage_students': 'Can add/edit/delete students',
            
            # Staff
            'view_staff': 'Can view staff module',
            'manage_staff': 'Can add/edit/delete staff',
            
            # Finance
            'view_finance': 'Can view finance reports',
            'manage_finance': 'Can add invoices/payments (Full Access)',
            
            # Hostel
            'view_hostel': 'Can view hostel module',
            'manage_hostel': 'Can manage hostels',
            
            # Transport
            'view_transport': 'Can view transport module',
            'manage_transport': 'Can manage transport',
            
            # Library
            'view_library': 'Can view library module',
            'manage_library': 'Can manage library',
            
            # Medical
            'view_medical': 'Can view medical module',
            'manage_medical': 'Can manage medical records',
            
            # Parents
            'view_parents': 'Can view parents module',
            'manage_parents': 'Can manage parents',
        }

        created_perms = {}
        for codename, name in permissions_map.items():
            perm, _ = Permission.objects.get_or_create(
                codename=codename,
                content_type=ct,
                defaults={'name': name}
            )
            created_perms[codename] = perm

        # 2. Define Roles and Assign Permissions
        roles_config = {
            'ADMIN': [
                # Admin has EVERYTHING EXCEPT Finance Edit
                'view_dashboard', 
                'view_academics', 'manage_academics',
                'view_students', 'manage_students',
                'view_staff', 'manage_staff',
                'view_finance', # View Only for Finance
                'view_hostel', 'manage_hostel',
                'view_transport', 'manage_transport',
                'view_library', 'manage_library',
                'view_medical', 'manage_medical',
                'view_parents', 'manage_parents'
            ],
            'SUPER_ADMIN': [
                # Has EVERYTHING
                'ALL' 
            ],
            'ACCOUNTANT': [
                'view_dashboard',
                'view_finance', 'manage_finance', # Full Finance Access
                'view_students', # Needs to see students to bill them
                'view_parents',
            ],
            'TEACHER': [
                'view_dashboard',
                'view_academics', 'manage_academics', # Can enter marks
                'view_students', # Can view students
                'view_parents',
                'view_library',
                'view_transport', # View schedule
            ],
            'WARDEN': [
                'view_dashboard',
                'view_hostel', 'manage_hostel',
                'view_transport', 'manage_transport', # Combined Role as requested
                'view_students',
            ],
            'NURSE': [
                'view_dashboard',
                'view_medical', 'manage_medical',
                'view_students',
            ],
            'LIBRARIAN': [
                'view_dashboard',
                'view_library', 'manage_library',
                'view_students',
            ],
            'PARENT': [
                # Parent Portal Access
                'view_dashboard', # Valid, but dashboard will be simplified for them
            ],
            'STUDENT': [
                # Student Portal Access
                'view_dashboard',
            ]
        }

        for role_name, perms_list in roles_config.items():
            group, _ = Group.objects.get_or_create(name=role_name)
            
            if 'ALL' in perms_list:
                # Assign all custom perms
                group.permissions.set(created_perms.values())
            else:
                # Assign specific perms
                current_perms = []
                for codename in perms_list:
                    if codename in created_perms:
                        current_perms.append(created_perms[codename])
                group.permissions.set(current_perms)
            
            self.stdout.write(f'Updated Role: {role_name} with {len(perms_list)} permissions')

        self.stdout.write(self.style.SUCCESS('RBAC Setup Complete'))

"""
accounts/migrations/0006_user_is_approved_user_is_email_verified_and_more.py

Data migration that:
1. Adds `is_approved` and `is_email_verified` fields.
2. Deduplicates all email values before applying the unique constraint.
   - Empty emails are replaced with username@placeholder.com
   - Duplicate real emails are suffixed with .N@... to make them unique
"""

from django.db import migrations, models


def deduplicate_emails(apps, schema_editor):
    """
    Ensures every user has a unique, non-empty email address.
    Must run before the unique constraint is applied to accounts_user.email.
    """
    User = apps.get_model('accounts', 'User')

    # Pass 1: Fix empty/null emails
    for user in User.objects.filter(email='').order_by('id'):
        candidate = f"{user.username}@placeholder.com"
        counter = 1
        while User.objects.filter(email=candidate).exists():
            candidate = f"{user.username}.{counter}@placeholder.com"
            counter += 1
        user.email = candidate
        user.save(update_fields=['email'])

    # Pass 2: Fix real-email duplicates
    # Group users by email and keep the first one unchanged; rename the rest.
    from collections import defaultdict
    email_groups = defaultdict(list)
    for user in User.objects.all().order_by('id'):
        email_groups[user.email.lower()].append(user)

    for email, users in email_groups.items():
        if len(users) <= 1:
            continue
        # Keep the account with the lowest id (oldest); rename subsequent duplicates
        for idx, user in enumerate(users[1:], start=1):
            name, domain = user.email.rsplit('@', 1)
            candidate = f"{name}.{idx}@{domain}"
            counter = 1
            while User.objects.filter(email=candidate).exists():
                candidate = f"{name}.{idx}.{counter}@{domain}"
                counter += 1
            user.email = candidate
            user.save(update_fields=['email'])


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_alter_user_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_approved',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='is_email_verified',
            field=models.BooleanField(default=False),
        ),
        # Deduplicate BEFORE the unique constraint is created
        migrations.RunPython(deduplicate_emails, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(max_length=254, unique=True),
        ),
    ]

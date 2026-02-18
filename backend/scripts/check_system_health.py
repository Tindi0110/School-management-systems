import os
import sys
import django
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
import shutil

# Setup Django Environment
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sms.settings")
django.setup()

def check_database():
    try:
        connection.ensure_connection()
        return "✅ Database Connected"
    except Exception as e:
        return f"❌ Database Error: {e}"

def check_migrations():
    try:
        executor = MigrationExecutor(connection)
        targets = executor.loader.graph.leaf_nodes()
        if executor.migration_plan(targets):
            return "⚠️ Unapplied Migrations Found"
        return "✅ All Migrations Applied"
    except Exception as e:
        return f"❌ Migration Check Failed: {e}"

def check_disk_space():
    total, used, free = shutil.disk_usage("/")
    free_gb = free // (2**30)
    if free_gb < 1:
        return f"⚠️ Low Disk Space: {free_gb}GB free"
    return f"✅ Disk Space OK: {free_gb}GB free"

if __name__ == "__main__":
    print("--- System Health Check ---")
    print(check_database())
    print(check_migrations())
    print(check_disk_space())
    print("-------------------------")

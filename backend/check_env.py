import sys
import os

print(f"Python executable: {sys.executable}")
print(f"Path: {sys.path}")

try:
    import django
    print(f"Django version: {django.get_version()}")
except ImportError:
    print("Django NOT found")

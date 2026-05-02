import sys
print("Python version:", sys.version)
print("Path:", sys.path)
try:
    import django
    print("Django version:", django.get_version())
except ImportError:
    print("Django not found")

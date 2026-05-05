import ast
import os
import sys

def get_imports(node):
    for subnode in ast.walk(node):
        if isinstance(subnode, ast.Import):
            for alias in subnode.names:
                yield alias.asname or alias.name.split('.')[0], alias.name, subnode.lineno
        elif isinstance(subnode, ast.ImportFrom):
            if subnode.module == '__future__':
                continue
            for alias in subnode.names:
                yield alias.asname or alias.name, f"{subnode.module}.{alias.name}", subnode.lineno

def get_used_names(node):
    for subnode in ast.walk(node):
        if isinstance(subnode, ast.Name):
            yield subnode.id
        elif isinstance(subnode, ast.Attribute):
            # Check for cases like 'os.path' where 'os' is the Name
            if isinstance(subnode.value, ast.Name):
                yield subnode.value.id

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        try:
            tree = ast.parse(content)
        except Exception as e:
            print(f"Error parsing {filepath}: {e}")
            return

    imports = list(get_imports(tree))
    used_names = set(get_used_names(tree))
    
    # Also check if the name is used in string type annotations (simplified)
    # This is a bit of a hack but helps avoid some false positives
    import re
    
    unused = []
    for local_name, full_name, lineno in imports:
        # Skip names starting with _ in __init__.py as they might be exported
        if os.path.basename(filepath) == '__init__.py':
            continue
            
        if local_name not in used_names:
            # Check if it appears in any string (e.g. Foreign Key reference or type hint)
            if not re.search(r'[\'"]' + re.escape(local_name) + r'[\'"]', content):
                unused.append((full_name, lineno))
    
    if unused:
        print(f"FILE:{filepath}")
        for name, lineno in unused:
            print(f"LINE:{lineno}:NAME:{name}")

def main(root_dir):
    target_files = {
        'views.py', 'utils.py', 'tests.py', 'signals.py', 
        'serializers.py', 'permissions.py', 'permission.py',
        'models.py', 'apps.py', 'admin.py', '__init__.py'
    }
    for root, dirs, files in os.walk(root_dir):
        if any(exc in root for exc in ['venv', '.git', '__pycache__', 'migrations']):
            continue
        for file in files:
            if file in target_files:
                check_file(os.path.join(root, file))

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else '.')

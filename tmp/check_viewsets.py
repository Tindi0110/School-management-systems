import os
import ast

def check_viewsets():
    backend_dir = r'c:\Users\Evans\School management system\backend'
    for root, dirs, files in os.walk(backend_dir):
        if 'venv' in root or '__pycache__' in root:
            continue
        for file in files:
            if file == 'views.py':
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                try:
                    tree = ast.parse(content)
                    for node in ast.walk(tree):
                        if isinstance(node, ast.ClassDef):
                            if 'ViewSet' in node.name:
                                has_queryset = False
                                for child in node.body:
                                    if isinstance(child, ast.Assign):
                                        for target in child.targets:
                                            if isinstance(target, ast.Name) and target.id == 'queryset':
                                                has_queryset = True
                                if not has_queryset:
                                    print(f"File: {path} | Class: {node.name} lacks 'queryset' attribute.")
                except Exception as e:
                    print(f"Failed to parse {path}: {e}")

if __name__ == "__main__":
    check_viewsets()

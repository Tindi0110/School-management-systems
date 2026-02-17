import re

file_path = r'c:\Users\Evans\School management system\frontend\src\api\api.ts'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Update baseURL to ensure it has a trailing slash for relative appending
content = content.replace("baseURL: API_BASE_URL,", "baseURL: API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`,")

# 2. Replace api.get('/path/') with api.get('path/') 
# Handles single quotes
content = re.sub(r"api\.(get|post|put|patch|delete)\('/", r"api.\1('", content)
# Handles backticks (template literals)
content = re.sub(r"api\.(get|post|put|patch|delete)\(`/", r"api.\1(`", content)

with open(file_path, 'w') as f:
    f.write(content)

print("Successfully updated api.ts with correct pathing logic.")

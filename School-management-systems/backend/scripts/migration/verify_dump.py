import json
from collections import Counter

DUMP_PATH = r'C:\Users\Evans\School management system\School-management-systems\backend\migration_data.json'

with open(DUMP_PATH, 'r') as f:
    data = json.load(f)

counts = Counter(item['model'] for item in data)

print("--- Objects in JSON by Model ---")
for model, count in sorted(counts.items()):
    print(f"{model}: {count}")

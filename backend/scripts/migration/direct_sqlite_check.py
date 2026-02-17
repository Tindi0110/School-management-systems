import sqlite3
import os

DB_PATHS = [
    r'c:\Users\Evans\School management system\backend\db.sqlite3',
    r'c:\Users\Evans\School management system\School-management-systems\backend\db.sqlite3',
    r'c:\Users\Evans\School management system\School-management-systems\School-management-systems\backend\db.sqlite3'
]

for path in DB_PATHS:
    if os.path.exists(path):
        print(f"\nChecking: {path}")
        try:
            conn = sqlite3.connect(path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='accounts_user';")
            if cursor.fetchone():
                cursor.execute("SELECT COUNT(*) FROM accounts_user;")
                count = cursor.fetchone()[0]
                print(f"Table 'accounts_user' exists. Count: {count}")
                if count > 0:
                    cursor.execute("SELECT username, role FROM accounts_user LIMIT 5;")
                    for row in cursor.fetchall():
                        print(f"  - {row[0]} ({row[1]})")
            else:
                print("Table 'accounts_user' DOES NOT EXIST.")
            conn.close()
        except Exception as e:
            print(f"Error: {e}")
    else:
        print(f"Path DOES NOT EXIST: {path}")

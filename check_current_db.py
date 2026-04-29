import sqlite3

conn = sqlite3.connect('medisync_memory.db')
cursor = conn.cursor()

print("=== Current Database Contents ===")
cursor.execute("SELECT * FROM user_profiles")
data = cursor.fetchall()

if data:
    for row in data:
        print(f"ID: {row[0]}, Name: {row[1]}, Condition: {row[2]}")
else:
    print("No data found in database")

conn.close()
print("=== End ===")

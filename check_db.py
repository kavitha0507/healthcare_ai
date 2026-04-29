import sqlite3

conn = sqlite3.connect('medisync_memory.db')
cursor = conn.cursor()

# Check if tables exist
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables in database:", tables)

# Check user_profiles table if it exists
if ('user_profiles',) in [t[0] for t in tables]:
    cursor.execute("SELECT * FROM user_profiles")
    users = cursor.fetchall()
    print("Users in database:", users)
else:
    print("user_profiles table not found")

conn.close()

import sqlite3
import os

def view_database():
    db_path = "medisync_memory.db"
    
    print(f"🗄️  Database Location: {os.path.abspath(db_path)}")
    print("=" * 50)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Show table info
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        print(f"📋 Tables in database: {[table[0] for table in tables]}")
        print()
        
        # Show user_profiles data
        cursor.execute("SELECT * FROM user_profiles")
        data = cursor.fetchall()
        
        if data:
            print("👥 User Profiles:")
            print("-" * 30)
            for row in data:
                print(f"ID: {row[0]}")
                print(f"Name: {row[1]}")
                print(f"Condition: {row[2]}")
                print("-" * 30)
        else:
            print("📭 No user profiles found")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    view_database()

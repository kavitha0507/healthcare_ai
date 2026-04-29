import sqlite3
import requests

def test_database():
    print("=== Testing MediSync Database ===")
    
    # 1. Check database connection
    try:
        conn = sqlite3.connect('medisync_memory.db')
        cursor = conn.cursor()
        print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return
    
    # 2. Check table structure
    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"✅ Tables found: {[table[0] for table in tables]}")
    except Exception as e:
        print(f"❌ Table check failed: {e}")
    
    # 3. Check current data
    try:
        cursor.execute("SELECT * FROM user_profiles")
        data = cursor.fetchall()
        print(f"✅ Current data in database:")
        for row in data:
            print(f"   ID: {row[0]}, Name: {row[1]}, Condition: {row[2]}")
    except Exception as e:
        print(f"❌ Data retrieval failed: {e}")
    
    # 4. Test API save operation
    try:
        response = requests.get("http://localhost:8000/advise?user_query=save my name TestUser and condition diabetes")
        print(f"✅ API save test: {response.status_code}")
        print(f"   Response: {response.json()['response'][:100]}...")
    except Exception as e:
        print(f"❌ API save test failed: {e}")
    
    # 5. Test API retrieve operation
    try:
        response = requests.get("http://localhost:8000/advise?user_query=hello")
        print(f"✅ API retrieve test: {response.status_code}")
        print(f"   Response: {response.json()['response'][:100]}...")
    except Exception as e:
        print(f"❌ API retrieve test failed: {e}")
    
    conn.close()
    print("=== Database Test Complete ===")

if __name__ == "__main__":
    test_database()

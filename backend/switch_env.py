#!/usr/bin/env python
"""
Switch between local and Railway environments
Usage: python switch_env.py
"""

import shutil
import os

def show_current():
    """Show current environment"""
    if os.path.exists('.env.current'):
        with open('.env.current', 'r') as f:
            current = f.read().strip()
        print(f"\n📍 Currently using: {current.upper()}")
    else:
        print("\n📍 No environment set")

def switch_to_local():
    """Switch to local database"""
    if os.path.exists('.env'):
        shutil.copy('.env', '.env.backup')
    
    if os.path.exists('.env.local'):
        shutil.copy('.env.local', '.env')
    else:
        # Create default local .env if not exists
        with open('.env.local', 'w') as f:
            f.write("""# Database - LOCAL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=12345678
DB_NAME=german_garage
DATABASE_URL=mysql+pymysql://root:12345678@localhost:3306/german_garage

# JWT Auth
SECRET_KEY=*************************************************
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# App
APP_ENV=development
ENV=development
FRONTEND_URL=http://127.0.0.1:5500
MAX_FAILED_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
""")
        shutil.copy('.env.local', '.env')
    
    with open('.env.current', 'w') as f:
        f.write('local')
    
    print("✅ Switched to LOCAL environment")
    print("   Database: localhost:3306/german_garage")

def switch_to_railway():
    """Switch to Railway database"""
    if not os.path.exists('.env.railway'):
        print("\n❌ .env.railway file not found!")
        print("   Please create .env.railway with:")
        print("   DB_HOST=your-railway-host.railway.app")
        print("   DB_PASSWORD=your-password")
        print("   DB_NAME=railway")
        return
    
    if os.path.exists('.env'):
        shutil.copy('.env', '.env.backup')
    
    shutil.copy('.env.railway', '.env')
    
    with open('.env.current', 'w') as f:
        f.write('railway')
    
    # Verify connection
    print("✅ Switched to RAILWAY environment")
    print("   Testing connection...")
    os.system('python -c "from app.database import SessionLocal; db=SessionLocal(); print(\'   ✅ Connected to Railway!\'); db.close()"')

if __name__ == "__main__":
    print("\n" + "="*40)
    print("🌍 ENVIRONMENT SWITCHER")
    print("="*40)
    
    show_current()
    
    print("\n1. Local Database (Development)")
    print("2. Railway Database (Production)")
    print("3. Show current")
    
    choice = input("\nSelect (1/2/3): ")
    
    if choice == "1":
        switch_to_local()
    elif choice == "2":
        switch_to_railway()
    elif choice == "3":
        show_current()
    else:
        print("Invalid choice")
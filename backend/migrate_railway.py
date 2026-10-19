#!/usr/bin/env python
"""
Run migrations on Railway database using .env.railway
Usage: python migrate_railway.py
"""

import os
import sys
from dotenv import load_dotenv

def main():
    print("\n" + "="*60)
    print("🚀 RAILWAY DATABASE MIGRATION")
    print("="*60)
    
    # Load Railway credentials from .env.railway
    if not os.path.exists('.env.railway'):
        print("\n❌ .env.railway file not found!")
        print("   Please create .env.railway with your Railway database credentials")
        sys.exit(1)
    
    load_dotenv('.env.railway')
    
    # Verify we have Railway credentials
    db_host = os.getenv('DB_HOST', '')
    if 'railway.app' not in db_host:
        print("\n⚠️  Warning: DB_HOST doesn't contain 'railway.app'")
        print(f"   Current DB_HOST: {db_host}")
        print("   Make sure .env.railway has correct Railway credentials")
        response = input("   Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    print(f"\n📡 Target Database: RAILWAY")
    print(f"   Host: {db_host}")
    print(f"   Database: {os.getenv('DB_NAME')}")
    print(f"   User: {os.getenv('DB_USER')}")
    
    # Test connection
    print("\n🔌 Testing connection to Railway...")
    try:
        import pymysql
        conn = pymysql.connect(
            host=os.getenv('DB_HOST'),
            port=int(os.getenv('DB_PORT', 3306)),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME'),
            connect_timeout=10
        )
        conn.close()
        print("   ✅ Connected successfully!")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        print("\n   Troubleshooting:")
        print("   1. Check if Railway MySQL service is running")
        print("   2. Verify credentials in .env.railway")
        print("   3. Check if your IP is allowed in Railway")
        sys.exit(1)
    
    # Create a temporary .env file for Alembic
    print("\n📝 Preparing Alembic configuration...")
    
    # Read current .env (local) to preserve non-database settings
    local_env = {}
    if os.path.exists('.env'):
        load_dotenv('.env')
        for key in ['SECRET_KEY', 'ALGORITHM', 'ACCESS_TOKEN_EXPIRE_MINUTES', 
                    'REFRESH_TOKEN_EXPIRE_DAYS', 'APP_ENV', 'ENV', 
                    'FRONTEND_URL', 'MAX_FAILED_LOGIN_ATTEMPTS', 'LOCKOUT_DURATION_MINUTES']:
            if os.getenv(key):
                local_env[key] = os.getenv(key)
    
    # Create temporary .env with Railway DB + local settings
    with open('.env.temp', 'w') as f:
        # Write Railway database settings
        f.write(f"DB_HOST={os.getenv('DB_HOST')}\n")
        f.write(f"DB_PORT={os.getenv('DB_PORT')}\n")
        f.write(f"DB_USER={os.getenv('DB_USER')}\n")
        f.write(f"DB_PASSWORD={os.getenv('DB_PASSWORD')}\n")
        f.write(f"DB_NAME={os.getenv('DB_NAME')}\n")
        f.write(f"DATABASE_URL={os.getenv('DATABASE_URL')}\n")
        # Write other settings
        for key, value in local_env.items():
            f.write(f"{key}={value}\n")
    
    # Run migrations using temporary .env
    print("🔄 Running migrations on Railway...")
    os.environ['DOTENV_FILE'] = '.env.temp'
    
    # Run alembic commands
    result = os.system("alembic current")
    if result != 0:
        print("   ⚠️  No existing migrations, starting fresh...")
    
    result = os.system("alembic upgrade head")
    
    if result == 0:
        print("   ✅ Migrations applied successfully!")
    else:
        print("   ❌ Migration failed!")
        os.remove('.env.temp')
        sys.exit(1)
    
    # Clean up
    os.remove('.env.temp')
    
    # Verify
    print("\n🔍 Verifying Railway database schema...")
    from sqlalchemy import create_engine, inspect
    from app.database import DATABASE_URL
    
    engine = create_engine(os.getenv('DATABASE_URL'))
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print(f"\n   Tables in Railway ({len(tables)}):")
    for table in sorted(tables):
        print(f"   ✅ {table}")
    
    # Check if categories exist
    if 'categories' in tables:
        with engine.connect() as conn:
            from sqlalchemy import text
            result = conn.execute(text("SELECT COUNT(*) FROM categories"))
            count = result.fetchone()[0]
            print(f"\n   📁 Categories count: {count}")
    
    print("\n" + "="*60)
    print("✅ RAILWAY MIGRATION COMPLETE!")
    print("="*60)
    
    # Ask about seeding
    print("\n📊 Next steps:")
    print("   1. Run: python seed_railway.py  (to seed categories and admin)")
    print("   2. Or restore local .env and continue development")
    
    response = input("\n   Run seed data on Railway? (y/n): ")
    if response.lower() == 'y':
        os.system("python seed_railway.py")

if __name__ == "__main__":
    main()
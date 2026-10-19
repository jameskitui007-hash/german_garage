#!/usr/bin/env python
"""
Seed data on Railway database using .env.railway
Usage: python seed_railway.py
"""

import os
import sys
from dotenv import load_dotenv

def main():
    print("\n" + "="*60)
    print("🌱 SEEDING RAILWAY DATABASE")
    print("="*60)
    
    # Load Railway credentials
    if not os.path.exists('.env.railway'):
        print("\n❌ .env.railway not found!")
        sys.exit(1)
    
    load_dotenv('.env.railway')
    
    # Create temporary .env for seeding
    with open('.env.temp', 'w') as f:
        f.write(f"DB_HOST={os.getenv('DB_HOST')}\n")
        f.write(f"DB_PORT={os.getenv('DB_PORT')}\n")
        f.write(f"DB_USER={os.getenv('DB_USER')}\n")
        f.write(f"DB_PASSWORD={os.getenv('DB_PASSWORD')}\n")
        f.write(f"DB_NAME={os.getenv('DB_NAME')}\n")
        f.write(f"DATABASE_URL={os.getenv('DATABASE_URL')}\n")
    
    # Run seed scripts
    scripts = [
        ('seed_categories.py', 'Seeding categories'),
        ('seed.py', 'Seeding admin and settings'),
    ]
    
    for script, description in scripts:
        print(f"\n🔄 {description}...")
        result = os.system(f"python {script}")
        if result == 0:
            print(f"   ✅ {description} complete!")
        else:
            print(f"   ❌ {description} failed!")
    
    # Clean up
    os.remove('.env.temp')
    
    print("\n" + "="*60)
    print("✅ RAILWAY SEEDING COMPLETE!")
    print("="*60)

if __name__ == "__main__":
    main()
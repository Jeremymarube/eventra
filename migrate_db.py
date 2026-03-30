#!/usr/bin/env python3
"""
# Direct migration script to add status field to events table
Run this when Flask CLI has import issues
"""

import sys
import os
from pathlib import Path

# Add the server directory to Python path
server_dir = Path(__file__).parent / 'server'
sys.path.insert(0, str(server_dir))

try:
    from server import create_app
    from flask_migrate import upgrade, migrate, init
    from flask import current_app

    app = create_app()

    with app.app_context():
        print("🔄 Checking migrations directory...")

        migrations_dir = Path(__file__).parent / 'migrations'
        if not migrations_dir.exists() or not any(migrations_dir.iterdir()):
            print("🔄 Initializing migrations...")
            init()
            print("✅ Migrations initialized")
        else:
            print("ℹ️  Migrations directory already exists, skipping init")

        print("🔄 Creating migration for status field...")
        migrate(message="Add status field to events")
        print("✅ Migration script created")

        print("🔄 Applying migration...")
        upgrade()
        print("✅ Migration applied successfully!")

        print("\n🎉 Database migration completed!")
        print("Your Event model now has the status field.")

except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this from the project root directory")
except Exception as e:
    print(f"❌ Migration error: {e}")
    print("You may need to run this manually or check your database setup")

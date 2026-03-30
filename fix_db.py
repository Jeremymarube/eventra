#!/usr/bin/env python3
"""
Manual database fix to add created_by column to events table
"""

import sqlite3
import os
from pathlib import Path

# Find the database file
project_dir = Path(__file__).parent
db_paths = [
    project_dir / 'server' / 'event_ticketing.db',
    project_dir / 'event_ticketing.db',
    project_dir / 'server' / 'instance' / 'event_ticketing.db'
]

db_path = None
for path in db_paths:
    if path.exists():
        db_path = path
        break

if not db_path:
    print("❌ Could not find database file")
    print("Looking for event_ticketing.db in:")
    for path in db_paths:
        print(f"  - {path}")
    exit(1)

print(f"📁 Found database: {db_path}")

try:
    # Connect to database
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # Check if column exists
    cursor.execute("PRAGMA table_info(events)")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]

    if 'created_by' in column_names:
        print("✅ created_by column already exists")
    else:
        print("🔄 Adding created_by column...")

        # Add the column
        cursor.execute("""
            ALTER TABLE events
            ADD COLUMN created_by INTEGER REFERENCES users(id)
        """)

        # Commit changes
        conn.commit()
        print("✅ created_by column added successfully!")

    # Verify the column was added
    cursor.execute("PRAGMA table_info(events)")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]
    print(f"\n📋 Events table columns: {', '.join(column_names)}")

    if 'created_by' in column_names:
        print("✅ SUCCESS: created_by column is now in the database!")
    else:
        print("❌ FAILED: created_by column was not added")

except Exception as e:
    print(f"❌ Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()

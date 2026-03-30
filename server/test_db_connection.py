from app import create_app
from models import db

def test_db_connection():
    app = create_app()
    
    with app.app_context():
        try:
            # Test database connection
            db.engine.connect()
            print("✅ Successfully connected to the database!")
            
            # List all tables
            print("\n📋 Database tables:")
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            for table in tables:
                print(f"- {table}")
                
            # Count records in each table
            print("\n📊 Table record counts:")
            from sqlalchemy import text
            for table in tables:
                result = db.session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"- {table}: {count} records")
                
        except Exception as e:
            print(f"❌ Error connecting to the database: {e}")
        finally:
            db.session.remove()

if __name__ == "__main__":
    test_db_connection()

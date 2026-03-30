from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from utils import mail
from sqlalchemy import text
import os

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    
    # Configure CORS with specific settings
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",  # Allow all origins for testing
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "expose_headers": ["Content-Type", "Content-Length", "Authorization"],
            "supports_credentials": False,  # Must be False when origins="*"
            "max_age": 600
        }
    })
    
    # Remove any duplicate CORS headers
    @app.after_request
    def after_request(response):
        # Remove any duplicate CORS headers that might have been added
        cors_headers = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Credentials',
            'Access-Control-Allow-Methods',
            'Access-Control-Allow-Headers',
            'Access-Control-Expose-Headers'
        ]
        
        # Ensure only one instance of each CORS header exists
        for header in cors_headers:
            if header in response.headers:
                values = response.headers.get_all(header)
                if values and len(values) > 1:
                    # Keep only the first occurrence
                    response.headers.set(header, values[0])
        
        return response
    
    JWTManager(app)
    mail.init_app(app)
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.categories import categories_bp
    from routes.events import events_bp
    from routes.seats import seats_bp
    from routes.payments import payments_bp
    from routes.bookings import bookings_bp, tickets_bp
    from routes.admin import admin_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(seats_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(tickets_bp)
    app.register_blueprint(admin_bp)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    # Health check
    @app.route('/health')
    def health_check():
        return jsonify({'status': 'healthy'}), 200
    
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        upload_dir = app.config.get('UPLOAD_FOLDER', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads'))
        return send_from_directory(upload_dir, filename)

    @app.route('/')
    def index():
        return jsonify({
            'message': 'Event Ticketing System API',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'categories': '/api/categories',
                'events': '/api/events',
                'seats': '/api/seats',
                'payments': '/api/payments',
                'bookings': '/api/bookings',
                'tickets': '/api/tickets',
                'admin': '/api/admin'
            }
        }), 200
    

    return app

if __name__ == '__main__':
    app = create_app()
    
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Create indexes for performance
        try:
            conn = db.engine.connect()
            conn.execute("CREATE INDEX IF NOT EXISTS idx_seats_event_status ON seats(event_id, status)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_bookings_event_status ON bookings(event_id, status)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_seats_reservation ON seats(status, reserved_until)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)")
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Note: Some indexes could not be created: {e}")
        
        # Ensure DB schema migrations for simple column additions (dev convenience)
        try:
            conn = db.engine.connect()
            # Bookings table columns
            res = conn.execute(text("PRAGMA table_info('bookings')")).fetchall()
            cols = [row[1] for row in res]
            if 'renewal_count' not in cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN renewal_count INTEGER DEFAULT 0"))
            if 'last_renewed' not in cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN last_renewed DATETIME"))

            # Users table columns
            res = conn.execute(text("PRAGMA table_info('users')")).fetchall()
            cols = [row[1] for row in res]
            if 'google_id' not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR(255)"))
            
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Note: Some migrations could not be applied: {e}")
        
        # Seed initial data if needed
        from models import Category, User
        
        # Add status column to users table if it doesn't exist (run before any queries)
        try:
            db.session.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'"))
            print("✓ Added status column to users table")
        except Exception as e:
            # Column might already exist, ignore the error
            if "duplicate column name" not in str(e).lower():
                print(f"Note: Could not add status column: {e}")
        
        # Update existing users to have active status if they don't have one
        try:
            db.session.execute(text("UPDATE users SET status = 'active' WHERE status IS NULL"))
            db.session.commit()
            print("✓ Set default status for existing users")
        except Exception as e:
            print(f"Note: Could not update existing users: {e}")
        
        if Category.query.count() == 0:
            categories = [
                Category(name='Music', slug='music', description='Concerts and music events'),
                Category(name='Tech', slug='tech', description='Technology conferences and meetups'),
                Category(name='Sports', slug='sports', description='Sports events and competitions'),
                Category(name='Business', slug='business', description='Business conferences and networking')
            ]
            for category in categories:
                db.session.add(category)
            
            print("✓ Created default categories")
        
        if User.query.filter_by(is_admin=True).count() == 0:
            admin = User(
                email='admin@eventtickets.com',
                full_name='Admin User',
                phone='+254700000000',
                is_admin=True
            )
            admin.set_password('admin123')
            db.session.add(admin)
            print("✓ Created admin user (email: admin@eventtickets.com, password: admin123)")
        
        db.session.commit()
    
    app.run(debug=True, host='0.0.0.0', port=5000)

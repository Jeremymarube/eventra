import os
import sys
import pytest
from datetime import datetime, timedelta

# Add the parent directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db as _db
from models import User, Event, Category, Booking, Payment, Ticket, Seat

# Test configuration
TEST_DATABASE_URI = 'sqlite:///:memory:'

def create_test_data(db):
    """Create test data in the database."""
    # Create test categories
    category1 = Category(name='Music', slug='music', description='Music events')
    category2 = Category(name='Tech', slug='tech', description='Tech events')
    db.session.add_all([category1, category2])
    
    # Create test users
    admin_user = User(
        email='admin@example.com',
        full_name='Admin User',
        phone='+1234567890',
        is_admin=True
    )
    admin_user.set_password('admin123')
    
    regular_user = User(
        email='user@example.com',
        full_name='Regular User',
        phone='+1234567891'
    )
    regular_user.set_password('user123')
    
    db.session.add_all([admin_user, regular_user])
    
    # Create test events
    event1 = Event(
        title='Concert in the Park',
        description='A wonderful concert in the park',
        category_id=1,
        venue='Central Park',
        date=datetime.utcnow() + timedelta(days=30),
        price=50.00,
        total_seats=100,
        is_published=True
    )
    
    event2 = Event(
        title='Tech Conference',
        description='Annual tech conference',
        category_id=2,
        venue='Convention Center',
        date=datetime.utcnow() + timedelta(days=60),
        price=199.99,
        total_seats=200,
        is_published=True
    )
    
    db.session.add_all([event1, event2])
    db.session.commit()
    
    # Create seats for events
    for event in [event1, event2]:
        for i in range(1, event.total_seats + 1):
            seat = Seat(
                event_id=event.id,
                seat_number=f"A{i}",
                status='available'
            )
            db.session.add(seat)
    
    db.session.commit()

@pytest.fixture(scope='session')
def app():
    """Create and configure a new app instance for each test."""
    # Create a test config
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': TEST_DATABASE_URI,
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'JWT_SECRET_KEY': 'test-secret-key',
        'WTF_CSRF_ENABLED': False
    })

    # Create the database and load test data
    with app.app_context():
        _db.create_all()
        create_test_data(_db)
        
        yield app
        
        # Clean up
        _db.session.remove()
        _db.drop_all()

@pytest.fixture(scope='session')
def db(app):
    """Get the test database."""
    with app.app_context():
        yield _db

@pytest.fixture(scope='function')
client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture(scope='function')
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

@pytest.fixture
def admin_headers(app):
    """Generate headers with admin JWT token."""
    with app.app_context():
        access_token = app.extensions['jwt-manager']._create_access_token(
            identity=1,  # admin user ID
            additional_claims={'is_admin': True}
        )
        return {
            'Authorization': f'Bearer {access_token}'
        }

@pytest.fixture
def user_headers(app):
    """Generate headers with regular user JWT token."""
    with app.app_context():
        access_token = app.extensions['jwt-manager']._create_access_token(
            identity=2  # regular user ID
        )
        return {
            'Authorization': f'Bearer {access_token}'
        }

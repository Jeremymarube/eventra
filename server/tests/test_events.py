import pytest
from datetime import datetime, timedelta
from models import Event, Category, db as _db

class TestEventsAPI:
    def test_get_events(self, client, admin_headers):
        """Test getting all events."""
        response = client.get('/api/events', headers=admin_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert 'items' in data
        assert len(data['items']) > 0
        assert 'total' in data
        assert 'pages' in data

    def test_get_single_event(self, client, admin_headers):
        """Test getting a single event by ID."""
        # First, get an event ID from the database
        event = Event.query.first()
        response = client.get(f'/api/events/{event.id}', headers=admin_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['id'] == event.id
        assert 'title' in data
        assert 'description' in data
        assert 'category' in data

    def test_create_event(self, client, admin_headers, db):
        """Test creating a new event."""
        category = Category.query.first()
        event_data = {
            'title': 'New Test Event',
            'description': 'This is a test event',
            'category_id': category.id,
            'venue': 'Test Venue',
            'date': (datetime.utcnow() + timedelta(days=30)).isoformat(),
            'price': 99.99,
            'total_seats': 50,
            'is_published': True
        }
        
        response = client.post(
            '/api/events',
            json=event_data,
            headers=admin_headers
        )
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['title'] == event_data['title']
        assert data['category_id'] == category.id
        
        # Verify the event was created in the database
        event = Event.query.get(data['id'])
        assert event is not None
        assert event.title == event_data['title']
        
        # Clean up
        _db.session.delete(event)
        _db.session.commit()

    def test_update_event(self, client, admin_headers, db):
        """Test updating an existing event."""
        event = Event.query.first()
        original_title = event.title
        updated_title = 'Updated ' + original_title
        
        response = client.put(
            f'/api/events/{event.id}',
            json={'title': updated_title},
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['title'] == updated_title
        
        # Verify the event was updated in the database
        updated_event = Event.query.get(event.id)
        assert updated_event.title == updated_title
        
        # Revert the change
        updated_event.title = original_title
        _db.session.commit()

    def test_delete_event(self, client, admin_headers, db):
        """Test deleting an event."""
        # First create a test event to delete
        category = Category.query.first()
        event = Event(
            title='Event to Delete',
            description='This event will be deleted',
            category_id=category.id,
            venue='Test Venue',
            date=datetime.utcnow() + timedelta(days=60),
            price=49.99,
            total_seats=30,
            is_published=False
        )
        _db.session.add(event)
        _db.session.commit()
        
        # Now delete it
        response = client.delete(
            f'/api/events/{event.id}',
            headers=admin_headers
        )
        
        assert response.status_code == 200
        
        # Verify the event was deleted
        deleted_event = Event.query.get(event.id)
        assert deleted_event is None

    def test_unauthorized_access(self, client):
        """Test that unauthorized users cannot access protected endpoints."""
        # Test without any authentication
        response = client.get('/api/events')
        assert response.status_code == 401  # Unauthorized
        
        # Test with regular user token (non-admin)
        response = client.get('/api/events', headers=user_headers)
        assert response.status_code == 403  # Forbidden

    def test_event_validation(self, client, admin_headers):
        """Test event validation."""
        # Test with missing required fields
        response = client.post(
            '/api/events',
            json={'title': 'Incomplete Event'},  # Missing required fields
            headers=admin_headers
        )
        assert response.status_code == 400
        
        # Test with invalid date
        response = client.post(
            '/api/events',
            json={
                'title': 'Invalid Date Event',
                'description': 'Test',
                'category_id': 1,
                'venue': 'Test',
                'date': 'invalid-date',
                'price': 10.0,
                'total_seats': 10
            },
            headers=admin_headers
        )
        assert response.status_code == 400

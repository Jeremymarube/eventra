#!/usr/bin/env python
"""Simple test: create an event via test client and verify seat generation"""
from app import create_app
from models import db, User, Event, Seat
from flask_jwt_extended import create_access_token

app = create_app()

with app.app_context():
    db.create_all()
    admin = User.query.filter_by(email='admin@eventtickets.com').first()
    if not admin:
        admin = User(email='admin@eventtickets.com', full_name='Admin User', is_admin=True)
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()

    token = create_access_token(identity=admin.id)

    client = app.test_client()

    payload = {
        'title': 'Test Event API',
        'description': 'Testing event creation',
        'category_id': 1,
        'venue': 'Test Hall',
        'date': '2026-03-01T18:00',
        'price': 15.0,
        'total_seats': 20,
        'image_url': ''
    }

    # Ensure category exists
    from models import Category
    if Category.query.count() == 0:
        cat = Category(name='Test', slug='test')
        db.session.add(cat)
        db.session.commit()
        payload['category_id'] = cat.id
    else:
        payload['category_id'] = Category.query.first().id

    resp = client.post('/api/events', json=payload, headers={'Authorization': f'Bearer {token}'})
    print('Status:', resp.status_code)
    print('Response:', resp.json)

    if resp.status_code == 201:
        event_id = resp.json['id']
        seats = Seat.query.filter_by(event_id=event_id).count()
        print('Seats generated:', seats)

        # Cancel event and verify status updates
        cancel_resp = client.post(f'/api/events/{event_id}/cancel', headers={'Authorization': f'Bearer {token}'})
        print('Cancel status:', cancel_resp.status_code)
        print('Cancel response:', cancel_resp.json)

        if cancel_resp.status_code == 200:
            event_after_cancel = Event.query.get(event_id)
            print('Event status after cancel:', event_after_cancel.status)
            assert event_after_cancel.status == 'cancelled', 'Event cancellation failed'

        # Verify canceled event is not returned in active events list
        list_resp = client.get('/api/events')
        if list_resp.status_code == 200:
            event_ids = [e['id'] for e in list_resp.json]
            print('Active event ids:', event_ids)
            assert event_id not in event_ids, 'Cancelled event should not appear in active event listing'


        # fetch events list using same credentials - the newly created event
        # should appear even if its date is very close to now or in the past
        resp_list = client.get('/api/events', headers={'Authorization': f'Bearer {token}'})
        print('List status:', resp_list.status_code)
        print('Events in list:', [e.get('id') for e in resp_list.json])
        assert resp_list.status_code == 200
        assert any(e.get('id') == event_id for e in resp_list.json), 'Creator event not in list'
    else:
        print('Failed to create event')
